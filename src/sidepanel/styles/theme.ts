/**
 * 主题色彩常量
 * 极简黑白灰配色，让信息本身成为焦点
 */

export const COLORS = {
  // 背景
  bgPrimary: '#fafafa',
  bgSecondary: '#ffffff',
  bgTertiary: '#f5f5f5',

  // 文字
  textPrimary: '#000000',
  textSecondary: '#666666',
  textMuted: '#999999',

  // 交互
  buttonPrimary: '#000000',
  buttonSecondary: '#333333',
  buttonHover: '#1a1a1a',
  buttonDisabled: '#cccccc',

  // 边框
  border: '#e5e5e5',
  borderLight: '#f0f0f0',

  // 状态
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',

  // 消息
  userMessage: '#000000',
  assistantMessage: '#ffffff',

  // 阴影
  shadow: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.04)',
    md: '0 4px 16px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 28px rgba(0, 0, 0, 0.12)',
  },
} as const

/**
 * 字体配置
 */
export const FONTS = {
  family: {
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    mono: "'Menlo', 'Monaco', 'Courier New', monospace",
  },
  size: {
    xs: '11px',
    sm: '12px',
    base: '13px',
    lg: '14px',
    xl: '16px',
    '2xl': '18px',
  },
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const

/**
 * 间距配置
 */
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
} as const

/**
 * 圆角配置
 */
export const RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const
