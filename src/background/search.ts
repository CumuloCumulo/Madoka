/**
 * 搜索模块
 */

import type { SearchResult, SearchEngine } from '../shared/types'
import { getConfig } from './config'

// /**
//  * 执行网络搜索（已弃用 - 使用 performSearchInRealTab 代替）
//  * 该方法使用硬编码 headers，容易被搜索引擎识别为爬虫
//  */
// export async function performSearch(
//   query: string,
//   engine: SearchEngine = 'bing'
// ): Promise<{ html: string; url: string; engine: SearchEngine }> {
//   let searchUrl: string

//   if (engine === 'google') {
//     searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`
//   } else {
//     searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=10`
//   }

//   console.log('[Madoka BG] 搜索:', searchUrl)

//   try {
//     const response = await fetch(searchUrl, {
//       headers: {
//         Accept: 'text/html,application/xhtml+xml',
//         'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
//         'User-Agent':
//           'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//       },
//     })

//     if (!response.ok) {
//       throw new Error(`搜索请求失败: ${response.status}`)
//     }

//     const html = await response.text()
//     return { html, url: searchUrl, engine }
//   } catch (e) {
//     console.error('[Madoka BG] 搜索失败:', e)
//     throw e
//   }
// }

/**
 * 等待标签页加载完成
 */
function waitForTabLoad(tabId: number, timeout = 10000): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false

    const listener = (id: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (id === tabId && changeInfo.status === 'complete' && !resolved) {
        resolved = true
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }

    chrome.tabs.onUpdated.addListener(listener)

    setTimeout(() => {
      if (!resolved) {
        resolved = true
        chrome.tabs.onUpdated.removeListener(listener)
        console.warn('[Madoka BG] 页面加载超时')
        resolve()
      }
    }, timeout)
  })
}

/**
 * 等待页面导航到包含指定路径的 URL
 */
function waitForNavigation(tabId: number, pathContains: string, timeout = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
    let resolved = false

    const listener = (id: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (id === tabId && changeInfo.status === 'complete' && tab.url?.includes(pathContains) && !resolved) {
        resolved = true
        chrome.tabs.onUpdated.removeListener(listener)
        console.log('[Madoka BG] 导航完成:', tab.url)
        resolve(tab.url)
      }
    }

    chrome.tabs.onUpdated.addListener(listener)

    setTimeout(() => {
      if (!resolved) {
        resolved = true
        chrome.tabs.onUpdated.removeListener(listener)
        reject(new Error('导航超时'))
      }
    }, timeout)
  })
}

/**
 * 搜索结果的页面内解析结果类型
 */
interface ParsedSearchResult {
  title: string
  link: string
  snippet: string
  position: number
}

/**
 * 在真实标签页中执行搜索（通过搜索框触发）
 * 模拟真实用户行为：打开首页 → 输入搜索词 → 按 Enter
 * 这样可以走主搜索管线，获得完整的搜索质量
 */
export async function performSearchInRealTab(
  query: string,
  engine: SearchEngine = 'bing'
): Promise<{ html: string; url: string; engine: SearchEngine; searchResults: ParsedSearchResult[] }> {
  // 1. 打开搜索引擎首页（不是搜索结果页）
  const homepageUrl = engine === 'google' 
    ? 'https://www.google.com/' 
    : 'https://www.bing.com/'

  console.log('[Madoka BG] 🔍 通过搜索框触发搜索:', query)
  console.log('[Madoka BG] 打开首页:', homepageUrl)

  let tab: chrome.tabs.Tab | null = null

  try {
    // 创建后台标签页
    tab = await chrome.tabs.create({
      url: homepageUrl,
      active: false,
    })

    // 2. 等待首页加载完成
    await waitForTabLoad(tab.id!)
    console.log('[Madoka BG] 首页加载完成')

    // 3. 注入脚本：在搜索框中输入并触发搜索
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: (searchQuery: string, searchEngine: string) => {
        // 找到搜索输入框
        let input: HTMLInputElement | HTMLTextAreaElement | null = null

        if (searchEngine === 'bing') {
          input = document.querySelector('input[name="q"], #sb_form_q') as HTMLInputElement
        } else if (searchEngine === 'google') {
          input = document.querySelector('textarea[name="q"], input[name="q"]') as HTMLInputElement
        }

        if (!input) {
          console.error('[Madoka] 找不到搜索输入框')
          throw new Error('找不到搜索输入框')
        }

        console.log('[Madoka] 找到搜索框:', input.tagName, input.name)

        // 聚焦输入框
        input.focus()
        input.click()

        // 清空现有内容
        input.value = ''

        // 设置搜索词
        input.value = searchQuery

        // 触发 input 事件（让搜索引擎知道有输入）
        input.dispatchEvent(new InputEvent('input', { 
          bubbles: true, 
          cancelable: true,
          data: searchQuery,
          inputType: 'insertText'
        }))

        // 触发 change 事件
        input.dispatchEvent(new Event('change', { bubbles: true }))

        console.log('[Madoka] 已输入搜索词:', searchQuery)

        // 短暂延迟后触发 Enter 键提交
        setTimeout(() => {
          // 创建并派发 keydown 事件
          const keydownEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          })
          input!.dispatchEvent(keydownEvent)

          // 创建并派发 keypress 事件
          const keypressEvent = new KeyboardEvent('keypress', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          })
          input!.dispatchEvent(keypressEvent)

          // 创建并派发 keyup 事件
          const keyupEvent = new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          })
          input!.dispatchEvent(keyupEvent)

          console.log('[Madoka] 已触发 Enter 键')

          // 如果键盘事件没有触发提交，尝试提交表单
          setTimeout(() => {
            const form = input!.closest('form')
            if (form && document.location.pathname !== '/search') {
              console.log('[Madoka] 键盘事件未触发导航，手动提交表单')
              form.submit()
            }
          }, 200)
        }, 100)
      },
      args: [query, engine],
    })

    // 4. 等待搜索结果页加载（URL 会变成 /search?q=...）
    await waitForNavigation(tab.id!, '/search')
    
    // 额外等待一下确保页面完全渲染
    await new Promise(resolve => setTimeout(resolve, 500))

    // 5. 读取搜索结果页 HTML 并直接在页面内用 DOM 解析搜索结果
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: (searchEngine: string) => {
        const html = document.documentElement.outerHTML
        const url = location.href
        
        // 直接在页面内用 DOM API 解析搜索结果
        const searchResults: Array<{
          title: string
          link: string
          snippet: string
          position: number
        }> = []
        
        if (searchEngine === 'bing') {
          // Bing 搜索结果解析
          const items = document.querySelectorAll('li.b_algo')
          console.log('[Madoka] 找到搜索结果项:', items.length)
          
          items.forEach((item, index) => {
            // 标题和链接
            const titleLink = item.querySelector('h2 a') as HTMLAnchorElement
            // 摘要（Bing 有多种可能的选择器）
            const snippetEl = item.querySelector(
              '.b_caption p, p.b_lineclamp2, p.b_lineclamp3, p.b_lineclamp4, .b_algoSlug'
            )
            
            if (titleLink && titleLink.href) {
              const result = {
                title: titleLink.textContent?.trim() || '',
                link: titleLink.href,
                snippet: snippetEl?.textContent?.trim() || '',
                position: index + 1,
              }
              console.log('[Madoka] 解析结果:', result.position, result.title.slice(0, 30))
              searchResults.push(result)
            }
          })
        } else if (searchEngine === 'google') {
          // Google 搜索结果解析
          const items = document.querySelectorAll('div.g')
          console.log('[Madoka] 找到搜索结果项:', items.length)
          
          items.forEach((item, index) => {
            const titleLink = item.querySelector('a h3')?.parentElement as HTMLAnchorElement
            const snippetEl = item.querySelector('div[data-sncf], div.VwiC3b')
            
            if (titleLink && titleLink.href && !titleLink.href.includes('google.com')) {
              searchResults.push({
                title: titleLink.querySelector('h3')?.textContent?.trim() || '',
                link: titleLink.href,
                snippet: snippetEl?.textContent?.trim() || '',
                position: index + 1,
              })
            }
          })
        }
        
        console.log('[Madoka] DOM 解析完成，共', searchResults.length, '个结果')
        return { html, url, searchResults }
      },
      args: [engine],
    })

    const data = results[0].result as { 
      html: string
      url: string
      searchResults: ParsedSearchResult[]
    }

    // 6. 关闭标签页
    await chrome.tabs.remove(tab.id!)
    
    console.log('[Madoka BG] ✅ 搜索框触发成功')
    console.log('[Madoka BG] 最终 URL:', data.url)
    console.log('[Madoka BG] HTML 长度:', data.html.length)
    console.log('[Madoka BG] DOM 解析结果数:', data.searchResults.length)

    return { html: data.html, url: data.url, engine, searchResults: data.searchResults }
  } catch (e) {
    console.error('[Madoka BG] 搜索框触发失败:', e)
    
    // 确保关闭标签页
    if (tab?.id) {
      try {
        await chrome.tabs.remove(tab.id)
      } catch {
        // 忽略关闭失败
      }
    }
    
    throw e
  }
}

// /**
//  * 获取网页内容（已弃用 - 使用 fetchPageInRealTab 代替）
//  */
// export async function fetchPage(url: string): Promise<string> {
//   console.log('[Madoka BG] 获取页面:', url)

//   try {
//     const response = await fetch(url, {
//       headers: {
//         Accept: 'text/html,application/xhtml+xml',
//         'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
//         'User-Agent':
//           'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//       },
//     })

//     if (!response.ok) {
//       throw new Error(`页面请求失败: ${response.status}`)
//     }

//     return await response.text()
//   } catch (e) {
//     console.error('[Madoka BG] 获取页面失败:', e)
//     throw e
//   }
// }

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

// /**
//  * 在内容脚本中解析搜索结果（已弃用 - 现在在搜索页面内直接用 DOM 解析）
//  */
// async function parseSearchInContentScript(
//   tabId: number,
//   html: string,
//   engine: SearchEngine
// ): Promise<SearchResult[]> {
//   try {
//     const response = await chrome.tabs.sendMessage(tabId, {
//       action: 'parseSearch',
//       html,
//       engine,
//     })

//     if (response && response.success) {
//       console.log('[Madoka BG] 内容脚本解析成功:', response.results.length, '个结果')
//       return response.results
//     }
//     return []
//   } catch (e) {
//     console.warn('[Madoka BG] 内容脚本解析失败:', (e as Error).message)
//     return []
//   }
// }

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
 * 还原 Bing Tracking Link 为真实 URL
 * Bing 搜索结果的 href 是追踪链接，格式如：
 * https://www.bing.com/ck/a?!&&p=xxx&u=a1aHR0cHM6Ly93d3cuZXhhbXBsZS5jb20=
 * 其中 u= 参数是 Base64 编码的真实 URL，前缀为 'a1'
 */
function decodeBingTrackingUrl(trackingUrl: string): string {
  // 如果不是 Bing tracking link，直接返回原 URL
  if (!trackingUrl.includes('bing.com/ck/a')) {
    return trackingUrl
  }

  try {
    const url = new URL(trackingUrl)
    const uParam = url.searchParams.get('u')
    
    if (uParam && uParam.startsWith('a1')) {
      // 去掉 'a1' 前缀后进行 Base64 解码
      const base64Part = uParam.slice(2)
      const decodedUrl = atob(base64Part)
      
      // 验证解码后是有效的 URL
      if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
        console.log('[Madoka BG] 🔗 直链还原:', trackingUrl.slice(0, 50) + '...', '→', decodedUrl)
        return decodedUrl
      }
    }
  } catch (e) {
    console.warn('[Madoka BG] 直链还原失败:', (e as Error).message)
  }
  
  // 解码失败则返回原链接
  return trackingUrl
}

/**
 * 批量还原搜索结果中的 Bing Tracking Links
 */
function normalizeSearchResultLinks(results: SearchResult[], engine: SearchEngine): SearchResult[] {
  if (engine !== 'bing') {
    return results
  }
  
  return results.map(result => ({
    ...result,
    link: decodeBingTrackingUrl(result.link)
  }))
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

  // 1. 执行搜索（使用真实标签页方案，同时在页面内解析搜索结果）
  const searchData = await performSearchInRealTab(query, engine)

  // 2. 优先使用页面内 DOM 解析的结果
  let results: SearchResult[] = searchData.searchResults.map(r => ({
    title: r.title,
    link: r.link,
    snippet: r.snippet,
    position: r.position,
  }))

  console.log('[Madoka BG] DOM 解析结果数:', results.length)

  // 3. 如果 DOM 解析失败，尝试正则表达式备用方案
  if (results.length === 0) {
    console.log('[Madoka BG] DOM 解析无结果，使用正则表达式备用方案')
    results = regexParseSearch(searchData.html, engine)
  }

  console.log('[Madoka BG] 最终搜索结果数:', results.length)

  // 4. 还原 Bing Tracking Links 为真实 URL（绕过追踪系统，避免被识别为自动化点击）
  results = normalizeSearchResultLinks(results, engine)

  // 5. 限制结果数量
  results = results.slice(0, maxResults)

  // 6. 并行获取每个结果的内容（使用真实标签页方案）
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
