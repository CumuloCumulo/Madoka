/**
 * Madoka Content Script
 * 处理页面读取和搜索结果解析
 */

import { MadokaReader } from './reader'
import { MadokaSearchParser } from './parser'
import type { SearchEngine } from '../shared/types'

// 防止在 iframe 中运行
if (window.top !== window.self) {
  console.log('[Madoka Content] 跳过 iframe')
} else if ((window as unknown as { MadokaContentInitialized?: boolean }).MadokaContentInitialized) {
  console.log('[Madoka Content] 已初始化，跳过')
} else {
  ;(window as unknown as { MadokaContentInitialized: boolean }).MadokaContentInitialized = true

  console.log('[Madoka Content] 已加载:', location.href)

  // 等待 Reader 模块加载
  function waitForReader(): Promise<void> {
    return new Promise((resolve) => {
      const checkReader = () => {
        if ((window as unknown as { MadokaReader?: typeof MadokaReader }).MadokaReader) {
          resolve()
        } else {
          setTimeout(checkReader, 100)
        }
      }
      checkReader()

      setTimeout(() => {
        console.warn('[Madoka Content] Reader 模块加载超时')
        resolve()
      }, 5000)
    })
  }

  // 监听消息
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    console.log('[Madoka Content] 收到消息:', request.action)

    if (request.action === 'readPage') {
      ;(async () => {
        try {
          await waitForReader()

          if ((window as unknown as { MadokaReader?: typeof MadokaReader }).MadokaReader) {
            const result = await MadokaReader.readCurrentPage()
            sendResponse({
              title: result.meta.title,
              url: result.meta.url,
              content: result.content,
              length: result.content.length,
            })
          } else {
            sendResponse({
              title: document.title,
              url: location.href,
              content: document.body.innerText.slice(0, 10000),
              length: document.body.innerText.length,
            })
          }
        } catch (e) {
          console.error('[Madoka Content] 读取页面失败:', e)
          sendResponse({
            error: (e as Error).message,
            title: document.title,
            url: location.href,
            content: '',
            length: 0,
          })
        }
      })()

      return true
    }

    if (request.action === 'parseSearch') {
      try {
        const results = MadokaSearchParser.parseFromHTML(
          request.html as string,
          request.engine as SearchEngine
        )
        sendResponse({ success: true, results })
      } catch (e) {
        console.error('[Madoka Content] 解析搜索结果失败:', e)
        sendResponse({ success: false, error: (e as Error).message, results: [] })
      }
      return true
    }

    if (request.action === 'readHTML') {
      ;(async () => {
        try {
          await waitForReader()

          if ((window as unknown as { MadokaReader?: typeof MadokaReader }).MadokaReader) {
            const result = await MadokaReader.readFromHTML(
              request.html as string,
              request.url as string
            )
            sendResponse({
              success: true,
              title: result.meta.title,
              url: request.url,
              content: result.content,
              markdown: result.markdown,
              length: result.content.length,
            })
          } else {
            const parser = new DOMParser()
            const doc = parser.parseFromString(request.html as string, 'text/html')
            const text = doc.body?.innerText || ''
            sendResponse({
              success: true,
              title: doc.title,
              url: request.url,
              content: text.slice(0, 10000),
              markdown: text.slice(0, 10000),
              length: text.length,
            })
          }
        } catch (e) {
          console.error('[Madoka Content] 读取 HTML 失败:', e)
          sendResponse({
            success: false,
            error: (e as Error).message,
            content: '',
            markdown: '',
          })
        }
      })()

      return true
    }

    return false
  })

  // 初始化
  async function init() {
    await waitForReader()
    console.log('[Madoka Content] Reader 模块已就绪')
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
}
