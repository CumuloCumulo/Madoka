/**
 * 搜索模块
 */

import type { SearchResult, SearchEngine } from '../shared/types'
import { getConfig } from './config'

/**
 * 执行网络搜索（已弃用 - 使用 performSearchInRealTab 代替）
 * 该方法使用硬编码 headers，容易被搜索引擎识别为爬虫
 */
export async function performSearch(
  query: string,
  engine: SearchEngine = 'bing'
): Promise<{ html: string; url: string; engine: SearchEngine }> {
  let searchUrl: string

  if (engine === 'google') {
    searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`
  } else {
    searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=10`
  }

  console.log('[Madoka BG] 搜索:', searchUrl)

  try {
    const response = await fetch(searchUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`搜索请求失败: ${response.status}`)
    }

    const html = await response.text()
    return { html, url: searchUrl, engine }
  } catch (e) {
    console.error('[Madoka BG] 搜索失败:', e)
    throw e
  }
}

/**
 * 在真实标签页中执行搜索（推荐方案）
 * 使用真实浏览器上下文，自动携带 Cookie 和完整浏览器指纹，避免被识别为爬虫
 */
export async function performSearchInRealTab(
  query: string,
  engine: SearchEngine = 'bing'
): Promise<{ html: string; url: string; engine: SearchEngine }> {
  let searchUrl: string

  if (engine === 'google') {
    searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`
  } else {
    searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=10`
  }

  console.log('[Madoka BG] 在真实标签页中搜索:', searchUrl)

  try {
    // 1. 创建一个新标签页（后台打开，不激活）
    const tab = await chrome.tabs.create({
      url: searchUrl,
      active: false, // 不切换到该标签页，用户无感知
    })

    // 2. 等待页面加载完成
    await new Promise<void>((resolve) => {
      let resolved = false
      
      const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          if (!resolved) {
            resolved = true
            chrome.tabs.onUpdated.removeListener(listener)
            console.log('[Madoka BG] 页面加载完成')
            resolve()
          }
        }
      }
      
      chrome.tabs.onUpdated.addListener(listener)

      // 超时保护（10秒）
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          chrome.tabs.onUpdated.removeListener(listener)
          console.warn('[Madoka BG] 页面加载超时，继续处理')
          resolve()
        }
      }, 10000)
    })

    // 3. 从标签页读取 HTML
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: () => {
        return {
          html: document.documentElement.outerHTML,
          url: location.href,
        }
      },
    })

    const data = results[0].result as { html: string; url: string }

    // 4. 关闭标签页
    await chrome.tabs.remove(tab.id!)
    console.log('[Madoka BG] ✅ 真实标签页搜索成功，HTML 长度:', data.html.length)

    return { html: data.html, url: data.url, engine }
  } catch (e) {
    console.error('[Madoka BG] 真实标签页搜索失败:', e)
    throw e
  }
}

/**
 * 获取网页内容（已弃用 - 使用 fetchPageInRealTab 代替）
 */
export async function fetchPage(url: string): Promise<string> {
  console.log('[Madoka BG] 获取页面:', url)

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`页面请求失败: ${response.status}`)
    }

    return await response.text()
  } catch (e) {
    console.error('[Madoka BG] 获取页面失败:', e)
    throw e
  }
}

/**
 * 在真实标签页中获取网页内容（推荐方案）
 */
export async function fetchPageInRealTab(url: string): Promise<string> {
  console.log('[Madoka BG] 在真实标签页中获取页面:', url)

  try {
    // 创建后台标签页
    const tab = await chrome.tabs.create({
      url: url,
      active: false,
    })

    // 等待页面加载完成
    await new Promise<void>((resolve) => {
      let resolved = false
      
      const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          if (!resolved) {
            resolved = true
            chrome.tabs.onUpdated.removeListener(listener)
            resolve()
          }
        }
      }
      
      chrome.tabs.onUpdated.addListener(listener)

      // 超时保护
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          chrome.tabs.onUpdated.removeListener(listener)
          resolve()
        }
      }, 10000)
    })

    // 读取 HTML
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: () => document.documentElement.outerHTML,
    })

    const html = results[0].result as string

    // 关闭标签页
    await chrome.tabs.remove(tab.id!)
    console.log('[Madoka BG] ✅ 真实标签页获取成功，HTML 长度:', html.length)

    return html
  } catch (e) {
    console.error('[Madoka BG] 真实标签页获取失败:', e)
    throw e
  }
}

/**
 * 在内容脚本中解析搜索结果
 */
async function parseSearchInContentScript(
  tabId: number,
  html: string,
  engine: SearchEngine
): Promise<SearchResult[]> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'parseSearch',
      html,
      engine,
    })

    if (response && response.success) {
      console.log('[Madoka BG] 内容脚本解析成功:', response.results.length, '个结果')
      return response.results
    }
    return []
  } catch (e) {
    console.warn('[Madoka BG] 内容脚本解析失败:', (e as Error).message)
    return []
  }
}

/**
 * 在内容脚本中读取 HTML 内容
 */
async function readHTMLInContentScript(
  tabId: number,
  html: string,
  url: string
): Promise<{ markdown: string } | null> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'readHTML',
      html,
      url,
    })

    if (response && response.success) {
      console.log('[Madoka BG] 内容脚本读取成功:', response.content?.length || 0, '字符')
      return response
    }
    return null
  } catch (e) {
    console.warn('[Madoka BG] 内容脚本读取失败:', (e as Error).message)
    return null
  }
}

/**
 * 解码 HTML 实体
 */
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/**
 * 正则表达式解析搜索结果（备用方案）
 */
function regexParseSearch(html: string, engine: SearchEngine): SearchResult[] {
  const results: SearchResult[] = []

  if (engine === 'bing') {
    const bingPattern =
      /<li class="b_algo"[^>]*>[\s\S]*?<h2><a href="([^"]+)"[^>]*>([^<]+)<\/a><\/h2>[\s\S]*?(?:<p>([^<]*)<\/p>)?/gi
    let match
    let position = 0
    while ((match = bingPattern.exec(html)) !== null && position < 20) {
      const href = match[1]
      if (href && href.startsWith('http')) {
        position++
        results.push({
          title: decodeHTMLEntities(match[2] || ''),
          link: href,
          snippet: decodeHTMLEntities(match[3] || ''),
          position,
        })
      }
    }
  } else if (engine === 'google') {
    const googlePattern =
      /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/gi
    let match
    let position = 0
    while ((match = googlePattern.exec(html)) !== null && position < 20) {
      const href = match[1]
      if (href && !href.includes('google.com') && !href.includes('youtube.com/results')) {
        position++
        results.push({
          title: decodeHTMLEntities(match[2] || ''),
          link: href,
          snippet: '',
          position,
        })
      }
    }
  }

  console.log('[Madoka BG] 正则解析到结果:', results.length)
  return results
}

/**
 * 简单的正则内容提取（备用方案）
 */
function simpleExtractContent(html: string, _url: string): { title: string; content: string } {
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? decodeHTMLEntities(titleMatch[1]) : ''

  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  text = decodeHTMLEntities(text)

  console.log(`[Madoka BG] 📊 简单提取: ${text.length} 字符`)

  return {
    title,
    content: text.slice(0, 8000) || '',
  }
}

/**
 * 完整的搜索和读取流程
 */
export async function searchAndRead(
  query: string,
  options: {
    tabId?: number
    engine?: SearchEngine
    maxResults?: number
  } = {}
): Promise<{ query: string; engine: SearchEngine; results: SearchResult[] }> {
  const config = await getConfig()
  const engine = options.engine || config.searchEngine
  const maxResults = options.maxResults || config.maxResults
  const tabId = options.tabId

  console.log('[Madoka BG] 开始搜索:', query, '引擎:', engine)

  // 1. 执行搜索（使用真实标签页方案）
  const searchData = await performSearchInRealTab(query, engine)

  // 2. 解析搜索结果
  let results: SearchResult[] = []

  if (tabId) {
    results = await parseSearchInContentScript(tabId, searchData.html, engine)
  }

  if (results.length === 0) {
    console.log('[Madoka BG] 使用正则表达式备用方案')
    results = regexParseSearch(searchData.html, engine)
  }

  console.log('[Madoka BG] 搜索结果数:', results.length)

  // 3. 限制结果数量
  results = results.slice(0, maxResults)

  // 4. 并行获取每个结果的内容（使用真实标签页方案）
  const contentPromises = results.map(async (result, index) => {
    try {
      console.log(`[Madoka BG] 读取页面 [${index + 1}/${results.length}]:`, result.title)
      const html = await fetchPageInRealTab(result.link)

      let content = ''

      if (tabId) {
        const readerResult = await readHTMLInContentScript(tabId, html, result.link)
        if (readerResult && readerResult.markdown) {
          content = readerResult.markdown
          console.log(`[Madoka BG] Reader 解析成功: ${content.length} 字符`)
        }
      }

      if (!content) {
        const extracted = simpleExtractContent(html, result.link)
        content = extracted.content
        console.log(`[Madoka BG] 备用提取: ${content.length} 字符`)
      }

      return {
        ...result,
        fullContent: content,
      }
    } catch (e) {
      console.warn('[Madoka BG] 获取内容失败:', result.link, (e as Error).message)
      return {
        ...result,
        fullContent: result.snippet,
      }
    }
  })

  // 等待所有内容获取完成（带超时）
  const timeout = 15000
  const resultsWithContent = await Promise.all(
    contentPromises.map((p) =>
      Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), timeout))])
    )
  )

  const finalResults = resultsWithContent.filter((r): r is SearchResult & { fullContent: string } => r !== null) as SearchResult[]

  console.log('[Madoka BG] 完成读取:', finalResults.length, '个结果')

  return {
    query,
    engine,
    results: finalResults,
  }
}
