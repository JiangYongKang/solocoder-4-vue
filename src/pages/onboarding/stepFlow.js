import { ONBOARDING_STEPS, STEP_ORDER } from './constants.js'

export function getStepIndex(step) {
  const index = STEP_ORDER.indexOf(step)
  return index === -1 ? -1 : index
}

export function getNextStep(currentStep) {
  const currentIndex = getStepIndex(currentStep)
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
    return { canAdvance: false, nextStep: currentStep }
  }
  return {
    canAdvance: true,
    nextStep: STEP_ORDER[currentIndex + 1]
  }
}

export function getPreviousStep(currentStep) {
  const currentIndex = getStepIndex(currentStep)
  if (currentIndex === -1 || currentIndex <= 0) {
    return { canGoBack: false, previousStep: currentStep }
  }
  return {
    canGoBack: true,
    previousStep: STEP_ORDER[currentIndex - 1]
  }
}

export function canGoNext(currentStep) {
  if (currentStep === ONBOARDING_STEPS.COMPLETED || currentStep === ONBOARDING_STEPS.SKIPPED) {
    return false
  }
  if (currentStep === ONBOARDING_STEPS.CONFIRMATION) {
    return true
  }
  return getNextStep(currentStep).canAdvance
}

export function canGoPrevious(currentStep) {
  if (currentStep === ONBOARDING_STEPS.WELCOME ||
      currentStep === ONBOARDING_STEPS.COMPLETED ||
      currentStep === ONBOARDING_STEPS.SKIPPED) {
    return false
  }
  return getPreviousStep(currentStep).canGoBack
}

export function advanceStep(currentStep) {
  const result = getNextStep(currentStep)
  if (!result.canAdvance) {
    return {
      success: false,
      currentStep,
      error: `无法从 ${currentStep} 前进`
    }
  }
  return {
    success: true,
    currentStep: result.nextStep,
    previousStep: currentStep
  }
}

export function goBackStep(currentStep) {
  const result = getPreviousStep(currentStep)
  if (!result.canGoBack) {
    return {
      success: false,
      currentStep,
      error: `无法从 ${currentStep} 返回`
    }
  }
  return {
    success: true,
    currentStep: result.previousStep,
    previousStep: currentStep
  }
}

export function goToStep(targetStep) {
  if (!STEP_ORDER.includes(targetStep)) {
    return {
      success: false,
      currentStep: targetStep,
      error: `无效的步骤: ${targetStep}`
    }
  }
  return {
    success: true,
    currentStep: targetStep
  }
}

export function isFirstStep(step) {
  return step === ONBOARDING_STEPS.WELCOME
}

export function isLastStep(step) {
  return step === ONBOARDING_STEPS.CONFIRMATION
}

export function isTerminalStep(step) {
  return step === ONBOARDING_STEPS.COMPLETED || step === ONBOARDING_STEPS.SKIPPED
}

export function skipOnboarding(currentStep) {
  if (isTerminalStep(currentStep)) {
    return {
      success: false,
      currentStep,
      error: '引导流程已结束，无需跳过'
    }
  }
  return {
    success: true,
    currentStep: ONBOARDING_STEPS.SKIPPED,
    previousStep: currentStep,
    skippedAt: new Date().toISOString()
  }
}

export function completeOnboarding(currentStep) {
  if (currentStep !== ONBOARDING_STEPS.CONFIRMATION) {
    return {
      success: false,
      currentStep,
      error: '只有在确认步骤才能完成引导'
    }
  }
  return {
    success: true,
    currentStep: ONBOARDING_STEPS.COMPLETED,
    previousStep: currentStep,
    completedAt: new Date().toISOString()
  }
}

export function getProgress(currentStep) {
  if (currentStep === ONBOARDING_STEPS.SKIPPED || currentStep === ONBOARDING_STEPS.COMPLETED) {
    return {
      currentIndex: -1,
      totalSteps: STEP_ORDER.length,
      progressPercent: currentStep === ONBOARDING_STEPS.COMPLETED ? 100 : 0
    }
  }
  const currentIndex = getStepIndex(currentStep)
  const totalSteps = STEP_ORDER.length
  const progressPercent = totalSteps > 1 ? Math.round((currentIndex / (totalSteps - 1)) * 100) : 100
  return {
    currentIndex,
    totalSteps,
    progressPercent
  }
}

export function getVisibleSteps() {
  return [...STEP_ORDER]
}
