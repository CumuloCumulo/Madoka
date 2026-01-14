/**
 * MessageList 组件
 * 消息列表容器
 */

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatContext } from '../context/ChatContext'
import { Message } from './Message'
import { Welcome } from './Welcome'
import { staggerContainer } from '../styles/animations'

export function MessageList() {
  const { state } = useChatContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const { messages } = state

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-4 py-4 message-list"
    >
      <AnimatePresence mode="popLayout">
        {messages.length === 0 ? (
          <Welcome key="welcome" />
        ) : (
          <motion.div
            key="messages"
            className="flex flex-col gap-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
