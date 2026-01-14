/**
 * 聊天上下文
 * 全局状态管理
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type {
  ChatState,
  ChatAction,
  Message,
  BackgroundMessage,
  SearchResult,
} from '../../shared/types'
import { onBackgroundMessage } from '../../shared/messaging'

// 初始状态
const initialState: ChatState = {
  messages: [],
  status: 'idle',
  isResponding: false,
  view: 'chat',
  currentEngine: 'bing',
  pageContent: null,
  searchStatus: null,
}

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      }

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id
            ? { ...msg, content: action.payload.content }
            : msg
        ),
      }

    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
        isResponding: action.payload !== 'idle',
      }

    case 'SET_VIEW':
      return {
        ...state,
        view: action.payload,
      }

    case 'SET_ENGINE':
      return {
        ...state,
        currentEngine: action.payload,
      }

    case 'SET_PAGE_CONTENT':
      return {
        ...state,
        pageContent: action.payload,
      }

    case 'SET_SEARCH_STATUS':
      return {
        ...state,
        searchStatus: action.payload,
      }

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      }

    case 'FINISH_RESPONSE':
      return {
        ...state,
        status: 'idle',
        isResponding: false,
        searchStatus: null,
        messages: state.messages.map((msg) =>
          msg.isStreaming
            ? { ...msg, content: action.payload, isStreaming: false }
            : msg
        ),
      }

    default:
      return state
  }
}

// Context 类型
interface ChatContextType {
  state: ChatState
  dispatch: React.Dispatch<ChatAction>
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, content: string) => void
  clearMessages: () => void
  setView: (view: 'chat' | 'settings') => void
  setEngine: (engine: 'bing' | 'google') => void
  startResponse: () => string
  finishResponse: (content: string) => void
  setSearchResults: (messageId: string, results: SearchResult[]) => void
}

const ChatContext = createContext<ChatContextType | null>(null)

// Provider
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const currentAssistantId = React.useRef<string | null>(null)

  // 添加消息
  const addMessage = useCallback(
    (message: Omit<Message, 'id' | 'timestamp'>): string => {
      const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const fullMessage: Message = {
        ...message,
        id,
        timestamp: Date.now(),
      }
      dispatch({ type: 'ADD_MESSAGE', payload: fullMessage })
      return id
    },
    []
  )

  // 更新消息
  const updateMessage = useCallback((id: string, content: string) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { id, content } })
  }, [])

  // 清空消息
  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' })
  }, [])

  // 设置视图
  const setView = useCallback((view: 'chat' | 'settings') => {
    dispatch({ type: 'SET_VIEW', payload: view })
  }, [])

  // 设置搜索引擎
  const setEngine = useCallback((engine: 'bing' | 'google') => {
    dispatch({ type: 'SET_ENGINE', payload: engine })
  }, [])

  // 开始响应
  const startResponse = useCallback((): string => {
    const id = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
    })
    currentAssistantId.current = id
    dispatch({ type: 'SET_STATUS', payload: 'responding' })
    return id
  }, [addMessage])

  // 完成响应
  const finishResponse = useCallback((content: string) => {
    dispatch({ type: 'FINISH_RESPONSE', payload: content })
    currentAssistantId.current = null
  }, [])

  // 设置搜索结果
  const setSearchResults = useCallback(
    (messageId: string, results: SearchResult[]) => {
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          id: messageId,
          content: state.messages.find((m) => m.id === messageId)?.content || '',
        },
      })
      // 将搜索结果添加到消息中
      const msg = state.messages.find((m) => m.id === messageId)
      if (msg) {
        const updatedMsg: Message = { ...msg, searchResults: results }
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { ...updatedMsg, id: `${messageId}-results` },
        })
      }
    },
    [state.messages]
  )

  // 监听 Background 消息
  useEffect(() => {
    const unsubscribe = onBackgroundMessage((message: BackgroundMessage) => {
      switch (message.action) {
        case 'streamChunk':
          if (currentAssistantId.current) {
            updateMessage(currentAssistantId.current, message.content)
          }
          break

        case 'streamEnd':
          finishResponse(message.content)
          break

        case 'searchResults':
          dispatch({ type: 'SET_SEARCH_STATUS', payload: `📖 正在读取 ${message.results.length} 个搜索结果...` })
          // 更新当前助手消息的搜索结果
          if (currentAssistantId.current) {
            const currentMessages = state.messages
            const msgIndex = currentMessages.findIndex(
              (m) => m.id === currentAssistantId.current
            )
            if (msgIndex !== -1) {
              const updatedMessages = [...currentMessages]
              updatedMessages[msgIndex] = {
                ...updatedMessages[msgIndex],
                searchResults: message.results,
              }
            }
          }
          break

        case 'status':
          dispatch({ type: 'SET_SEARCH_STATUS', payload: message.message })
          break

        case 'error':
          dispatch({ type: 'SET_STATUS', payload: 'idle' })
          addMessage({
            role: 'system',
            content: `❌ ${message.message}`,
          })
          break
      }
    })

    return unsubscribe
  }, [addMessage, updateMessage, finishResponse, state.messages])

  const value: ChatContextType = {
    state,
    dispatch,
    addMessage,
    updateMessage,
    clearMessages,
    setView,
    setEngine,
    startResponse,
    finishResponse,
    setSearchResults,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

// Hook
export function useChatContext(): ChatContextType {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
