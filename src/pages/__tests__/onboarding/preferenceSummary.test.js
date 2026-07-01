import { describe, it, expect } from 'vitest'
import {
  createDefaultPreferences,
  isValidTheme,
  isValidLanguage,
  isValidNotification,
  isValidPreferences,
  updatePreference,
  getThemeLabel,
  getLanguageLabel,
  getNotificationLabel,
  getExampleDataLabel,
  generatePreferenceSummary,
  getChangedSummary
} from '../../onboarding/preferenceSummary.js'
import {
  PREFERENCE_THEMES,
  PREFERENCE_LANGUAGES,
  PREFERENCE_NOTIFICATIONS
} from '../../onboarding/constants.js'

describe('preferenceSummary', () => {
  describe('createDefaultPreferences', () => {
    it('should create valid default preferences', () => {
      const prefs = createDefaultPreferences()
      expect(prefs.theme).toBe(PREFERENCE_THEMES.SYSTEM)
      expect(prefs.language).toBe(PREFERENCE_LANGUAGES.ZH_CN)
      expect(prefs.notifications).toBe(PREFERENCE_NOTIFICATIONS.BOTH)
      expect(prefs.enableExampleData).toBe(true)
    })

    it('should always create new object', () => {
      const prefs1 = createDefaultPreferences()
      const prefs2 = createDefaultPreferences()
      expect(prefs1).not.toBe(prefs2)
      expect(prefs1).toEqual(prefs2)
    })
  })

  describe('isValidTheme', () => {
    it('should return true for valid themes', () => {
      expect(isValidTheme(PREFERENCE_THEMES.LIGHT)).toBe(true)
      expect(isValidTheme(PREFERENCE_THEMES.DARK)).toBe(true)
      expect(isValidTheme(PREFERENCE_THEMES.SYSTEM)).toBe(true)
    })

    it('should return false for invalid themes', () => {
      expect(isValidTheme('invalid')).toBe(false)
      expect(isValidTheme(null)).toBe(false)
      expect(isValidTheme(undefined)).toBe(false)
      expect(isValidTheme(123)).toBe(false)
    })
  })

  describe('isValidLanguage', () => {
    it('should return true for valid languages', () => {
      expect(isValidLanguage(PREFERENCE_LANGUAGES.ZH_CN)).toBe(true)
      expect(isValidLanguage(PREFERENCE_LANGUAGES.EN_US)).toBe(true)
    })

    it('should return false for invalid languages', () => {
      expect(isValidLanguage('invalid')).toBe(false)
      expect(isValidLanguage(null)).toBe(false)
      expect(isValidLanguage('fr')).toBe(false)
    })
  })

  describe('isValidNotification', () => {
    it('should return true for valid notification settings', () => {
      expect(isValidNotification(PREFERENCE_NOTIFICATIONS.EMAIL)).toBe(true)
      expect(isValidNotification(PREFERENCE_NOTIFICATIONS.PUSH)).toBe(true)
      expect(isValidNotification(PREFERENCE_NOTIFICATIONS.BOTH)).toBe(true)
      expect(isValidNotification(PREFERENCE_NOTIFICATIONS.NONE)).toBe(true)
    })

    it('should return false for invalid notification settings', () => {
      expect(isValidNotification('invalid')).toBe(false)
      expect(isValidNotification(null)).toBe(false)
      expect(isValidNotification('sms')).toBe(false)
    })
  })

  describe('isValidPreferences', () => {
    it('should return true for valid preferences', () => {
      const prefs = createDefaultPreferences()
      expect(isValidPreferences(prefs)).toBe(true)
    })

    it('should return false for null or non-object', () => {
      expect(isValidPreferences(null)).toBe(false)
      expect(isValidPreferences(undefined)).toBe(false)
      expect(isValidPreferences('string')).toBe(false)
      expect(isValidPreferences(123)).toBe(false)
    })

    it('should return false for invalid theme', () => {
      const prefs = { ...createDefaultPreferences(), theme: 'invalid' }
      expect(isValidPreferences(prefs)).toBe(false)
    })

    it('should return false for invalid language', () => {
      const prefs = { ...createDefaultPreferences(), language: 'invalid' }
      expect(isValidPreferences(prefs)).toBe(false)
    })

    it('should return false for invalid notifications', () => {
      const prefs = { ...createDefaultPreferences(), notifications: 'invalid' }
      expect(isValidPreferences(prefs)).toBe(false)
    })

    it('should return false for invalid enableExampleData', () => {
      const prefs = { ...createDefaultPreferences(), enableExampleData: 'yes' }
      expect(isValidPreferences(prefs)).toBe(false)
    })
  })

  describe('updatePreference', () => {
    it('should update theme correctly', () => {
      const original = createDefaultPreferences()
      const updated = updatePreference(original, 'theme', PREFERENCE_THEMES.DARK)
      expect(updated.theme).toBe(PREFERENCE_THEMES.DARK)
      expect(original.theme).not.toBe(PREFERENCE_THEMES.DARK)
    })

    it('should update language correctly', () => {
      const original = createDefaultPreferences()
      const updated = updatePreference(original, 'language', PREFERENCE_LANGUAGES.EN_US)
      expect(updated.language).toBe(PREFERENCE_LANGUAGES.EN_US)
    })

    it('should update notifications correctly', () => {
      const original = createDefaultPreferences()
      const updated = updatePreference(original, 'notifications', PREFERENCE_NOTIFICATIONS.NONE)
      expect(updated.notifications).toBe(PREFERENCE_NOTIFICATIONS.NONE)
    })

    it('should update enableExampleData correctly', () => {
      const original = createDefaultPreferences()
      const updated = updatePreference(original, 'enableExampleData', false)
      expect(updated.enableExampleData).toBe(false)
    })

    it('should not mutate original object', () => {
      const original = createDefaultPreferences()
      const updated = updatePreference(original, 'theme', PREFERENCE_THEMES.DARK)
      expect(original.theme).toBe(PREFERENCE_THEMES.SYSTEM)
      expect(updated).not.toBe(original)
    })

    it('should reject invalid theme value', () => {
      const original = createDefaultPreferences()
      const updated = updatePreference(original, 'theme', 'invalid')
      expect(updated.theme).toBe(original.theme)
    })

    it('should reject invalid key', () => {
      const original = createDefaultPreferences()
      const updated = updatePreference(original, 'invalidKey', 'value')
      expect(updated).toBe(original)
    })

    it('should reject non-boolean enableExampleData', () => {
      const original = createDefaultPreferences()
      const updated = updatePreference(original, 'enableExampleData', 'notbool')
      expect(updated.enableExampleData).toBe(true)
    })
  })

  describe('getThemeLabel', () => {
    it('should return correct labels', () => {
      expect(getThemeLabel(PREFERENCE_THEMES.LIGHT)).toBe('浅色模式')
      expect(getThemeLabel(PREFERENCE_THEMES.DARK)).toBe('深色模式')
      expect(getThemeLabel(PREFERENCE_THEMES.SYSTEM)).toBe('跟随系统')
    })

    it('should return fallback for invalid theme', () => {
      expect(getThemeLabel('invalid')).toBe('未知主题')
    })
  })

  describe('getLanguageLabel', () => {
    it('should return correct labels', () => {
      expect(getLanguageLabel(PREFERENCE_LANGUAGES.ZH_CN)).toBe('简体中文')
      expect(getLanguageLabel(PREFERENCE_LANGUAGES.EN_US)).toBe('English')
    })

    it('should return fallback for invalid language', () => {
      expect(getLanguageLabel('invalid')).toBe('未知语言')
    })
  })

  describe('getNotificationLabel', () => {
    it('should return correct labels', () => {
      expect(getNotificationLabel(PREFERENCE_NOTIFICATIONS.EMAIL)).toBe('邮件通知')
      expect(getNotificationLabel(PREFERENCE_NOTIFICATIONS.PUSH)).toBe('推送通知')
      expect(getNotificationLabel(PREFERENCE_NOTIFICATIONS.BOTH)).toBe('邮件和推送通知')
      expect(getNotificationLabel(PREFERENCE_NOTIFICATIONS.NONE)).toBe('不接收通知')
    })

    it('should return fallback for invalid notification', () => {
      expect(getNotificationLabel('invalid')).toBe('未知通知设置')
    })
  })

  describe('getExampleDataLabel', () => {
    it('should return correct labels', () => {
      expect(getExampleDataLabel(true)).toBe('已启用')
      expect(getExampleDataLabel(false)).toBe('已关闭')
    })
  })

  describe('generatePreferenceSummary', () => {
    it('should generate valid summary for default preferences', () => {
      const prefs = createDefaultPreferences()
      const result = generatePreferenceSummary(prefs)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
      expect(result.items).toHaveLength(4)
    })

    it('should include all required keys in summary items', () => {
      const prefs = createDefaultPreferences()
      const result = generatePreferenceSummary(prefs)
      const keys = result.items.map(item => item.key)
      expect(keys).toContain('theme')
      expect(keys).toContain('language')
      expect(keys).toContain('notifications')
      expect(keys).toContain('enableExampleData')
    })

    it('each summary item should have correct structure', () => {
      const prefs = createDefaultPreferences()
      const result = generatePreferenceSummary(prefs)
      result.items.forEach(item => {
        expect(item).toHaveProperty('key')
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('value')
        expect(item).toHaveProperty('icon')
      })
    })

    it('should return invalid result for invalid preferences', () => {
      const result = generatePreferenceSummary(null)
      expect(result.valid).toBe(false)
      expect(result.items).toEqual([])
      expect(result.error).toBe('偏好设置无效')
    })

    it('should reflect example data disabled state', () => {
      const prefs = updatePreference(createDefaultPreferences(), 'enableExampleData', false)
      const result = generatePreferenceSummary(prefs)
      const exampleDataItem = result.items.find(i => i.key === 'enableExampleData')
      expect(exampleDataItem.value).toBe('已关闭')
    })
  })

  describe('getChangedSummary', () => {
    it('should detect no changes for identical preferences', () => {
      const original = createDefaultPreferences()
      const result = getChangedSummary(original, { ...original })
      expect(result.valid).toBe(true)
      expect(result.hasChanges).toBe(false)
      expect(result.changes).toHaveLength(0)
    })

    it('should detect theme change', () => {
      const original = createDefaultPreferences()
      const updated = updatePreference(original, 'theme', PREFERENCE_THEMES.DARK)
      const result = getChangedSummary(original, updated)
      expect(result.hasChanges).toBe(true)
      const themeChange = result.changes.find(c => c.key === 'theme')
      expect(themeChange).toBeDefined()
      expect(themeChange.oldValue).not.toBe(themeChange.newValue)
    })

    it('should detect multiple changes', () => {
      const original = createDefaultPreferences()
      let updated = updatePreference(original, 'theme', PREFERENCE_THEMES.DARK)
      updated = updatePreference(updated, 'language', PREFERENCE_LANGUAGES.EN_US)
      updated = updatePreference(updated, 'enableExampleData', false)
      const result = getChangedSummary(original, updated)
      expect(result.hasChanges).toBe(true)
      expect(result.changes.length).toBe(3)
    })

    it('should return invalid result for invalid preferences', () => {
      const result = getChangedSummary(null, null)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
