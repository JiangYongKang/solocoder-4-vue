export const ONBOARDING_STEPS = {
  WELCOME: 'welcome',
  PREFERENCES: 'preferences',
  EXAMPLE_DATA: 'example_data',
  CONFIRMATION: 'confirmation',
  SKIPPED: 'skipped',
  COMPLETED: 'completed'
}

export const STEP_ORDER = [
  ONBOARDING_STEPS.WELCOME,
  ONBOARDING_STEPS.PREFERENCES,
  ONBOARDING_STEPS.EXAMPLE_DATA,
  ONBOARDING_STEPS.CONFIRMATION
]

export const STEP_LABELS = {
  [ONBOARDING_STEPS.WELCOME]: '欢迎',
  [ONBOARDING_STEPS.PREFERENCES]: '偏好设置',
  [ONBOARDING_STEPS.EXAMPLE_DATA]: '示例数据',
  [ONBOARDING_STEPS.CONFIRMATION]: '确认配置',
  [ONBOARDING_STEPS.SKIPPED]: '已跳过',
  [ONBOARDING_STEPS.COMPLETED]: '完成'
}

export const STEP_ICONS = {
  [ONBOARDING_STEPS.WELCOME]: '👋',
  [ONBOARDING_STEPS.PREFERENCES]: '⚙️',
  [ONBOARDING_STEPS.EXAMPLE_DATA]: '📊',
  [ONBOARDING_STEPS.CONFIRMATION]: '✅',
  [ONBOARDING_STEPS.SKIPPED]: '⏭️',
  [ONBOARDING_STEPS.COMPLETED]: '🎉'
}

export const PREFERENCE_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

export const PREFERENCE_LANGUAGES = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US'
}

export const PREFERENCE_NOTIFICATIONS = {
  EMAIL: 'email',
  PUSH: 'push',
  BOTH: 'both',
  NONE: 'none'
}

export const THEME_OPTIONS = [
  { value: PREFERENCE_THEMES.LIGHT, label: '浅色模式', icon: '☀️', description: '明亮清爽的界面风格' },
  { value: PREFERENCE_THEMES.DARK, label: '深色模式', icon: '🌙', description: '护眼舒适的深色风格' },
  { value: PREFERENCE_THEMES.SYSTEM, label: '跟随系统', icon: '🖥️', description: '自动匹配系统主题设置' }
]

export const LANGUAGE_OPTIONS = [
  { value: PREFERENCE_LANGUAGES.ZH_CN, label: '简体中文', icon: '🇨🇳' },
  { value: PREFERENCE_LANGUAGES.EN_US, label: 'English', icon: '🇺🇸' }
]

export const NOTIFICATION_OPTIONS = [
  { value: PREFERENCE_NOTIFICATIONS.EMAIL, label: '邮件通知', icon: '📧', description: '通过邮件接收重要消息' },
  { value: PREFERENCE_NOTIFICATIONS.PUSH, label: '推送通知', icon: '🔔', description: '在浏览器中接收推送' },
  { value: PREFERENCE_NOTIFICATIONS.BOTH, label: '全部开启', icon: '✅', description: '同时开启邮件和推送' },
  { value: PREFERENCE_NOTIFICATIONS.NONE, label: '全部关闭', icon: '🔕', description: '不接收任何通知' }
]

export const THEME_LABELS = {
  [PREFERENCE_THEMES.LIGHT]: '浅色模式',
  [PREFERENCE_THEMES.DARK]: '深色模式',
  [PREFERENCE_THEMES.SYSTEM]: '跟随系统'
}

export const LANGUAGE_LABELS = {
  [PREFERENCE_LANGUAGES.ZH_CN]: '简体中文',
  [PREFERENCE_LANGUAGES.EN_US]: 'English'
}

export const NOTIFICATION_LABELS = {
  [PREFERENCE_NOTIFICATIONS.EMAIL]: '邮件通知',
  [PREFERENCE_NOTIFICATIONS.PUSH]: '推送通知',
  [PREFERENCE_NOTIFICATIONS.BOTH]: '邮件和推送通知',
  [PREFERENCE_NOTIFICATIONS.NONE]: '不接收通知'
}

export const COMPLETION_REWARDS = [
  { id: 'welcome_credits', name: '欢迎积分', icon: '💎', value: 500, description: '账户积分奖励' },
  { id: 'new_user_badge', name: '新星徽章', icon: '🏅', value: null, description: '专属成就徽章' },
  { id: 'feature_unlock', name: '高级功能', icon: '🔓', value: null, description: '解锁部分高级功能 7 天' }
]

export const RECOMMENDED_TASKS = [
  {
    id: 'complete_profile',
    title: '完善个人资料',
    description: '补充完整的个人信息，获得更个性化的体验',
    icon: '👤',
    priority: 'high',
    estimate: '约 2 分钟'
  },
  {
    id: 'explore_dashboard',
    title: '探索工作台',
    description: '熟悉工作台布局和核心功能入口',
    icon: '📊',
    priority: 'medium',
    estimate: '约 3 分钟'
  },
  {
    id: 'first_project',
    title: '创建第一个项目',
    description: '创建项目并开始您的首次工作流程',
    icon: '🚀',
    priority: 'high',
    estimate: '约 5 分钟'
  }
]
