/**
 * 通义 API 模块
 */

import type { SearchContext } from '../shared/types'
import { SYSTEM_PROMPT } from '../shared/constants'
import { getConfig } from './config'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * 构建结构化用户消息
 */
export function buildStructuredMessage(
  question: string,
  options: {
    pageContent?: string
    searchContext?: SearchContext
  } = {}
): string {
  const { pageContent, searchContext } = options

  if (!pageContent && !searchContext) {
    return question
  }

  const messageObj: Record<string, unknown> = {
    question,
  }

  if (pageContent) {
    messageObj.page_content = pageContent
  }

  if (searchContext && searchContext.results && searchContext.results.length > 0) {
    const maxPerResult = 4000
    const maxTotal = 20000
    let totalLength = 0

    const processedResults: {
      position: number
      title: string
      url: string
      content: string
    }[] = []

    for (const r of searchContext.results) {
      const content = r.fullContent || r.snippet || ''
      const availableLength = Math.min(maxPerResult, maxTotal - totalLength)

      if (availableLength <= 0) break

      const truncatedContent = content.slice(0, availableLength)
      totalLength += truncatedContent.length

      processedResults.push({
        position: processedResults.length + 1,
        title: r.title,
        url: r.link,
        content: truncatedContent,
      })
    }

    messageObj.search_results = {
      query: searchContext.query,
      engine: searchContext.engine,
      results: processedResults,
    }

    console.log(`[Madoka BG] 搜索结果总长度: ${totalLength} 字符, ${processedResults.length} 个结果`)
  }

  return JSON.stringify(messageObj, null, 2)
}

/**
 * 处理聊天请求，构建消息数组
 */
export async function handleChat(
  message: string,
  history: { role: string; content: string }[] = [],
  options: {
    pageContent?: string
    searchContext?: SearchContext
  } = {}
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }]

  // 添加历史消息
  history.forEach((msg) => {
    messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content })
  })

  // 构建结构化用户消息
  const userContent = buildStructuredMessage(message, options)
  messages.push({ role: 'user', content: userContent })

  return messages
}

/**
 * 调用通义 API（流式）
 */
export async function callTongyiAPI(
  messages: ChatMessage[],
  onChunk?: (chunk: string, content: string) => void
): Promise<string> {
  const config = await getConfig()

  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta?.content
          if (delta) {
            fullContent += delta
            if (onChunk) {
              onChunk(delta, fullContent)
            }
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }

  return fullContent
}

/**
 * 检测是否需要搜索
 */
export function shouldSearch(message: string): boolean {
  if (message.startsWith('/search ') || message.startsWith('/搜索 ')) {
    return true
  }

  const searchKeywords = [
    '最新',
    '今天',
    '现在',
    '当前',
    '新闻',
    '消息',
    '怎么样',
    '多少钱',
    '价格',
    '天气',
    '股票',
    '什么是',
    '如何',
    '教程',
    '方法',
  ]

  return searchKeywords.some((kw) => message.includes(kw))
}
