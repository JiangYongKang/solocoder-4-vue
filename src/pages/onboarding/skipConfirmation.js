import { ONBOARDING_STEPS, STEP_ORDER } from './constants.js'

export function executeSkip(currentStep) {
  if (!canSkip(currentStep)) {
    return {
      success: false,
      currentStep,
      error: '当前状态无法跳过引导'
    }
  }
  return {
    success: true,
    currentStep: ONBOARDING_STEPS.SKIPPED,
    previousStep: currentStep,
    skipped: true,
    skippedAt: new Date().toISOString(),
    remainingSteps: getRemainingSteps(currentStep)
  }
}

export function canSkip(currentStep) {
  if (currentStep === ONBOARDING_STEPS.COMPLETED ||
      currentStep === ONBOARDING_STEPS.SKIPPED) {
    return false
  }
  if (!STEP_ORDER.includes(currentStep)) {
    return false
  }
  return true
}

export function createSkipWarning(currentStep) {
  if (!canSkip(currentStep)) {
    return {
      canSkip: false,
      title: '',
      message: '',
      warnings: [],
      continueInfo: []
    }
  }

  const stepsLeft = getRemainingSteps(currentStep)
  const warnings = []
  const continueInfo = []

  if (stepsLeft.length > 0) {
    warnings.push({
      type: 'steps',
      message: `还有 ${stepsLeft.length} 个步骤未完成`
    })
  }

  warnings.push({
    type: 'preferences',
    message: '偏好设置将使用默认配置'
  })

  warnings.push({
    type: 'example_data',
    message: '示例数据设置可能不会被应用'
  })

  continueInfo.push({
    icon: '⚙️',
    title: '随时可重新配置',
    description: '您可以随时在系统设置中调整偏好'
  })

  continueInfo.push({
    icon: '🧭',
    title: '设置入口位置',
    description: '进入系统后，点击右上角头像 → 账户设置'
  })

  continueInfo.push({
    icon: '🔄',
    title: '重新开启引导',
    description: '在设置中可以随时重新查看引导流程'
  })

  return {
    canSkip: true,
    title: '确认跳过引导？',
    message: '跳过引导后，系统将使用默认偏好设置。您可以在稍后的设置页面中随时调整。',
    confirmText: '确认跳过',
    cancelText: '继续引导',
    warnings,
    continueInfo
  }
}

export function getRemainingSteps(currentStep) {
  const currentIndex = STEP_ORDER.indexOf(currentStep)
  if (currentIndex === -1) {
    return []
  }
  return STEP_ORDER.filter((_, index) => index > currentIndex)
}

export function getSkippedStateInfo() {
  return {
    state: ONBOARDING_STEPS.SKIPPED,
    title: '已跳过引导',
    icon: '⏭️',
    subtitle: '系统已使用默认偏好配置',
    description: '您已跳过引导流程，以下是后续建议操作，帮助您更好地使用系统。',
    suggestions: [
      {
        id: 'review_defaults',
        title: '查看默认偏好配置',
        description: '确认系统默认配置是否符合您的需求',
        action: '查看配置',
        icon: '📋'
      },
      {
        id: 'customize_preferences',
        title: '自定义偏好设置',
        description: '根据个人习惯调整主题、语言和通知',
        action: '前往设置',
        icon: '⚙️'
      },
      {
        id: 'restart_onboarding',
        title: '重新查看引导',
        description: '如需完整查看引导流程，可重新启动',
        action: '重新开始',
        icon: '🔄'
      }
    ],
    tips: [
      '在个人设置中随时可以调整所有配置选项',
      '示例数据可以在数据管理页面中随时启用或关闭',
      '遇到问题可随时查看帮助中心文档'
    ]
  }
}

export function confirmSkip(currentStep) {
  if (!canSkip(currentStep)) {
    return {
      success: false,
      error: '当前状态无法跳过引导'
    }
  }
  return {
    success: true,
    skipped: true,
    skippedAt: new Date().toISOString(),
    remainingSteps: getRemainingSteps(currentStep)
  }
}

export function cancelSkip() {
  return {
    success: true,
    skipped: false,
    action: 'continue'
  }
}
