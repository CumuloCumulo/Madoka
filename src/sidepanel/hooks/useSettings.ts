/**
 * useSettings Hook
 * 管理设置
 */

import { useState, useEffect, useCallback } from 'react'
import { getConfig, saveConfig } from '../../shared/messaging'
import type { AppConfig, SearchEngine } from '../../shared/types'
import { DEFAULT_CONFIG } from '../../shared/types'

export function useSettings() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await getConfig()
        setConfig(savedConfig)
      } catch (e) {
        console.error('[Settings] 加载配置失败:', e)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  // 更新配置字段
  const updateConfig = useCallback((key: keyof AppConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  // 保存配置
  const save = useCallback(async () => {
    setSaving(true)
    setSaveStatus('idle')

    try {
      const result = await saveConfig(config)
      if (result.success) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch (e) {
      console.error('[Settings] 保存配置失败:', e)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }, [config])

  // 切换搜索引擎
  const toggleEngine = useCallback(() => {
    const newEngine: SearchEngine = config.searchEngine === 'bing' ? 'google' : 'bing'
    setConfig((prev) => ({ ...prev, searchEngine: newEngine }))
    saveConfig({ searchEngine: newEngine })
  }, [config.searchEngine])

  return {
    config,
    loading,
    saving,
    saveStatus,
    updateConfig,
    save,
    toggleEngine,
  }
}
