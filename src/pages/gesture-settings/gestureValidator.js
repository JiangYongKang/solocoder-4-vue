import { MIN_POINTS, MAX_ERRORS, POINT_COUNT } from './constants.js'

export function validatePointCount(points, minPoints = MIN_POINTS) {
  if (!Array.isArray(points)) {
    return {
      valid: false,
      message: '手势数据格式错误'
    }
  }

  if (points.length < minPoints) {
    return {
      valid: false,
      message: `至少需要连接 ${minPoints} 个点位`
    }
  }

  return {
    valid: true,
    message: '点位数量符合要求'
  }
}

export function validatePointRange(points, maxPoints = POINT_COUNT) {
  if (!Array.isArray(points)) {
    return {
      valid: false,
      message: '手势数据格式错误'
    }
  }

  for (const point of points) {
    if (typeof point !== 'number' || point < 0 || point >= maxPoints) {
      return {
        valid: false,
        message: `点位索引必须在 0-${maxPoints - 1} 范围内`
      }
    }
  }

  return {
    valid: true,
    message: '点位范围符合要求'
  }
}

export function validateNoDuplicatePoints(points) {
  if (!Array.isArray(points)) {
    return {
      valid: false,
      message: '手势数据格式错误'
    }
  }

  const uniquePoints = new Set(points)
  if (uniquePoints.size !== points.length) {
    return {
      valid: false,
      message: '手势中不能有重复的点位'
    }
  }

  return {
    valid: true,
    message: '点位无重复'
  }
}

export function validateGesture(points, minPoints = MIN_POINTS, maxPoints = POINT_COUNT) {
  const countResult = validatePointCount(points, minPoints)
  if (!countResult.valid) {
    return countResult
  }

  const rangeResult = validatePointRange(points, maxPoints)
  if (!rangeResult.valid) {
    return rangeResult
  }

  const duplicateResult = validateNoDuplicatePoints(points)
  if (!duplicateResult.valid) {
    return duplicateResult
  }

  return {
    valid: true,
    message: '手势有效'
  }
}

export function matchGestures(firstGesture, secondGesture) {
  if (!Array.isArray(firstGesture) || !Array.isArray(secondGesture)) {
    return {
      matched: false,
      message: '手势数据格式错误'
    }
  }

  if (firstGesture.length !== secondGesture.length) {
    return {
      matched: false,
      message: '两次绘制的手势长度不一致'
    }
  }

  for (let i = 0; i < firstGesture.length; i++) {
    if (firstGesture[i] !== secondGesture[i]) {
      return {
        matched: false,
        message: '手势不匹配，请重新绘制'
      }
    }
  }

  return {
    matched: true,
    message: '手势匹配成功'
  }
}

export function incrementErrorCount(currentCount, maxErrors = MAX_ERRORS) {
  const newCount = currentCount + 1
  const isLocked = newCount >= maxErrors

  return {
    errorCount: newCount,
    isLocked,
    remainingAttempts: Math.max(0, maxErrors - newCount),
    message: isLocked
      ? `错误次数已达上限（${maxErrors}次），请稍后再试`
      : `还有 ${maxErrors - newCount} 次机会`
  }
}

export function resetErrorCount() {
  return {
    errorCount: 0,
    isLocked: false,
    remainingAttempts: MAX_ERRORS,
    message: '错误次数已重置'
  }
}

export function canVerify(currentErrorCount, maxErrors = MAX_ERRORS) {
  return currentErrorCount < maxErrors
}

export function getLockRemainingTime(lockStartTime, lockDuration) {
  if (!lockStartTime) return 0
  const elapsed = Date.now() - lockStartTime
  return Math.max(0, lockDuration - elapsed)
}

export function isLockExpired(lockStartTime, lockDuration) {
  if (!lockStartTime) return true
  return Date.now() - lockStartTime >= lockDuration
}

export function resetGesture() {
  return {
    gesture: null,
    firstGesture: null,
    secondGesture: null,
    errorCount: 0,
    isLocked: false,
    lockStartTime: null,
    message: '手势数据已重置'
  }
}

export function syncToggleState(isEnabled, currentState) {
  if (!isEnabled) {
    return {
      ...resetGesture(),
      isEnabled: false,
      message: '手势密码已关闭，相关数据已清理'
    }
  }

  return {
    ...currentState,
    isEnabled: true,
    message: '手势密码已开启'
  }
}
