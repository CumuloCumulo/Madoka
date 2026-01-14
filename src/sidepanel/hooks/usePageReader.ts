/**
 * usePageReader Hook
 * 读取当前页面内容
 */

import { useState, useCallback } from 'react'
import { useChatContext } from '../context/ChatContext'
import { getActiveTab, readCurrentPage } from '../../shared/messaging'

export function usePageReader() {
  const [reading, setReading] = useState(false)
  const { dispatch, addMessage } = useChatContext()

  const readPage = useCallback(async () => {
    setReading(true)

    try {
      const tab = await getActiveTab()

      if (!tab?.id) {
        addMessage({
          role: 'system',
          content: '无法获取当前页面',
        })
        return null
      }

      const result = await readCurrentPage(tab.id)

      if (result) {
        dispatch({
          type: 'SET_PAGE_CONTENT',
          payload: {
            title: result.title,
            url: result.url,
            markdown: result.content,
            length: result.length,
          },
        })

        addMessage({
          role: 'system',
          content: `📄 **页面已读取**\n\n**标题:** ${result.title}\n**URL:** ${result.url}\n**内容长度:** ${result.length} 字符\n\n💡 现在可以直接输入问题，我会基于页面内容回答`,
        })

        return result
      } else {
        addMessage({
          role: 'system',
          content: '读取页面失败：未获取到内容',
        })
        return null
      }
    } catch (e) {
      console.error('[PageReader] 读取页面失败:', e)
      addMessage({
        role: 'system',
        content: `读取页面失败: ${(e as Error).message}`,
      })
      return null
    } finally {
      setReading(false)
    }
  }, [dispatch, addMessage])

  return {
    reading,
    readPage,
  }
}
