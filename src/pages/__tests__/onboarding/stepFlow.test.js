import { describe, it, expect } from 'vitest'
import {
  getStepIndex,
  getNextStep,
  getPreviousStep,
  canGoNext,
  canGoPrevious,
  advanceStep,
  goBackStep,
  goToStep,
  isFirstStep,
  isLastStep,
  isTerminalStep,
  skipOnboarding,
  completeOnboarding,
  getProgress,
  getVisibleSteps
} from '../../onboarding/stepFlow.js'
import { ONBOARDING_STEPS, STEP_ORDER } from '../../onboarding/constants.js'

const WELCOME = ONBOARDING_STEPS.WELCOME
const PREFERENCES = ONBOARDING_STEPS.PREFERENCES
const EXAMPLE_DATA = ONBOARDING_STEPS.EXAMPLE_DATA
const CONFIRMATION = ONBOARDING_STEPS.CONFIRMATION
const SKIPPED = ONBOARDING_STEPS.SKIPPED
const COMPLETED = ONBOARDING_STEPS.COMPLETED

describe('stepFlow', () => {
  describe('getStepIndex', () => {
    it('should return correct index for each step', () => {
      expect(getStepIndex(WELCOME)).toBe(0)
      expect(getStepIndex(PREFERENCES)).toBe(1)
      expect(getStepIndex(EXAMPLE_DATA)).toBe(2)
      expect(getStepIndex(CONFIRMATION)).toBe(3)
    })

    it('should return -1 for invalid step and terminal steps not in order', () => {
      expect(getStepIndex('invalid')).toBe(-1)
      expect(getStepIndex(SKIPPED)).toBe(-1)
      expect(getStepIndex(COMPLETED)).toBe(-1)
    })
  })

  describe('getNextStep', () => {
    it('should advance from WELCOME to PREFERENCES', () => {
      const result = getNextStep(WELCOME)
      expect(result.canAdvance).toBe(true)
      expect(result.nextStep).toBe(PREFERENCES)
    })

    it('should advance from PREFERENCES to EXAMPLE_DATA', () => {
      const result = getNextStep(PREFERENCES)
      expect(result.canAdvance).toBe(true)
      expect(result.nextStep).toBe(EXAMPLE_DATA)
    })

    it('should advance from EXAMPLE_DATA to CONFIRMATION', () => {
      const result = getNextStep(EXAMPLE_DATA)
      expect(result.canAdvance).toBe(true)
      expect(result.nextStep).toBe(CONFIRMATION)
    })

    it('should not advance from CONFIRMATION', () => {
      const result = getNextStep(CONFIRMATION)
      expect(result.canAdvance).toBe(false)
      expect(result.nextStep).toBe(CONFIRMATION)
    })

    it('should not advance from COMPLETED', () => {
      const result = getNextStep(COMPLETED)
      expect(result.canAdvance).toBe(false)
      expect(result.nextStep).toBe(COMPLETED)
    })

    it('should not advance from invalid step', () => {
      const result = getNextStep('invalid')
      expect(result.canAdvance).toBe(false)
    })
  })

  describe('getPreviousStep', () => {
    it('should go back from PREFERENCES to WELCOME', () => {
      const result = getPreviousStep(PREFERENCES)
      expect(result.canGoBack).toBe(true)
      expect(result.previousStep).toBe(WELCOME)
    })

    it('should go back from EXAMPLE_DATA to PREFERENCES', () => {
      const result = getPreviousStep(EXAMPLE_DATA)
      expect(result.canGoBack).toBe(true)
      expect(result.previousStep).toBe(PREFERENCES)
    })

    it('should go back from CONFIRMATION to EXAMPLE_DATA', () => {
      const result = getPreviousStep(CONFIRMATION)
      expect(result.canGoBack).toBe(true)
      expect(result.previousStep).toBe(EXAMPLE_DATA)
    })

    it('should not go back from WELCOME', () => {
      const result = getPreviousStep(WELCOME)
      expect(result.canGoBack).toBe(false)
      expect(result.previousStep).toBe(WELCOME)
    })

    it('should not go back from terminal steps', () => {
      expect(getPreviousStep(COMPLETED).canGoBack).toBe(false)
      expect(getPreviousStep(SKIPPED).canGoBack).toBe(false)
    })
  })

  describe('canGoNext', () => {
    it('should return true for normal steps before CONFIRMATION', () => {
      expect(canGoNext(WELCOME)).toBe(true)
      expect(canGoNext(PREFERENCES)).toBe(true)
      expect(canGoNext(EXAMPLE_DATA)).toBe(true)
    })

    it('should return true for CONFIRMATION (special case: can complete)', () => {
      expect(canGoNext(CONFIRMATION)).toBe(true)
    })

    it('should return false for terminal steps', () => {
      expect(canGoNext(COMPLETED)).toBe(false)
      expect(canGoNext(SKIPPED)).toBe(false)
    })
  })

  describe('canGoPrevious', () => {
    it('should return false for WELCOME', () => {
      expect(canGoPrevious(WELCOME)).toBe(false)
    })

    it('should return true for all intermediate steps', () => {
      expect(canGoPrevious(PREFERENCES)).toBe(true)
      expect(canGoPrevious(EXAMPLE_DATA)).toBe(true)
      expect(canGoPrevious(CONFIRMATION)).toBe(true)
    })

    it('should return false for terminal steps', () => {
      expect(canGoPrevious(COMPLETED)).toBe(false)
      expect(canGoPrevious(SKIPPED)).toBe(false)
    })
  })

  describe('advanceStep', () => {
    it('should advance successfully from WELCOME to PREFERENCES', () => {
      const result = advanceStep(WELCOME)
      expect(result.success).toBe(true)
      expect(result.currentStep).toBe(PREFERENCES)
      expect(result.previousStep).toBe(WELCOME)
    })

    it('should fail to advance from CONFIRMATION', () => {
      const result = advanceStep(CONFIRMATION)
      expect(result.success).toBe(false)
      expect(result.currentStep).toBe(CONFIRMATION)
      expect(result.error).toBeDefined()
    })

    it('should fail to advance from COMPLETED', () => {
      const result = advanceStep(COMPLETED)
      expect(result.success).toBe(false)
    })
  })

  describe('goBackStep', () => {
    it('should go back successfully from PREFERENCES to WELCOME', () => {
      const result = goBackStep(PREFERENCES)
      expect(result.success).toBe(true)
      expect(result.currentStep).toBe(WELCOME)
      expect(result.previousStep).toBe(PREFERENCES)
    })

    it('should fail to go back from WELCOME', () => {
      const result = goBackStep(WELCOME)
      expect(result.success).toBe(false)
      expect(result.currentStep).toBe(WELCOME)
      expect(result.error).toBeDefined()
    })
  })

  describe('goToStep', () => {
    it('should go to valid step successfully', () => {
      const result = goToStep(EXAMPLE_DATA)
      expect(result.success).toBe(true)
      expect(result.currentStep).toBe(EXAMPLE_DATA)
    })

    it('should fail to go to invalid step', () => {
      const result = goToStep('invalid_step')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('isFirstStep', () => {
    it('should return true for WELCOME', () => {
      expect(isFirstStep(WELCOME)).toBe(true)
    })

    it('should return false for other steps', () => {
      expect(isFirstStep(PREFERENCES)).toBe(false)
      expect(isFirstStep(EXAMPLE_DATA)).toBe(false)
      expect(isFirstStep(CONFIRMATION)).toBe(false)
    })
  })

  describe('isLastStep', () => {
    it('should return true for CONFIRMATION', () => {
      expect(isLastStep(CONFIRMATION)).toBe(true)
    })

    it('should return false for other steps', () => {
      expect(isLastStep(WELCOME)).toBe(false)
      expect(isLastStep(PREFERENCES)).toBe(false)
      expect(isLastStep(EXAMPLE_DATA)).toBe(false)
    })
  })

  describe('isTerminalStep', () => {
    it('should return true for COMPLETED and SKIPPED', () => {
      expect(isTerminalStep(COMPLETED)).toBe(true)
      expect(isTerminalStep(SKIPPED)).toBe(true)
    })

    it('should return false for other steps', () => {
      expect(isTerminalStep(WELCOME)).toBe(false)
      expect(isTerminalStep(PREFERENCES)).toBe(false)
      expect(isTerminalStep(EXAMPLE_DATA)).toBe(false)
      expect(isTerminalStep(CONFIRMATION)).toBe(false)
    })
  })

  describe('skipOnboarding', () => {
    it('should skip from WELCOME to SKIPPED successfully', () => {
      const result = skipOnboarding(WELCOME)
      expect(result.success).toBe(true)
      expect(result.currentStep).toBe(SKIPPED)
      expect(result.previousStep).toBe(WELCOME)
      expect(result.skippedAt).toBeDefined()
    })

    it('should skip from any intermediate step', () => {
      expect(skipOnboarding(PREFERENCES).success).toBe(true)
      expect(skipOnboarding(EXAMPLE_DATA).success).toBe(true)
      expect(skipOnboarding(CONFIRMATION).success).toBe(true)
    })

    it('should fail to skip from terminal steps', () => {
      const completedResult = skipOnboarding(COMPLETED)
      expect(completedResult.success).toBe(false)
      expect(completedResult.error).toBeDefined()

      const skippedResult = skipOnboarding(SKIPPED)
      expect(skippedResult.success).toBe(false)
    })
  })

  describe('completeOnboarding', () => {
    it('should complete from CONFIRMATION successfully', () => {
      const result = completeOnboarding(CONFIRMATION)
      expect(result.success).toBe(true)
      expect(result.currentStep).toBe(COMPLETED)
      expect(result.previousStep).toBe(CONFIRMATION)
      expect(result.completedAt).toBeDefined()
    })

    it('should fail to complete from other steps', () => {
      expect(completeOnboarding(WELCOME).success).toBe(false)
      expect(completeOnboarding(PREFERENCES).success).toBe(false)
      expect(completeOnboarding(EXAMPLE_DATA).success).toBe(false)
      expect(completeOnboarding(COMPLETED).success).toBe(false)
    })

    it('should include error message for non-CONFIRMATION step', () => {
      const result = completeOnboarding(WELCOME)
      expect(result.error).toBe('只有在确认步骤才能完成引导')
    })
  })

  describe('getProgress', () => {
    it('should return 0% progress for WELCOME', () => {
      const result = getProgress(WELCOME)
      expect(result.currentIndex).toBe(0)
      expect(result.progressPercent).toBe(0)
      expect(result.totalSteps).toBe(STEP_ORDER.length)
    })

    it('should return 100% progress for COMPLETED', () => {
      const result = getProgress(COMPLETED)
      expect(result.progressPercent).toBe(100)
    })

    it('should return 0% for SKIPPED', () => {
      const result = getProgress(SKIPPED)
      expect(result.progressPercent).toBe(0)
    })

    it('should return intermediate progress for PREFERENCES', () => {
      const result = getProgress(PREFERENCES)
      expect(result.currentIndex).toBe(1)
      expect(result.progressPercent).toBeGreaterThan(0)
      expect(result.progressPercent).toBeLessThan(100)
    })
  })

  describe('getVisibleSteps', () => {
    it('should not include COMPLETED step', () => {
      const visible = getVisibleSteps()
      expect(visible).not.toContain(COMPLETED)
      expect(visible).not.toContain(SKIPPED)
      expect(visible).toHaveLength(STEP_ORDER.length)
    })

    it('should include all intermediate steps', () => {
      const visible = getVisibleSteps()
      expect(visible).toContain(WELCOME)
      expect(visible).toContain(PREFERENCES)
      expect(visible).toContain(EXAMPLE_DATA)
      expect(visible).toContain(CONFIRMATION)
    })
  })
})
