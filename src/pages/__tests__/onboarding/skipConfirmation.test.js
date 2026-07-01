import { describe, it, expect } from 'vitest'
import {
  canSkip,
  createSkipWarning,
  getRemainingSteps,
  getSkippedStateInfo,
  confirmSkip,
  cancelSkip
} from '../../onboarding/skipConfirmation.js'
import { ONBOARDING_STEPS } from '../../onboarding/constants.js'

const WELCOME = ONBOARDING_STEPS.WELCOME
const PREFERENCES = ONBOARDING_STEPS.PREFERENCES
const EXAMPLE_DATA = ONBOARDING_STEPS.EXAMPLE_DATA
const CONFIRMATION = ONBOARDING_STEPS.CONFIRMATION
const SKIPPED = ONBOARDING_STEPS.SKIPPED
const COMPLETED = ONBOARDING_STEPS.COMPLETED

describe('skipConfirmation', () => {
  describe('canSkip', () => {
    it('should return true for WELCOME step', () => {
      expect(canSkip(WELCOME)).toBe(true)
    })

    it('should return true for PREFERENCES step', () => {
      expect(canSkip(PREFERENCES)).toBe(true)
    })

    it('should return true for EXAMPLE_DATA step', () => {
      expect(canSkip(EXAMPLE_DATA)).toBe(true)
    })

    it('should return true for CONFIRMATION step', () => {
      expect(canSkip(CONFIRMATION)).toBe(true)
    })

    it('should return false for COMPLETED step', () => {
      expect(canSkip(COMPLETED)).toBe(false)
    })

    it('should return false for SKIPPED step', () => {
      expect(canSkip(SKIPPED)).toBe(false)
    })

    it('should return false for invalid step', () => {
      expect(canSkip('invalid')).toBe(false)
    })
  })

  describe('createSkipWarning', () => {
    it('should create valid warning for WELCOME step', () => {
      const result = createSkipWarning(WELCOME)
      expect(result.canSkip).toBe(true)
      expect(result.title).toBeDefined()
      expect(result.message).toBeDefined()
      expect(result.confirmText).toBe('确认跳过')
      expect(result.cancelText).toBe('继续引导')
    })

    it('should include warnings array', () => {
      const result = createSkipWarning(PREFERENCES)
      expect(result.warnings).toBeDefined()
      expect(result.warnings.length).toBeGreaterThan(0)
      result.warnings.forEach(warn => {
        expect(warn).toHaveProperty('type')
        expect(warn).toHaveProperty('message')
      })
    })

    it('should include continueInfo array', () => {
      const result = createSkipWarning(EXAMPLE_DATA)
      expect(result.continueInfo).toBeDefined()
      expect(result.continueInfo.length).toBeGreaterThan(0)
      result.continueInfo.forEach(info => {
        expect(info).toHaveProperty('icon')
        expect(info).toHaveProperty('title')
        expect(info).toHaveProperty('description')
      })
    })

    it('should show remaining steps count warning for intermediate steps', () => {
      const result = createSkipWarning(WELCOME)
      const stepsWarning = result.warnings.find(w => w.type === 'steps')
      expect(stepsWarning).toBeDefined()
      expect(stepsWarning.message).toContain('步骤')
    })

    it('should return canSkip false for terminal steps', () => {
      const completedResult = createSkipWarning(COMPLETED)
      expect(completedResult.canSkip).toBe(false)
      expect(completedResult.title).toBe('')
      expect(completedResult.message).toBe('')
      expect(completedResult.warnings).toEqual([])
      expect(completedResult.continueInfo).toEqual([])
    })
  })

  describe('getRemainingSteps', () => {
    it('should return all remaining steps from WELCOME', () => {
      const remaining = getRemainingSteps(WELCOME)
      expect(remaining).toContain(PREFERENCES)
      expect(remaining).toContain(EXAMPLE_DATA)
      expect(remaining).toContain(CONFIRMATION)
      expect(remaining).not.toContain(COMPLETED)
      expect(remaining).not.toContain(WELCOME)
    })

    it('should return remaining steps from PREFERENCES', () => {
      const remaining = getRemainingSteps(PREFERENCES)
      expect(remaining).toContain(EXAMPLE_DATA)
      expect(remaining).toContain(CONFIRMATION)
      expect(remaining).not.toContain(WELCOME)
      expect(remaining).not.toContain(PREFERENCES)
    })

    it('should return CONFIRMATION from EXAMPLE_DATA', () => {
      const remaining = getRemainingSteps(EXAMPLE_DATA)
      expect(remaining).toEqual([CONFIRMATION])
    })

    it('should return empty array from CONFIRMATION', () => {
      const remaining = getRemainingSteps(CONFIRMATION)
      expect(remaining).toEqual([])
    })

    it('should return empty array from COMPLETED', () => {
      const remaining = getRemainingSteps(COMPLETED)
      expect(remaining).toEqual([])
    })

    it('should return empty array for invalid step', () => {
      const remaining = getRemainingSteps('invalid')
      expect(remaining).toEqual([])
    })
  })

  describe('getSkippedStateInfo', () => {
    it('should return skipped state info with correct structure', () => {
      const info = getSkippedStateInfo()
      expect(info.state).toBe(SKIPPED)
      expect(info.title).toBe('已跳过引导')
      expect(info.icon).toBeDefined()
      expect(info.subtitle).toBeDefined()
      expect(info.description).toBeDefined()
    })

    it('should include suggestions array with 3 items', () => {
      const info = getSkippedStateInfo()
      expect(info.suggestions).toBeDefined()
      expect(info.suggestions).toHaveLength(3)
      info.suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('id')
        expect(suggestion).toHaveProperty('title')
        expect(suggestion).toHaveProperty('description')
        expect(suggestion).toHaveProperty('action')
        expect(suggestion).toHaveProperty('icon')
      })
    })

    it('should include tips array with items', () => {
      const info = getSkippedStateInfo()
      expect(info.tips).toBeDefined()
      expect(info.tips.length).toBeGreaterThan(0)
      info.tips.forEach(tip => {
        expect(typeof tip).toBe('string')
        expect(tip.length).toBeGreaterThan(0)
      })
    })

    it('should include suggestion for customizing preferences', () => {
      const info = getSkippedStateInfo()
      const hasCustomizeSuggestion = info.suggestions.some(
        s => s.title.includes('自定义') || s.title.includes('偏好')
      )
      expect(hasCustomizeSuggestion).toBe(true)
    })

    it('should include suggestion for restarting onboarding', () => {
      const info = getSkippedStateInfo()
      const hasRestartSuggestion = info.suggestions.some(
        s => s.title.includes('重新') || s.action.includes('重新')
      )
      expect(hasRestartSuggestion).toBe(true)
    })
  })

  describe('confirmSkip', () => {
    it('should confirm skip from WELCOME successfully', () => {
      const result = confirmSkip(WELCOME)
      expect(result.success).toBe(true)
      expect(result.skipped).toBe(true)
      expect(result.skippedAt).toBeDefined()
      expect(result.remainingSteps).toBeDefined()
    })

    it('should confirm skip from intermediate steps', () => {
      expect(confirmSkip(PREFERENCES).success).toBe(true)
      expect(confirmSkip(EXAMPLE_DATA).success).toBe(true)
      expect(confirmSkip(CONFIRMATION).success).toBe(true)
    })

    it('should fail to skip from terminal steps', () => {
      const completedResult = confirmSkip(COMPLETED)
      expect(completedResult.success).toBe(false)
      expect(completedResult.error).toBe('当前状态无法跳过引导')

      const skippedResult = confirmSkip(SKIPPED)
      expect(skippedResult.success).toBe(false)
    })
  })

  describe('cancelSkip', () => {
    it('should return continue action', () => {
      const result = cancelSkip()
      expect(result.success).toBe(true)
      expect(result.skipped).toBe(false)
      expect(result.action).toBe('continue')
    })
  })
})
