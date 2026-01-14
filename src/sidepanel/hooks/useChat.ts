/**
 * useChat Hook
 * 处理聊天逻辑
 */

import { useCallback } from 'react'
import { useChatContext } from '../context/ChatContext'
import { sendChatRequest, getActiveTab } from '../../shared/messaging'
import { SEARCH_PREFIXES } from '../../shared/constants'

export function useChat() {
  const { state, addMessage, startResponse, dispatch } = useChatContext()

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isResponding) return

      // 检查是否是强制搜索
      const forceSearch = SEARCH_PREFIXES.some((prefix) => content.startsWith(prefix))

      // 添加用户消息
      addMessage({
        role: 'user',
        content,
      })

      // 设置状态
      dispatch({ type: 'SET_STATUS', payload: forceSearch ? 'searching' : 'responding' })

      // 开始助手响应
      startResponse()

      // 获取当前标签页
      const tab = await getActiveTab()

      // 构建历史消息
      const history = state.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      // 发送聊天请求
      sendChatRequest(content, {
        history,
        forceSearch,
        engine: state.currentEngine,
        pageContent: state.pageContent?.markdown,
        tabId: tab?.id,
      })

      // 清除页面内容
      if (state.pageContent) {
        dispatch({ type: 'SET_PAGE_CONTENT', payload: null })
      }
    },
    [state, addMessage, startResponse, dispatch]
  )

  return {
    sendMessage,
    isResponding: state.isResponding,
    status: state.status,
    searchStatus: state.searchStatus,
  }
}
