import { describe, it, expect } from 'vitest'
import {
  ONBOARDING_STEPS,
  STEP_ORDER,
  STEP_LABELS,
  STEP_ICONS,
  PREFERENCE_THEMES,
  PREFERENCE_LANGUAGES,
  PREFERENCE_NOTIFICATIONS,
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  NOTIFICATION_OPTIONS,
  THEME_LABELS,
  LANGUAGE_LABELS,
  NOTIFICATION_LABELS,
  COMPLETION_REWARDS,
  RECOMMENDED_TASKS
} from '../../onboarding/constants.js'

describe('constants', () => {
  describe('ONBOARDING_STEPS', () => {
    it('should have all required steps', () => {
      expect(ONBOARDING_STEPS.WELCOME).toBe('welcome')
      expect(ONBOARDING_STEPS.PREFERENCES).toBe('preferences')
      expect(ONBOARDING_STEPS.EXAMPLE_DATA).toBe('example_data')
      expect(ONBOARDING_STEPS.CONFIRMATION).toBe('confirmation')
      expect(ONBOARDING_STEPS.SKIPPED).toBe('skipped')
      expect(ONBOARDING_STEPS.COMPLETED).toBe('completed')
    })

    it('should have exactly 6 steps', () => {
      expect(Object.keys(ONBOARDING_STEPS)).toHaveLength(6)
    })
  })

  describe('STEP_ORDER', () => {
    it('should have correct step order without terminal steps', () => {
      expect(STEP_ORDER).toEqual([
        'welcome',
        'preferences',
        'example_data',
        'confirmation'
      ])
    })

    it('should not include SKIPPED in step order', () => {
      expect(STEP_ORDER).not.toContain(ONBOARDING_STEPS.SKIPPED)
    })

    it('should not include COMPLETED in step order', () => {
      expect(STEP_ORDER).not.toContain(ONBOARDING_STEPS.COMPLETED)
    })
  })

  describe('STEP_LABELS', () => {
    it('should have labels for all steps', () => {
      expect(STEP_LABELS[ONBOARDING_STEPS.WELCOME]).toBe('欢迎')
      expect(STEP_LABELS[ONBOARDING_STEPS.PREFERENCES]).toBe('偏好设置')
      expect(STEP_LABELS[ONBOARDING_STEPS.EXAMPLE_DATA]).toBe('示例数据')
      expect(STEP_LABELS[ONBOARDING_STEPS.CONFIRMATION]).toBe('确认配置')
      expect(STEP_LABELS[ONBOARDING_STEPS.SKIPPED]).toBe('已跳过')
      expect(STEP_LABELS[ONBOARDING_STEPS.COMPLETED]).toBe('完成')
    })
  })

  describe('STEP_ICONS', () => {
    it('should have icons for all steps', () => {
      expect(typeof STEP_ICONS[ONBOARDING_STEPS.WELCOME]).toBe('string')
      expect(typeof STEP_ICONS[ONBOARDING_STEPS.PREFERENCES]).toBe('string')
      expect(typeof STEP_ICONS[ONBOARDING_STEPS.EXAMPLE_DATA]).toBe('string')
      expect(typeof STEP_ICONS[ONBOARDING_STEPS.CONFIRMATION]).toBe('string')
      expect(typeof STEP_ICONS[ONBOARDING_STEPS.SKIPPED]).toBe('string')
      expect(typeof STEP_ICONS[ONBOARDING_STEPS.COMPLETED]).toBe('string')
    })
  })

  describe('PREFERENCE_THEMES', () => {
    it('should have all theme options', () => {
      expect(PREFERENCE_THEMES.LIGHT).toBe('light')
      expect(PREFERENCE_THEMES.DARK).toBe('dark')
      expect(PREFERENCE_THEMES.SYSTEM).toBe('system')
    })
  })

  describe('PREFERENCE_LANGUAGES', () => {
    it('should have all language options', () => {
      expect(PREFERENCE_LANGUAGES.ZH_CN).toBe('zh-CN')
      expect(PREFERENCE_LANGUAGES.EN_US).toBe('en-US')
    })
  })

  describe('PREFERENCE_NOTIFICATIONS', () => {
    it('should have all notification options', () => {
      expect(PREFERENCE_NOTIFICATIONS.EMAIL).toBe('email')
      expect(PREFERENCE_NOTIFICATIONS.PUSH).toBe('push')
      expect(PREFERENCE_NOTIFICATIONS.BOTH).toBe('both')
      expect(PREFERENCE_NOTIFICATIONS.NONE).toBe('none')
    })
  })

  describe('THEME_OPTIONS', () => {
    it('should have 3 theme options with correct structure', () => {
      expect(THEME_OPTIONS).toHaveLength(3)
      THEME_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value')
        expect(option).toHaveProperty('label')
        expect(option).toHaveProperty('icon')
        expect(option).toHaveProperty('description')
      })
    })
  })

  describe('LANGUAGE_OPTIONS', () => {
    it('should have 2 language options with correct structure', () => {
      expect(LANGUAGE_OPTIONS).toHaveLength(2)
      LANGUAGE_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value')
        expect(option).toHaveProperty('label')
        expect(option).toHaveProperty('icon')
      })
    })
  })

  describe('NOTIFICATION_OPTIONS', () => {
    it('should have 4 notification options with correct structure', () => {
      expect(NOTIFICATION_OPTIONS).toHaveLength(4)
      NOTIFICATION_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value')
        expect(option).toHaveProperty('label')
        expect(option).toHaveProperty('icon')
        expect(option).toHaveProperty('description')
      })
    })
  })

  describe('THEME_LABELS', () => {
    it('should have labels for all themes', () => {
      expect(THEME_LABELS[PREFERENCE_THEMES.LIGHT]).toBe('浅色模式')
      expect(THEME_LABELS[PREFERENCE_THEMES.DARK]).toBe('深色模式')
      expect(THEME_LABELS[PREFERENCE_THEMES.SYSTEM]).toBe('跟随系统')
    })
  })

  describe('LANGUAGE_LABELS', () => {
    it('should have labels for all languages', () => {
      expect(LANGUAGE_LABELS[PREFERENCE_LANGUAGES.ZH_CN]).toBe('简体中文')
      expect(LANGUAGE_LABELS[PREFERENCE_LANGUAGES.EN_US]).toBe('English')
    })
  })

  describe('NOTIFICATION_LABELS', () => {
    it('should have labels for all notification settings', () => {
      expect(NOTIFICATION_LABELS[PREFERENCE_NOTIFICATIONS.EMAIL]).toBe('邮件通知')
      expect(NOTIFICATION_LABELS[PREFERENCE_NOTIFICATIONS.PUSH]).toBe('推送通知')
      expect(NOTIFICATION_LABELS[PREFERENCE_NOTIFICATIONS.BOTH]).toBe('邮件和推送通知')
      expect(NOTIFICATION_LABELS[PREFERENCE_NOTIFICATIONS.NONE]).toBe('不接收通知')
    })
  })

  describe('COMPLETION_REWARDS', () => {
    it('should have 3 rewards with correct structure', () => {
      expect(COMPLETION_REWARDS).toHaveLength(3)
      COMPLETION_REWARDS.forEach(reward => {
        expect(reward).toHaveProperty('id')
        expect(reward).toHaveProperty('name')
        expect(reward).toHaveProperty('icon')
        expect(reward).toHaveProperty('description')
      })
    })

    it('should have welcome_credits with value 500', () => {
      const credits = COMPLETION_REWARDS.find(r => r.id === 'welcome_credits')
      expect(credits).toBeDefined()
      expect(credits.value).toBe(500)
    })
  })

  describe('RECOMMENDED_TASKS', () => {
    it('should have 3 tasks with correct structure', () => {
      expect(RECOMMENDED_TASKS).toHaveLength(3)
      RECOMMENDED_TASKS.forEach(task => {
        expect(task).toHaveProperty('id')
        expect(task).toHaveProperty('title')
        expect(task).toHaveProperty('description')
        expect(task).toHaveProperty('icon')
        expect(task).toHaveProperty('priority')
        expect(task).toHaveProperty('estimate')
      })
    })

    it('should have high priority tasks', () => {
      const highPriorityTasks = RECOMMENDED_TASKS.filter(t => t.priority === 'high')
      expect(highPriorityTasks.length).toBeGreaterThanOrEqual(2)
    })
  })
})
