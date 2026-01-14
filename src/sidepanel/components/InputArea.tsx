/**
 * InputArea 组件
 * 输入区域 - 输入框和发送按钮
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '../hooks/useChat'
import { usePageReader } from '../hooks/usePageReader'
import { useChatContext } from '../context/ChatContext'
import { variants } from '../styles/animations'

export function InputArea() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { sendMessage, isResponding, searchStatus } = useChat()
  const { readPage, reading } = usePageReader()
  const { state } = useChatContext()

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSend = () => {
    if (!input.trim() || isResponding) return
    sendMessage(input)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleShortcut = (action: 'search' | 'read' | 'summary') => {
    if (action === 'search') {
      setInput('/search ')
      textareaRef.current?.focus()
    } else if (action === 'read') {
      readPage()
    } else if (action === 'summary') {
      readPage().then((result) => {
        if (result) {
          setInput('请总结这个页面的主要内容')
          setTimeout(() => handleSend(), 100)
        }
      })
    }
  }

  return (
    <div className="border-t border-madoka-border bg-white">
      {/* 搜索状态 */}
      <AnimatePresence>
        {searchStatus && (
          <motion.div
            className="px-4 py-2 text-xs text-madoka-text-secondary bg-madoka-bg-tertiary flex items-center gap-2"
            variants={variants.fade}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="w-3 h-3 border-2 border-madoka-text border-t-transparent rounded-full animate-spin" />
            <span>{searchStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快捷操作 */}
      <AnimatePresence>
        {!isResponding && (
          <motion.div
            className="flex gap-2 px-4 py-2 border-b border-madoka-border-light"
            variants={variants.shortcuts}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.button
              className="px-3 py-1.5 text-xs font-medium bg-madoka-bg-tertiary rounded-full hover:bg-madoka-border transition-colors"
              onClick={() => handleShortcut('search')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🔍 搜索
            </motion.button>
            <motion.button
              className="px-3 py-1.5 text-xs font-medium bg-madoka-bg-tertiary rounded-full hover:bg-madoka-border transition-colors disabled:opacity-50"
              onClick={() => handleShortcut('read')}
              disabled={reading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              📖 阅读页面
            </motion.button>
            <motion.button
              className="px-3 py-1.5 text-xs font-medium bg-madoka-bg-tertiary rounded-full hover:bg-madoka-border transition-colors disabled:opacity-50"
              onClick={() => handleShortcut('summary')}
              disabled={reading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              📝 总结
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 已附加页面提示 */}
      {state.pageContent && (
        <div className="px-4 py-2 text-xs text-madoka-text-secondary bg-madoka-bg-tertiary border-b border-madoka-border-light flex items-center gap-2">
          <span>📎</span>
          <span className="truncate flex-1">{state.pageContent.title}</span>
          <button
            className="text-madoka-muted hover:text-madoka-text"
            onClick={() => useChatContext().dispatch({ type: 'SET_PAGE_CONTENT', payload: null })}
          >
            ✕
          </button>
        </div>
      )}

      {/* 输入框 */}
      <div className="flex items-end gap-2 p-3">
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none bg-madoka-bg-tertiary rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-madoka-muted focus:ring-1 focus:ring-madoka-border transition-all disabled:opacity-50"
          placeholder={state.pageContent ? '基于页面内容提问...' : '输入问题...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isResponding}
        />
        <motion.button
          className="p-2.5 bg-black text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={handleSend}
          disabled={!input.trim() || isResponding}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </motion.button>
      </div>
    </div>
  )
}
