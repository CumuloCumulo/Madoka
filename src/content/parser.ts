/**
 * Madoka Search Parser Module
 * 解析搜索引擎结果页面
 */

import type { SearchResult, SearchEngine } from '../shared/types'

/**
 * MadokaSearchParser - 解析搜索引擎结果页面
 */
export const MadokaSearchParser = {
  /**
   * 从 HTML 字符串解析搜索结果
   */
  parseFromHTML(html: string, engine: SearchEngine): SearchResult[] {
    const results: SearchResult[] = []
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    if (engine === 'bing') {
      // Bing 搜索结果选择器
      const items = doc.querySelectorAll('.b_algo')
      items.forEach((item, i) => {
        const link = item.querySelector('h2 a') as HTMLAnchorElement | null
        const snippet = item.querySelector('.b_caption p, .b_algoSlug')
        if (link) {
          const href = link.getAttribute('href')
          if (href && href.startsWith('http')) {
            results.push({
              title: link.textContent?.trim() || '',
              link: href,
              snippet: snippet?.textContent?.trim() || '',
              position: i + 1,
            })
          }
        }
      })
    } else if (engine === 'google') {
      // Google 搜索结果选择器
      const items = doc.querySelectorAll('div[data-surl], div[lang]')
      items.forEach((item, i) => {
        const link = item.querySelector('a[href]') as HTMLAnchorElement | null
        const h3 = item.querySelector('h3')
        if (link && h3) {
          const href = link.getAttribute('href')
          if (href && href.startsWith('http')) {
            results.push({
              title: h3.textContent?.trim() || '',
              link: href,
              snippet: item.querySelector('div.IsZvec, div[data-sncf]')?.textContent?.trim() || '',
              position: i + 1,
            })
          }
        }
      })
    }

    console.log('[Madoka SearchParser] 解析到结果:', results.length)
    return results
  },
}

// 挂载到 window
;(window as unknown as { MadokaSearchParser: typeof MadokaSearchParser }).MadokaSearchParser = MadokaSearchParser

console.log('[Madoka] SearchParser module loaded')
