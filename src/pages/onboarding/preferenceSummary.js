import {
  THEME_LABELS,
  LANGUAGE_LABELS,
  NOTIFICATION_LABELS,
  PREFERENCE_THEMES,
  PREFERENCE_LANGUAGES,
  PREFERENCE_NOTIFICATIONS,
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  NOTIFICATION_OPTIONS
} from './constants.js'

export function createDefaultPreferences() {
  return {
    theme: PREFERENCE_THEMES.SYSTEM,
    language: PREFERENCE_LANGUAGES.ZH_CN,
    notifications: PREFERENCE_NOTIFICATIONS.BOTH,
    enableExampleData: true
  }
}

export function isValidTheme(theme) {
  return Object.values(PREFERENCE_THEMES).includes(theme)
}

export function isValidLanguage(language) {
  return Object.values(PREFERENCE_LANGUAGES).includes(language)
}

export function isValidNotification(notification) {
  return Object.values(PREFERENCE_NOTIFICATIONS).includes(notification)
}

export function isValidPreferences(preferences) {
  if (!preferences || typeof preferences !== 'object') return false
  if (!isValidTheme(preferences.theme)) return false
  if (!isValidLanguage(preferences.language)) return false
  if (!isValidNotification(preferences.notifications)) return false
  if (typeof preferences.enableExampleData !== 'boolean') return false
  return true
}

export function updatePreference(preferences, key, value) {
  const newPreferences = { ...preferences }
  switch (key) {
    case 'theme':
      if (isValidTheme(value)) {
        newPreferences.theme = value
      }
      break
    case 'language':
      if (isValidLanguage(value)) {
        newPreferences.language = value
      }
      break
    case 'notifications':
      if (isValidNotification(value)) {
        newPreferences.notifications = value
      }
      break
    case 'enableExampleData':
      if (typeof value === 'boolean') {
        newPreferences.enableExampleData = value
      }
      break
    default:
      return preferences
  }
  return newPreferences
}

export function getThemeLabel(theme) {
  return THEME_LABELS[theme] || '未知主题'
}

export function getLanguageLabel(language) {
  return LANGUAGE_LABELS[language] || '未知语言'
}

export function getNotificationLabel(notification) {
  return NOTIFICATION_LABELS[notification] || '未知通知设置'
}

export function getExampleDataLabel(enabled) {
  return enabled ? '已启用' : '已关闭'
}

export function generatePreferenceSummary(preferences) {
  if (!isValidPreferences(preferences)) {
    return {
      valid: false,
      items: [],
      error: '偏好设置无效'
    }
  }
  return {
    valid: true,
    items: [
      {
        key: 'theme',
        label: '界面主题',
        value: getThemeLabel(preferences.theme),
        icon: getThemeIcon(preferences.theme)
      },
      {
        key: 'language',
        label: '显示语言',
        value: getLanguageLabel(preferences.language),
        icon: getLanguageIcon(preferences.language)
      },
      {
        key: 'notifications',
        label: '通知方式',
        value: getNotificationLabel(preferences.notifications),
        icon: getNotificationIcon(preferences.notifications)
      },
      {
        key: 'enableExampleData',
        label: '示例数据',
        value: getExampleDataLabel(preferences.enableExampleData),
        icon: preferences.enableExampleData ? '📊' : '🚫'
      }
    ],
    error: null
  }
}

function getThemeIcon(theme) {
  const option = THEME_OPTIONS.find(o => o.value === theme)
  return option ? option.icon : '🎨'
}

function getLanguageIcon(language) {
  const option = LANGUAGE_OPTIONS.find(o => o.value === language)
  return option ? option.icon : '🌐'
}

function getNotificationIcon(notification) {
  const option = NOTIFICATION_OPTIONS.find(o => o.value === notification)
  return option ? option.icon : '🔔'
}

export function getChangedSummary(original, updated) {
  const originalSummary = generatePreferenceSummary(original)
  const updatedSummary = generatePreferenceSummary(updated)
  if (!originalSummary.valid || !updatedSummary.valid) {
    return { valid: false, changes: [], error: '偏好设置无效' }
  }
  const changes = []
  for (let i = 0; i < originalSummary.items.length; i++) {
    const orig = originalSummary.items[i]
    const upd = updatedSummary.items[i]
    if (orig.value !== upd.value) {
      changes.push({
        key: orig.key,
        label: orig.label,
        oldValue: orig.value,
        newValue: upd.value,
        icon: upd.icon
      })
    }
  }
  return {
    valid: true,
    changes,
    hasChanges: changes.length > 0
  }
}
