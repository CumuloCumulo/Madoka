/**
 * 配置管理模块
 */

import { AppConfig, DEFAULT_CONFIG } from '../shared/types'

/**
 * 获取配置
 */
export async function getConfig(): Promise<AppConfig> {
  try {
    const result = await chrome.storage.local.get(['madokaConfig'])
    return { ...DEFAULT_CONFIG, ...result.madokaConfig }
  } catch (e) {
    console.error('[Madoka BG] 获取配置失败:', e)
    return DEFAULT_CONFIG
  }
}

/**
 * 保存配置
 */
export async function saveConfig(config: Partial<AppConfig>): Promise<boolean> {
  try {
    const current = await getConfig()
    const merged = { ...current, ...config }
    await chrome.storage.local.set({ madokaConfig: merged })
    return true
  } catch (e) {
    console.error('[Madoka BG] 保存配置失败:', e)
    return false
  }
}
