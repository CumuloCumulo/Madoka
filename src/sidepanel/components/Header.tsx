/**
 * Header 组件
 * 标题栏 - 带状态指示器和控制按钮
 */

import { motion } from 'framer-motion'
import { useChatContext } from '../context/ChatContext'
import { useSettings } from '../hooks/useSettings'
import { variants, logoAnimation, pulseAnimation } from '../styles/animations'

export function Header() {
  const { setView, clearMessages } = useChatContext()
  const { config, toggleEngine } = useSettings()

  return (
    <motion.header
      className="flex items-center justify-between px-4 py-3 bg-white border-b border-madoka-border"
      variants={variants.header}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
    >
      {/* Logo 和状态 */}
      <div className="flex items-center gap-2">
        <motion.div
          className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-xs font-bold"
          {...logoAnimation}
        >
          M
        </motion.div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-madoka-text">Madoka</span>
          <motion.div
            className="flex items-center gap-1 text-xs text-madoka-muted"
            {...pulseAnimation}
          >
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>Ready</span>
          </motion.div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1">
        {/* 搜索引擎切换 */}
        <motion.button
          className="px-2 py-1 text-xs font-medium bg-madoka-bg-tertiary rounded-md hover:bg-madoka-border transition-colors"
          onClick={toggleEngine}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {config.searchEngine === 'bing' ? 'Bing' : 'Google'}
        </motion.button>

        {/* 清空按钮 */}
        <motion.button
          className="p-2 text-madoka-muted hover:text-madoka-text hover:bg-madoka-bg-tertiary rounded-lg transition-colors"
          onClick={clearMessages}
          title="清空对话"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        </motion.button>

        {/* 设置按钮 */}
        <motion.button
          className="p-2 text-madoka-muted hover:text-madoka-text hover:bg-madoka-bg-tertiary rounded-lg transition-colors"
          onClick={() => setView('settings')}
          title="设置"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </motion.button>
      </div>
    </motion.header>
  )
}
