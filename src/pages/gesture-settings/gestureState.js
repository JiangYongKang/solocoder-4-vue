import { GESTURE_STATUS, GESTURE_STEP, MAX_ERRORS, LOCK_DURATION } from './constants.js'
import {
  validateGesture,
  matchGestures,
  incrementErrorCount,
  resetErrorCount,
  resetGesture,
  canVerify,
  isLockExpired,
  syncToggleState
} from './gestureValidator.js'

const VALID_TRANSITIONS = {
  [GESTURE_STATUS.OFF]: [GESTURE_STATUS.DRAWING],
  [GESTURE_STATUS.DRAWING]: [GESTURE_STATUS.CONFIRMING, GESTURE_STATUS.OFF, GESTURE_STATUS.SET],
  [GESTURE_STATUS.CONFIRMING]: [GESTURE_STATUS.SET, GESTURE_STATUS.DRAWING, GESTURE_STATUS.OFF],
  [GESTURE_STATUS.SET]: [GESTURE_STATUS.VERIFYING, GESTURE_STATUS.LOCKED, GESTURE_STATUS.OFF, GESTURE_STATUS.DRAWING],
  [GESTURE_STATUS.VERIFYING]: [GESTURE_STATUS.SET, GESTURE_STATUS.LOCKED, GESTURE_STATUS.DRAWING],
  [GESTURE_STATUS.LOCKED]: [GESTURE_STATUS.SET, GESTURE_STATUS.OFF]
}

export function canTransition(currentStatus, targetStatus) {
  const validTargets = VALID_TRANSITIONS[currentStatus]
  return validTargets ? validTargets.includes(targetStatus) : false
}

export function getNextPossibleTransitions(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || []
}

export function transitionStatus(currentStatus, targetStatus, payload = {}) {
  if (!canTransition(currentStatus, targetStatus)) {
    return {
      success: false,
      currentStatus,
      targetStatus,
      error: `无法从状态 ${currentStatus} 转换到 ${targetStatus}`
    }
  }

  return {
    success: true,
    currentStatus: targetStatus,
    error: null,
    ...payload
  }
}

export function enableGesture(currentStatus) {
  if (currentStatus !== GESTURE_STATUS.OFF) {
    return {
      success: false,
      currentStatus,
      step: GESTURE_STEP.IDLE,
      error: '手势密码已经开启'
    }
  }

  return transitionStatus(currentStatus, GESTURE_STATUS.DRAWING, {
    step: GESTURE_STEP.FIRST_DRAW,
    message: '请绘制新手势密码'
  })
}

export function disableGesture(currentStatus) {
  const result = transitionStatus(currentStatus, GESTURE_STATUS.OFF, {
    step: GESTURE_STEP.IDLE,
    ...resetGesture()
  })

  return {
    ...result,
    message: result.success ? '手势密码已关闭' : result.error
  }
}

export function setFirstGesture(currentStatus, currentStep, points) {
  if (currentStatus !== GESTURE_STATUS.DRAWING || currentStep !== GESTURE_STEP.FIRST_DRAW) {
    return {
      success: false,
      currentStatus,
      step: currentStep,
      error: '当前状态不允许设置手势'
    }
  }

  const validation = validateGesture(points)
  if (!validation.valid) {
    return {
      success: false,
      currentStatus,
      step: currentStep,
      error: validation.message
    }
  }

  return transitionStatus(currentStatus, GESTURE_STATUS.CONFIRMING, {
    step: GESTURE_STEP.SECOND_DRAW,
    firstGesture: points,
    message: '请再次绘制手势进行确认'
  })
}

export function confirmGesture(currentStatus, currentStep, firstGesture, points) {
  if (currentStatus !== GESTURE_STATUS.CONFIRMING || currentStep !== GESTURE_STEP.SECOND_DRAW) {
    return {
      success: false,
      currentStatus,
      step: currentStep,
      error: '当前状态不允许确认手势'
    }
  }

  const validation = validateGesture(points)
  if (!validation.valid) {
    return {
      success: false,
      currentStatus,
      step: currentStep,
      error: validation.message
    }
  }

  const matchResult = matchGestures(firstGesture, points)
  if (!matchResult.matched) {
    return {
      success: false,
      currentStatus,
      step: GESTURE_STEP.FIRST_DRAW,
      firstGesture: null,
      error: matchResult.message
    }
  }

  return transitionStatus(currentStatus, GESTURE_STATUS.SET, {
    step: GESTURE_STEP.IDLE,
    gesture: points,
    firstGesture: null,
    ...resetErrorCount(),
    message: '手势密码设置成功'
  })
}

export function verifyGesture(currentStatus, savedGesture, points, errorCount) {
  if (currentStatus !== GESTURE_STATUS.SET && currentStatus !== GESTURE_STATUS.VERIFYING) {
    return {
      success: false,
      currentStatus,
      error: '当前状态不允许验证手势'
    }
  }

  if (!canVerify(errorCount)) {
    const result = transitionStatus(currentStatus, GESTURE_STATUS.LOCKED, {
      isLocked: true,
      lockStartTime: Date.now(),
      error: '错误次数过多，请稍后再试'
    })
    return {
      ...result,
      success: false
    }
  }

  const matchResult = matchGestures(savedGesture, points)
  if (!matchResult.matched) {
    const errorResult = incrementErrorCount(errorCount)
    if (errorResult.isLocked) {
      const result = transitionStatus(currentStatus, GESTURE_STATUS.LOCKED, {
        ...errorResult,
        lockStartTime: Date.now(),
        error: errorResult.message
      })
      return {
        ...result,
        success: false
      }
    }

    return {
      success: false,
      currentStatus: GESTURE_STATUS.VERIFYING,
      ...errorResult,
      error: matchResult.message
    }
  }

  return {
    success: true,
    currentStatus: GESTURE_STATUS.SET,
    ...resetErrorCount(),
    message: '手势验证成功'
  }
}

export function unlockAfterLock(currentStatus, lockStartTime, lockDuration = LOCK_DURATION) {
  if (currentStatus !== GESTURE_STATUS.LOCKED) {
    return {
      success: false,
      currentStatus,
      error: '当前未处于锁定状态'
    }
  }

  if (!isLockExpired(lockStartTime, lockDuration)) {
    return {
      success: false,
      currentStatus,
      error: '锁定时间未到，请稍后再试'
    }
  }

  return transitionStatus(currentStatus, GESTURE_STATUS.SET, {
    ...resetErrorCount(),
    lockStartTime: null,
    message: '锁定已解除，请重新验证'
  })
}

export function startReset(currentStatus, savedGesture, points, errorCount) {
  if (currentStatus !== GESTURE_STATUS.SET) {
    return {
      success: false,
      currentStatus,
      step: GESTURE_STEP.IDLE,
      error: '当前状态不允许重置手势'
    }
  }

  const verifyResult = verifyGesture(currentStatus, savedGesture, points, errorCount)
  if (!verifyResult.success) {
    return verifyResult
  }

  return transitionStatus(currentStatus, GESTURE_STATUS.DRAWING, {
    step: GESTURE_STEP.FIRST_DRAW,
    ...resetGesture(),
    message: '验证成功，请绘制新手势'
  })
}

export function cancelReset(currentStatus) {
  if (currentStatus === GESTURE_STATUS.DRAWING || currentStatus === GESTURE_STATUS.CONFIRMING) {
    return transitionStatus(currentStatus, GESTURE_STATUS.SET, {
      step: GESTURE_STEP.IDLE,
      firstGesture: null,
      message: '已取消重置'
    })
  }

  return {
    success: false,
    currentStatus,
    step: GESTURE_STEP.IDLE,
    error: '当前状态不支持取消操作'
  }
}

export function toggleGesture(isEnabled, currentStatus, currentState) {
  const syncedState = syncToggleState(isEnabled, currentState)

  if (!isEnabled) {
    const result = disableGesture(currentStatus)
    return {
      ...result,
      ...syncedState
    }
  }

  if (isEnabled && currentStatus === GESTURE_STATUS.OFF) {
    const result = enableGesture(currentStatus)
    return {
      ...result,
      ...syncedState
    }
  }

  return {
    success: true,
    currentStatus,
    ...syncedState
  }
}

export function getStatusLabel(status) {
  const labels = {
    [GESTURE_STATUS.OFF]: '未开启',
    [GESTURE_STATUS.DRAWING]: '绘制中',
    [GESTURE_STATUS.CONFIRMING]: '确认中',
    [GESTURE_STATUS.SET]: '已设置',
    [GESTURE_STATUS.VERIFYING]: '验证中',
    [GESTURE_STATUS.LOCKED]: '已锁定'
  }
  return labels[status] || '未知状态'
}

export function getStepLabel(step) {
  const labels = {
    [GESTURE_STEP.IDLE]: '请绘制手势密码',
    [GESTURE_STEP.FIRST_DRAW]: '请绘制新手势',
    [GESTURE_STEP.SECOND_DRAW]: '请再次绘制手势',
    [GESTURE_STEP.VERIFY]: '请验证手势密码',
    [GESTURE_STEP.RESET]: '请验证原手势以重置'
  }
  return labels[step] || ''
}

export function getInitialState() {
  return {
    isEnabled: false,
    status: GESTURE_STATUS.OFF,
    step: GESTURE_STEP.IDLE,
    gesture: null,
    firstGesture: null,
    errorCount: 0,
    isLocked: false,
    lockStartTime: null,
    message: ''
  }
}
