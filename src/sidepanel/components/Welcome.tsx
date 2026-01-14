/**
 * Welcome 组件
 * 欢迎界面
 */

import { motion } from 'framer-motion'
import { variants } from '../styles/animations'

export function Welcome() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full text-center px-6"
      variants={variants.fade}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Logo */}
      <motion.div
        className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-4"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        M
      </motion.div>

      {/* 标题 */}
      <h2 className="text-lg font-semibold text-madoka-text mb-2">
        👋 你好，我是 Madoka
      </h2>

      {/* 描述 */}
      <p className="text-sm text-madoka-text-secondary mb-6">
        我可以帮你搜索网络并回答问题
      </p>

      {/* 提示 */}
      <div className="bg-madoka-bg-tertiary rounded-xl px-4 py-3 text-xs text-madoka-muted max-w-xs">
        <p>💡 提示:</p>
        <ul className="mt-1 space-y-1 text-left">
          <li>• 输入 <code className="bg-white px-1 rounded">/search</code> 强制搜索</li>
          <li>• 点击「阅读页面」分析当前网页</li>
          <li>• 按 Enter 发送，Shift+Enter 换行</li>
        </ul>
      </div>
    </motion.div>
  )
}
