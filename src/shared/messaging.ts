/**
 * Chrome Messaging API 封装
 */

import type {
  AppConfig,
  ChatRequest,
  BackgroundMessage,
  SearchEngine,
} from './types'

/**
 * 发送消息到 Background Service Worker
 */
export async function sendToBackground<T = unknown>(
  message: Record<string, unknown>
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve(response as T)
      }
    })
  })
}

/**
 * 发送消息到 Content Script
 */
export async function sendToContentScript<T = unknown>(
  tabId: number,
  message: Record<string, unknown>
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve(response as T)
      }
    })
  })
}

/**
 * 获取当前活动标签页
 */
export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab || null
}

/**
 * 获取配置
 */
export async function getConfig(): Promise<AppConfig> {
  return sendToBackground<AppConfig>({ action: 'getConfig' })
}

/**
 * 保存配置
 */
export async function saveConfig(
  config: Partial<AppConfig>
): Promise<{ success: boolean }> {
  return sendToBackground<{ success: boolean }>({
    action: 'saveConfig',
    config,
  })
}

/**
 * 发送聊天请求
 */
export function sendChatRequest(
  message: string,
  options: {
    history: { role: string; content: string }[]
    forceSearch: boolean
    engine: SearchEngine
    pageContent?: string
    tabId?: number
  }
): void {
  const request: ChatRequest = {
    action: 'chat',
    message,
    history: options.history,
    forceSearch: options.forceSearch,
    engine: options.engine,
    pageContent: options.pageContent,
    tabId: options.tabId,
  }

  chrome.runtime.sendMessage(request)
}

/**
 * 监听来自 Background 的消息
 */
export function onBackgroundMessage(
  callback: (message: BackgroundMessage) => void
): () => void {
  const listener = (message: BackgroundMessage) => {
    callback(message)
  }

  chrome.runtime.onMessage.addListener(listener)

  return () => {
    chrome.runtime.onMessage.removeListener(listener)
  }
}

/**
 * 读取当前页面内容
 */
export async function readCurrentPage(tabId: number): Promise<{
  title: string
  url: string
  content: string
  length: number
} | null> {
  try {
    const response = await sendToContentScript<{
      title: string
      url: string
      content: string
      length: number
      error?: string
    }>(tabId, { action: 'readPage' })

    if (response.error) {
      console.error('[Messaging] 读取页面失败:', response.error)
      return null
    }

    return response
  } catch (e) {
    console.error('[Messaging] 读取页面失败:', e)
    return null
  }
}
