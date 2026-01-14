/**
 * 共享类型定义
 */

// 消息类型
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  searchResults?: SearchResult[]
  isStreaming?: boolean
}

// 搜索结果
export interface SearchResult {
  title: string
  link: string
  snippet: string
  position: number
  fullContent?: string
}

// 搜索上下文
export interface SearchContext {
  query: string
  engine: SearchEngine
  results: SearchResult[]
}

// 搜索引擎
export type SearchEngine = 'bing' | 'google'

// 应用配置
export interface AppConfig {
  apiKey: string
  apiEndpoint: string
  model: string
  searchEngine: SearchEngine
  maxResults: number
  maxContentLength: number
}

// 默认配置
export const DEFAULT_CONFIG: AppConfig = {
  apiKey: 'sk-b8570d1d70dd4968afad113dc334a254',
  apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  model: 'qwen-plus',
  searchEngine: 'bing',
  maxResults: 5,
  maxContentLength: 400000,
}

// 视图状态
export type ViewState = 'chat' | 'settings'

// 聊天状态
export type ChatStatus = 'idle' | 'searching' | 'responding'

// 聊天上下文状态
export interface ChatState {
  messages: Message[]
  status: ChatStatus
  isResponding: boolean
  view: ViewState
  currentEngine: SearchEngine
  pageContent: PageContent | null
  searchStatus: string | null
}

// 页面内容
export interface PageContent {
  title: string
  url: string
  markdown: string
  length: number
}

// 聊天动作
export type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'SET_STATUS'; payload: ChatStatus }
  | { type: 'SET_VIEW'; payload: ViewState }
  | { type: 'SET_ENGINE'; payload: SearchEngine }
  | { type: 'SET_PAGE_CONTENT'; payload: PageContent | null }
  | { type: 'SET_SEARCH_STATUS'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'FINISH_RESPONSE'; payload: string }

// Chrome 消息类型
export interface ChromeMessage {
  action: string
  [key: string]: unknown
}

// Chat 请求
export interface ChatRequest {
  action: 'chat'
  message: string
  history: { role: string; content: string }[]
  forceSearch: boolean
  engine: SearchEngine
  pageContent?: string
  tabId?: number
}

// 流式响应
export interface StreamChunkMessage {
  action: 'streamChunk'
  chunk: string
  content: string
}

export interface StreamEndMessage {
  action: 'streamEnd'
  content: string
  searchContext?: {
    query: string
    engine: SearchEngine
    count: number
  }
}

export interface SearchResultsMessage {
  action: 'searchResults'
  results: SearchResult[]
}

export interface StatusMessage {
  action: 'status'
  message: string
}

export interface ErrorMessage {
  action: 'error'
  message: string
}

export type BackgroundMessage =
  | StreamChunkMessage
  | StreamEndMessage
  | SearchResultsMessage
  | StatusMessage
  | ErrorMessage
