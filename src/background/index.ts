/**
 * Madoka Background Service Worker
 * 处理搜索、内容读取和 API 调用
 */

import type { SearchEngine, SearchContext } from '../shared/types'
import { getConfig, saveConfig } from './config'
import { searchAndRead } from './search'
import { handleChat, callTongyiAPI, shouldSearch } from './api'

/**
 * 消息处理器
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Madoka BG] 收到消息:', request.action)

  if (request.action === 'chat') {
    handleChatRequest(request, sender)
    return true
  }

  if (request.action === 'search') {
    searchAndRead(request.query, request.options)
      .then((results) => sendResponse({ success: true, data: results }))
      .catch((e: Error) => sendResponse({ success: false, error: e.message }))
    return true
  }

  if (request.action === 'getConfig') {
    getConfig().then((config) => sendResponse(config))
    return true
  }

  if (request.action === 'saveConfig') {
    saveConfig(request.config).then((success) => sendResponse({ success }))
    return true
  }

  return false
})

/**
 * 处理聊天请求
 */
async function handleChatRequest(
  request: {
    message: string
    history?: { role: string; content: string }[]
    forceSearch?: boolean
    engine?: SearchEngine
    pageContent?: string
    tabId?: number
  },
  sender: chrome.runtime.MessageSender
) {
  try {
    let searchContext: SearchContext | null = null
    let query = request.message
    const pageContent = request.pageContent || null

    const tabId = sender.tab?.id || request.tabId
    const isFromSidePanel = !sender.tab

    const sendToUI = (message: Record<string, unknown>) => {
      if (isFromSidePanel) {
        chrome.runtime.sendMessage(message).catch(() => {})
      } else if (tabId) {
        chrome.tabs.sendMessage(tabId, message).catch(() => {})
      }
    }

    console.log('[Madoka BG] 处理聊天请求:', {
      message: query,
      forceSearch: request.forceSearch,
      hasPageContent: !!pageContent,
      engine: request.engine,
      isFromSidePanel,
    })

    // 处理搜索前缀
    if (query.startsWith('/search ') || query.startsWith('/搜索 ')) {
      query = query.replace(/^\/(search|搜索)\s+/, '')
      console.log('[Madoka BG] 提取搜索关键词:', query)
    }

    // 检测是否需要搜索
    const needSearch = request.forceSearch || shouldSearch(request.message)
    console.log('[Madoka BG] 是否需要搜索:', needSearch)

    if (needSearch) {
      sendToUI({
        action: 'status',
        message: '🔍 正在搜索...',
      })

      try {
        searchContext = await searchAndRead(query, {
          engine: request.engine,
          tabId,
        })

        if (searchContext.results && searchContext.results.length > 0) {
          sendToUI({
            action: 'searchResults',
            results: searchContext.results.map((r) => ({
              title: r.title,
              link: r.link,
              snippet: r.snippet,
            })),
          })
        } else {
          console.warn('[Madoka BG] 搜索未返回结果')
          sendToUI({
            action: 'status',
            message: '⚠️ 搜索未找到结果，直接回答...',
          })
        }
      } catch (e) {
        console.error('[Madoka BG] 搜索失败:', e)
        sendToUI({
          action: 'status',
          message: '⚠️ 搜索失败，直接回答...',
        })
      }
    }

    // 构建消息
    const messages = await handleChat(query, request.history || [], {
      pageContent: pageContent || undefined,
      searchContext: searchContext || undefined,
    })

    // 调用 API
    let fullResponse = ''
    await callTongyiAPI(messages, (chunk, content) => {
      fullResponse = content
      sendToUI({
        action: 'streamChunk',
        chunk,
        content,
      })
    })

    // 发送完成消息
    sendToUI({
      action: 'streamEnd',
      content: fullResponse,
      searchContext: searchContext
        ? {
            query: searchContext.query,
            engine: searchContext.engine,
            count: searchContext.results.length,
          }
        : null,
    })
  } catch (e) {
    console.error('[Madoka BG] 处理聊天失败:', e)
    const sendToUI = (message: Record<string, unknown>) => {
      if (!sender.tab) {
        chrome.runtime.sendMessage(message).catch(() => {})
      } else {
        chrome.tabs.sendMessage(sender.tab.id!, message).catch(() => {})
      }
    }
    sendToUI({
      action: 'error',
      message: (e as Error).message,
    })
  }
}

// 安装/更新时初始化
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Madoka] 扩展已安装/更新')

  const config = await getConfig()
  await saveConfig(config)
})

// 点击扩展图标时打开 Side Panel
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId })
})

// 设置 Side Panel 行为
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[Madoka] 设置 Side Panel 行为失败:', error))

console.log('[Madoka] Background Service Worker 已启动')
