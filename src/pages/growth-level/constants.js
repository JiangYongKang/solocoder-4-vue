export const LEVELS = {
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
  L5: 5,
  L6: 6,
  L7: 7,
  L8: 8,
  L9: 9,
  L10: 10
}

export const LEVEL_NAMES = {
  [LEVELS.L1]: '新手',
  [LEVELS.L2]: '入门',
  [LEVELS.L3]: '进阶',
  [LEVELS.L4]: '熟练',
  [LEVELS.L5]: '精通',
  [LEVELS.L6]: '专家',
  [LEVELS.L7]: '大师',
  [LEVELS.L8]: '宗师',
  [LEVELS.L9]: '传奇',
  [LEVELS.L10]: '神话'
}

export const LEVEL_COLORS = {
  [LEVELS.L1]: '#9ca3af',
  [LEVELS.L2]: '#6b7280',
  [LEVELS.L3]: '#3b82f6',
  [LEVELS.L4]: '#22c55e',
  [LEVELS.L5]: '#10b981',
  [LEVELS.L6]: '#f59e0b',
  [LEVELS.L7]: '#f97316',
  [LEVELS.L8]: '#ef4444',
  [LEVELS.L9]: '#8b5cf6',
  [LEVELS.L10]: '#ec4899'
}

export const LEVEL_ICONS = {
  [LEVELS.L1]: '🌱',
  [LEVELS.L2]: '🌿',
  [LEVELS.L3]: '🌳',
  [LEVELS.L4]: '⭐',
  [LEVELS.L5]: '🌟',
  [LEVELS.L6]: '💎',
  [LEVELS.L7]: '👑',
  [LEVELS.L8]: '🏆',
  [LEVELS.L9]: '🔥',
  [LEVELS.L10]: '👁️'
}

export const LEVEL_EXP_REQUIREMENTS = {
  [LEVELS.L1]: 0,
  [LEVELS.L2]: 100,
  [LEVELS.L3]: 300,
  [LEVELS.L4]: 600,
  [LEVELS.L5]: 1000,
  [LEVELS.L6]: 1500,
  [LEVELS.L7]: 2100,
  [LEVELS.L8]: 2800,
  [LEVELS.L9]: 3600,
  [LEVELS.L10]: 4500
}

export const EXP_SOURCE_TYPES = {
  DAILY_LOGIN: 'daily_login',
  TASK_COMPLETE: 'task_complete',
  CONTENT_CONTRIBUTE: 'content_contribute',
  COMMUNITY_INTERACT: 'community_interact',
  ACHIEVEMENT: 'achievement',
  PURCHASE: 'purchase',
  PENALTY: 'penalty',
  CORRECTION: 'correction'
}

export const EXP_SOURCE_LABELS = {
  [EXP_SOURCE_TYPES.DAILY_LOGIN]: '每日登录',
  [EXP_SOURCE_TYPES.TASK_COMPLETE]: '任务完成',
  [EXP_SOURCE_TYPES.CONTENT_CONTRIBUTE]: '内容贡献',
  [EXP_SOURCE_TYPES.COMMUNITY_INTERACT]: '社区互动',
  [EXP_SOURCE_TYPES.ACHIEVEMENT]: '成就达成',
  [EXP_SOURCE_TYPES.PURCHASE]: '消费奖励',
  [EXP_SOURCE_TYPES.PENALTY]: '违规扣除',
  [EXP_SOURCE_TYPES.CORRECTION]: '系统调整'
}

export const EXP_SOURCE_ICONS = {
  [EXP_SOURCE_TYPES.DAILY_LOGIN]: '📅',
  [EXP_SOURCE_TYPES.TASK_COMPLETE]: '✅',
  [EXP_SOURCE_TYPES.CONTENT_CONTRIBUTE]: '📝',
  [EXP_SOURCE_TYPES.COMMUNITY_INTERACT]: '💬',
  [EXP_SOURCE_TYPES.ACHIEVEMENT]: '🏅',
  [EXP_SOURCE_TYPES.PURCHASE]: '🛒',
  [EXP_SOURCE_TYPES.PENALTY]: '⚠️',
  [EXP_SOURCE_TYPES.CORRECTION]: '🔧'
}

export const BENEFIT_STATUS = {
  UNLOCKED: 'unlocked',
  LOCKED: 'locked',
  CLAIMABLE: 'claimable',
  CLAIMED: 'claimed',
  EXPIRED: 'expired'
}

export const BENEFIT_STATUS_LABELS = {
  [BENEFIT_STATUS.UNLOCKED]: '已解锁',
  [BENEFIT_STATUS.LOCKED]: '未解锁',
  [BENEFIT_STATUS.CLAIMABLE]: '可领取',
  [BENEFIT_STATUS.CLAIMED]: '已领取',
  [BENEFIT_STATUS.EXPIRED]: '已过期'
}

export const BENEFIT_TYPES = {
  DISCOUNT: 'discount',
  FREE_SHIPPING: 'free_shipping',
  POINTS_BONUS: 'points_bonus',
  EXCLUSIVE_CONTENT: 'exclusive_content',
  PRIORITY_SUPPORT: 'priority_support',
  EARLY_ACCESS: 'early_access',
  CUSTOM_BADGE: 'custom_badge',
  INVITE_CODE: 'invite_code'
}

export const BENEFIT_TYPE_LABELS = {
  [BENEFIT_TYPES.DISCOUNT]: '专属折扣',
  [BENEFIT_TYPES.FREE_SHIPPING]: '免邮券',
  [BENEFIT_TYPES.POINTS_BONUS]: '积分加成',
  [BENEFIT_TYPES.EXCLUSIVE_CONTENT]: '专属内容',
  [BENEFIT_TYPES.PRIORITY_SUPPORT]: '优先客服',
  [BENEFIT_TYPES.EARLY_ACCESS]: '优先体验',
  [BENEFIT_TYPES.CUSTOM_BADGE]: '专属徽章',
  [BENEFIT_TYPES.INVITE_CODE]: '邀请码'
}

export const BENEFIT_TYPE_ICONS = {
  [BENEFIT_TYPES.DISCOUNT]: '🏷️',
  [BENEFIT_TYPES.FREE_SHIPPING]: '🚚',
  [BENEFIT_TYPES.POINTS_BONUS]: '💎',
  [BENEFIT_TYPES.EXCLUSIVE_CONTENT]: '📚',
  [BENEFIT_TYPES.PRIORITY_SUPPORT]: '🎧',
  [BENEFIT_TYPES.EARLY_ACCESS]: '⏰',
  [BENEFIT_TYPES.CUSTOM_BADGE]: '🎖️',
  [BENEFIT_TYPES.INVITE_CODE]: '🎫'
}

export const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CLAIMED: 'claimed'
}

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.NOT_STARTED]: '未开始',
  [TASK_STATUS.IN_PROGRESS]: '进行中',
  [TASK_STATUS.COMPLETED]: '已完成',
  [TASK_STATUS.CLAIMED]: '已领取'
}

export const TASK_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  ACHIEVEMENT: 'achievement',
  SPECIAL: 'special'
}

export const TASK_TYPE_LABELS = {
  [TASK_TYPES.DAILY]: '每日任务',
  [TASK_TYPES.WEEKLY]: '每周任务',
  [TASK_TYPES.ACHIEVEMENT]: '成就任务',
  [TASK_TYPES.SPECIAL]: '特殊任务'
}

export const MAX_LEVEL = LEVELS.L10
export const DAILY_EXP_CAP = 500
export const CLAIM_COOLDOWN_HOURS = 24
