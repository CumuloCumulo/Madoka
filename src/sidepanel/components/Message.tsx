/**
 * Message 组件
 * 单条消息 - 支持 Markdown 渲染和搜索结果展示
 */

import { motion } from 'framer-motion'
import { marked } from 'marked'
import type { Message as MessageType } from '../../shared/types'
import { variants } from '../styles/animations'

interface MessageProps {
  message: MessageType
}

export function Message({ message }: MessageProps) {
  const { role, content, searchResults, isStreaming } = message

  // 根据角色确定样式
  const isUser = role === 'user'
  const isSystem = role === 'system'

  // 渲染 Markdown 内容
  const renderContent = () => {
    if (!content) {
      return isStreaming ? (
        <span className="inline-block w-2 h-4 bg-current animate-pulse" />
      ) : null
    }

    if (isUser) {
      return <p className="whitespace-pre-wrap">{content}</p>
    }

    // AI 和系统消息使用 Markdown
    const html = marked.parse(content, { async: false }) as string
    return (
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return (
    <motion.div
      className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
      variants={variants.message}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
    >
      {/* 搜索结果来源 */}
      {searchResults && searchResults.length > 0 && (
        <div className="w-full max-w-[95%] bg-madoka-bg-tertiary rounded-xl p-3 text-xs">
          <div className="text-madoka-muted mb-2">📚 参考来源:</div>
          <div className="flex flex-col gap-1.5">
            {searchResults.slice(0, 3).map((result, index) => (
              <a
                key={index}
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-madoka-text hover:underline truncate block"
              >
                {index + 1}. {result.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 消息内容 */}
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-2.5 text-sm
          ${isUser 
            ? 'bg-black text-white rounded-br-md' 
            : isSystem
              ? 'bg-madoka-bg-tertiary text-madoka-text-secondary rounded-bl-md'
              : 'bg-white shadow-madoka-sm border border-madoka-border-light rounded-bl-md'
          }
          ${isStreaming ? 'min-h-[2rem]' : ''}
        `}
      >
        {renderContent()}

        {/* 流式响应光标 */}
        {isStreaming && content && (
          <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
        )}
      </div>
    </motion.div>
  )
}
