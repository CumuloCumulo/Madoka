/**
 * 动画时序常量
 * 精细的时序控制，实现流体动画系统
 */

export const ANIMATION_TIMING = {
  // 状态转换
  headerHide: 200,
  headerShow: 250,
  shortcutsHide: 180,
  shortcutsShow: 220,

  // 消息动画
  messageEnter: 300,
  messageStagger: 50,
  typingCursor: 530,

  // 微交互
  buttonHover: 150,
  buttonTap: 100,
  statusPulse: 2000,

  // Spring 配置
  spring: {
    stiff: { stiffness: 500, damping: 45 },
    gentle: { stiffness: 35, restDelta: 2 },
    bounce: { type: 'spring' as const, stiffness: 300, damping: 20 },
  },
} as const

/**
 * Framer Motion 动画变体
 */
export const variants = {
  // Header 动画
  header: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },

  // 消息入场
  message: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },

  // 设置面板滑入
  settingsPanel: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  },

  // 快捷操作栏
  shortcuts: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },

  // 淡入淡出
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // 缩放
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
} as const

/**
 * 交错动画容器
 */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: ANIMATION_TIMING.messageStagger / 1000,
      delayChildren: 0.1,
    },
  },
} as const

/**
 * 呼吸动画
 */
export const pulseAnimation = {
  animate: {
    opacity: [0.7, 1, 0.7] as number[],
    transition: {
      duration: ANIMATION_TIMING.statusPulse / 1000,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

/**
 * Logo 微动画
 */
export const logoAnimation = {
  animate: {
    scale: [1, 1.05, 1] as number[],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}
