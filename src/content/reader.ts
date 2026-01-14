/**
 * Madoka Reader Module
 * 网页内容提取模块，输出 Markdown 格式
 */

import TurndownService from 'turndown'

// Readability 类型声明
interface ReadabilityResult {
  title: string
  content: string
  textContent: string
  length: number
  byline: string
}

interface ReadabilityConstructor {
  new (doc: Document, options?: { charThreshold?: number; keepClasses?: boolean }): {
    parse(): ReadabilityResult | null
  }
}

declare const Readability: ReadabilityConstructor

/**
 * 等待 DOM 稳定
 */
const waitForDomStable = (timeout = 3000): Promise<void> =>
  new Promise((resolve) => {
    let lastMutation = Date.now()
    let resolved = false

    const observer = new MutationObserver(() => {
      lastMutation = Date.now()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })

    const check = () => {
      if (resolved) return
      if (Date.now() - lastMutation > 500) {
        resolved = true
        observer.disconnect()
        console.log('[Madoka Reader] ✅ DOM已稳定')
        resolve()
      } else {
        setTimeout(check, 200)
      }
    }

    setTimeout(check, 200)
    setTimeout(() => {
      if (!resolved) {
        resolved = true
        observer.disconnect()
        console.log('[Madoka Reader] ⏰ 等待超时，继续处理')
        resolve()
      }
    }, timeout)
  })

/**
 * EnhancedReaderV3 类
 */
class EnhancedReaderV3 {
  private imageCounter = 0
  private turndown: TurndownService | null = null

  constructor() {
    this.initTurndown()
  }

  private initTurndown() {
    if (typeof TurndownService === 'undefined') {
      console.warn('[Madoka Reader] TurndownService not loaded')
      return
    }

    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '*',
      emDelimiter: '*',
      hr: '---',
    })

    this.setupRules()
  }

  private setupRules() {
    if (!this.turndown) return

    // 图片处理
    this.turndown.addRule('numberedImages', {
      filter: 'img',
      replacement: (_content, node) => {
        const img = node as HTMLImageElement
        const alt = img.alt || img.title || ''
        const src =
          img.src ||
          img.dataset?.src ||
          img.dataset?.lazySrc ||
          img.dataset?.original ||
          img.getAttribute('data-src') ||
          ''

        if (!src || src.startsWith('data:')) {
          return alt ? `[图片: ${alt}]` : ''
        }

        const skipPatterns = ['ajax-loader', 'spacer', 'blank.gif', 'placeholder', '1x1.']
        if (skipPatterns.some((p) => src.toLowerCase().includes(p))) {
          return alt ? `[图片: ${alt}]` : ''
        }

        this.imageCounter++

        try {
          const fullUrl = new URL(src, document.baseURI).href
          const imageLabel = alt ? `Image ${this.imageCounter}: ${alt}` : `Image ${this.imageCounter}`
          return `![${imageLabel}](${fullUrl})`
        } catch {
          return alt ? `[图片: ${alt}]` : ''
        }
      },
    })

    // 链接处理
    this.turndown.addRule('linksWithTitle', {
      filter: 'a',
      replacement: (content, node) => {
        const a = node as HTMLAnchorElement
        const href = a.getAttribute('href')
        if (!href || href.startsWith('javascript:') || href === '#') {
          return content
        }

        try {
          const fullUrl = new URL(href, document.baseURI).href
          const text = content.trim() || a.title || fullUrl
          const title = a.title || ''

          if (title && title !== text) {
            return `[${text}](${fullUrl} "${title}")`
          }
          return `[${text}](${fullUrl})`
        } catch {
          return content
        }
      },
    })

    // 移除无用元素
    this.turndown.remove(['script', 'style', 'noscript', 'input', 'button', 'form', 'select', 'textarea'])
  }

  /**
   * 双重提取策略
   */
  extractContent(doc: Document = document): {
    title: string
    content: string
    textContent: string
    length: number
    byline: string
    usedMethod: string
  } {
    const docClone = doc.cloneNode(true) as Document
    let readabilityResult: ReadabilityResult | null = null

    if (typeof Readability !== 'undefined') {
      try {
        const reader = new Readability(docClone, {
          charThreshold: 50,
          keepClasses: false,
        })
        readabilityResult = reader.parse()
      } catch (e) {
        console.warn('[Madoka Reader] Readability解析失败:', e)
      }
    }

    const bodyClone = doc.body.cloneNode(true) as HTMLElement
    const minimalRemoveSelectors = [
      'script',
      'style',
      'noscript',
      'svg',
      'canvas',
      '.advertisement',
      '.ad',
      '.ads',
      '.advert',
      '[role="complementary"]',
    ]
    bodyClone.querySelectorAll(minimalRemoveSelectors.join(', ')).forEach((el) => el.remove())

    const directHTML = bodyClone.innerHTML
    const directText = bodyClone.innerText
    const directLen = directText.length

    if (readabilityResult && readabilityResult.textContent) {
      const readabilityLen = readabilityResult.textContent.length
      const isTooShort = readabilityLen < 2000 && directLen > readabilityLen
      const isRatioTooLow = readabilityLen < directLen * 0.5

      console.log(
        `[Madoka Reader] 📊 Readability: ${readabilityLen}字符, Direct: ${directLen}字符, 比例: ${((readabilityLen / directLen) * 100).toFixed(1)}%`
      )

      if (isTooShort || isRatioTooLow) {
        console.log('[Madoka Reader] 📊 Readability结果不足，使用完整body提取')
        return {
          title: doc.title,
          content: directHTML,
          textContent: directText,
          length: directLen,
          byline: '',
          usedMethod: 'direct',
        }
      }

      return {
        title: readabilityResult.title,
        content: readabilityResult.content,
        textContent: readabilityResult.textContent,
        length: readabilityResult.length,
        byline: readabilityResult.byline,
        usedMethod: 'readability',
      }
    }

    return {
      title: doc.title,
      content: directHTML,
      textContent: directText,
      length: directLen,
      byline: '',
      usedMethod: 'fallback',
    }
  }

  /**
   * 元信息提取
   */
  getMeta(doc: Document = document, url: string = location.href) {
    const getMetaContent = (names: string[]) => {
      for (const name of names) {
        const el = doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
        if (el?.getAttribute('content')) return el.getAttribute('content')
      }
      return ''
    }

    return {
      title: doc.title,
      url,
      description: getMetaContent(['description', 'og:description', 'twitter:description']),
      author: getMetaContent(['author', 'article:author']),
      publishedTime:
        getMetaContent(['article:published_time', 'datePublished', 'pubdate']) ||
        doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
        '',
      siteName: getMetaContent(['og:site_name']) || new URL(url).hostname,
    }
  }

  /**
   * 后处理 Markdown
   */
  postprocessMarkdown(markdown: string): string {
    return markdown
      .replace(/\n{4,}/g, '\n\n\n')
      .replace(/\n{3,}(\*|-|\d+\.)\s/g, '\n\n$1 ')
      .replace(/(#{1,6}\s[^\n]+)\n{3,}/g, '$1\n\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}(\|)/g, '\n\n$1')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '\n')
      .trim()
  }

  /**
   * 构建输出头
   */
  buildHeader(
    meta: ReturnType<typeof this.getMeta>,
    titleLine: string
  ): string {
    const headerParts = [`Title: ${titleLine}`, '', `URL Source: ${meta.url}`, '']

    if (meta.author) {
      headerParts.push(`Author: ${meta.author}`, '')
    }
    if (meta.publishedTime) {
      headerParts.push(`Published: ${meta.publishedTime}`, '')
    }

    headerParts.push('Markdown Content:', titleLine, '='.repeat(Math.min(titleLine.length, 15)), '')

    return headerParts.join('\n')
  }

  /**
   * 主入口
   */
  async read(doc: Document = document, url: string = location.href) {
    this.imageCounter = 0

    const meta = this.getMeta(doc, url)
    const article = this.extractContent(doc)

    console.log(`[Madoka Reader] 📊 提取方法: ${article.usedMethod}, 内容长度: ${article.length || article.textContent?.length}`)

    if (!this.turndown) {
      return {
        meta,
        article,
        content: article.textContent,
        markdown: article.textContent,
        error: 'TurndownService not available',
      }
    }

    let markdown = this.turndown.turndown(article.content || '')
    markdown = this.postprocessMarkdown(markdown)

    const titleLine = article.title || meta.title
    const header = this.buildHeader(meta, titleLine)

    return {
      meta,
      article,
      content: header + markdown,
      markdown,
      imageCount: this.imageCounter,
    }
  }

  /**
   * 从 HTML 字符串读取
   */
  async readFromHTML(html: string, baseUrl: string) {
    this.imageCounter = 0

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const base = doc.createElement('base')
    base.href = baseUrl
    doc.head.prepend(base)

    return this.read(doc, baseUrl)
  }
}

// 导出模块
let readerInstance: EnhancedReaderV3 | null = null

export const MadokaReader = {
  getInstance() {
    if (!readerInstance) {
      readerInstance = new EnhancedReaderV3()
    }
    return readerInstance
  },

  async readCurrentPage() {
    console.log('[Madoka Reader] ⏳ 等待动态内容加载...')
    await waitForDomStable(3000)

    const reader = this.getInstance()
    const result = await reader.read()

    console.log('[Madoka Reader] 📄 ===== 读取完成 =====')
    console.log(`[Madoka Reader] 📌 标题: ${result.meta.title}`)
    console.log(`[Madoka Reader] 📊 提取方法: ${result.article.usedMethod}`)
    console.log(`[Madoka Reader] 📝 内容长度: ${result.content.length} 字符`)

    return result
  },

  async readFromHTML(html: string, baseUrl: string) {
    return this.getInstance().readFromHTML(html, baseUrl)
  },
}

// 挂载到 window
;(window as unknown as { MadokaReader: typeof MadokaReader }).MadokaReader = MadokaReader

console.log('[Madoka] Reader module loaded')
