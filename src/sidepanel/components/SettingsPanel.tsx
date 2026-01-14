/**
 * SettingsPanel 组件
 * 设置面板
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useChatContext } from '../context/ChatContext'
import { useSettings } from '../hooks/useSettings'
import { variants } from '../styles/animations'
import { MODEL_OPTIONS, MAX_RESULTS_OPTIONS } from '../../shared/constants'

export function SettingsPanel() {
  const { setView } = useChatContext()
  const { config, loading, saving, saveStatus, updateConfig, save } = useSettings()
  const [showPassword, setShowPassword] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-madoka-text border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      className="h-full bg-white flex flex-col"
      variants={variants.settingsPanel}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* 标题栏 */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-madoka-border">
        <motion.button
          className="p-2 -ml-2 text-madoka-muted hover:text-madoka-text hover:bg-madoka-bg-tertiary rounded-lg transition-colors"
          onClick={() => setView('chat')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </motion.button>
        <span className="font-semibold text-madoka-text">设置</span>
      </header>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* API 配置 */}
        <section>
          <h3 className="text-xs font-semibold text-madoka-muted uppercase tracking-wider mb-3">
            API 配置
          </h3>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-sm text-madoka-text">通义千问 API Key</label>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                className="flex-1 px-3 py-2 text-sm bg-madoka-bg-tertiary rounded-lg outline-none focus:ring-1 focus:ring-madoka-border"
                value={config.apiKey}
                onChange={(e) => updateConfig('apiKey', e.target.value)}
                placeholder="sk-xxxxxxxx"
              />
              <button
                className="p-2 text-madoka-muted hover:text-madoka-text hover:bg-madoka-bg-tertiary rounded-lg transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 模型选择 */}
          <div className="space-y-2 mt-4">
            <label className="text-sm text-madoka-text">模型选择</label>
            <select
              className="w-full px-3 py-2 text-sm bg-madoka-bg-tertiary rounded-lg outline-none focus:ring-1 focus:ring-madoka-border"
              value={config.model}
              onChange={(e) => updateConfig('model', e.target.value)}
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* 搜索设置 */}
        <section>
          <h3 className="text-xs font-semibold text-madoka-muted uppercase tracking-wider mb-3">
            搜索设置
          </h3>

          {/* 默认搜索引擎 */}
          <div className="space-y-2">
            <label className="text-sm text-madoka-text">默认搜索引擎</label>
            <div className="flex gap-2">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  config.searchEngine === 'bing'
                    ? 'bg-black text-white'
                    : 'bg-madoka-bg-tertiary text-madoka-text hover:bg-madoka-border'
                }`}
                onClick={() => updateConfig('searchEngine', 'bing')}
              >
                Bing
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  config.searchEngine === 'google'
                    ? 'bg-black text-white'
                    : 'bg-madoka-bg-tertiary text-madoka-text hover:bg-madoka-border'
                }`}
                onClick={() => updateConfig('searchEngine', 'google')}
              >
                Google
              </button>
            </div>
          </div>

          {/* 搜索结果数量 */}
          <div className="space-y-2 mt-4">
            <label className="text-sm text-madoka-text">搜索结果数量</label>
            <select
              className="w-full px-3 py-2 text-sm bg-madoka-bg-tertiary rounded-lg outline-none focus:ring-1 focus:ring-madoka-border"
              value={config.maxResults}
              onChange={(e) => updateConfig('maxResults', parseInt(e.target.value))}
            >
              {MAX_RESULTS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>
      </div>

      {/* 保存按钮 */}
      <div className="p-4 border-t border-madoka-border">
        <motion.button
          className="w-full py-2.5 bg-black text-white text-sm font-semibold rounded-xl disabled:opacity-50"
          onClick={save}
          disabled={saving}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {saving ? '保存中...' : '保存设置'}
        </motion.button>

        {/* 状态提示 */}
        {saveStatus !== 'idle' && (
          <motion.div
            className={`mt-2 text-center text-xs ${
              saveStatus === 'success' ? 'text-green-600' : 'text-red-500'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {saveStatus === 'success' ? '✓ 设置已保存' : '✕ 保存失败'}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
