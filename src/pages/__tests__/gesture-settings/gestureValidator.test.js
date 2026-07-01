import { describe, it, expect, vi } from 'vitest'
import {
  validatePointCount,
  validatePointRange,
  validateNoDuplicatePoints,
  validateGesture,
  matchGestures,
  incrementErrorCount,
  resetErrorCount,
  canVerify,
  getLockRemainingTime,
  isLockExpired,
  resetGesture,
  syncToggleState
} from '../../gesture-settings/gestureValidator.js'
import { MIN_POINTS, MAX_ERRORS, POINT_COUNT } from '../../gesture-settings/constants.js'

describe('gestureValidator', () => {
  describe('validatePointCount', () => {
    it('should return valid when points meet minimum requirement', () => {
      const points = [0, 1, 2, 3]
      const result = validatePointCount(points)
      expect(result.valid).toBe(true)
      expect(result.message).toBe('点位数量符合要求')
    })

    it('should return invalid when points are less than minimum', () => {
      const points = [0, 1, 2]
      const result = validatePointCount(points)
      expect(result.valid).toBe(false)
      expect(result.message).toBe(`至少需要连接 ${MIN_POINTS} 个点位`)
    })

    it('should return invalid when input is not an array', () => {
      const result = validatePointCount('not an array')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('手势数据格式错误')
    })

    it('should accept custom minPoints value', () => {
      const points = [0, 1]
      const result = validatePointCount(points, 2)
      expect(result.valid).toBe(true)
    })
  })

  describe('validatePointRange', () => {
    it('should return valid when all points are in range', () => {
      const points = [0, 1, 2, 3, 4, 5, 6, 7, 8]
      const result = validatePointRange(points)
      expect(result.valid).toBe(true)
      expect(result.message).toBe('点位范围符合要求')
    })

    it('should return invalid when point is negative', () => {
      const points = [0, 1, -1, 3]
      const result = validatePointRange(points)
      expect(result.valid).toBe(false)
      expect(result.message).toBe(`点位索引必须在 0-${POINT_COUNT - 1} 范围内`)
    })

    it('should return invalid when point exceeds max', () => {
      const points = [0, 1, 9, 3]
      const result = validatePointRange(points)
      expect(result.valid).toBe(false)
    })

    it('should return invalid when point is not a number', () => {
      const points = [0, 1, '2', 3]
      const result = validatePointRange(points)
      expect(result.valid).toBe(false)
    })

    it('should return invalid when input is not an array', () => {
      const result = validatePointRange(null)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('手势数据格式错误')
    })

    it('should accept custom maxPoints value', () => {
      const points = [0, 1, 2, 3]
      const result = validatePointRange(points, 4)
      expect(result.valid).toBe(true)
    })
  })

  describe('validateNoDuplicatePoints', () => {
    it('should return valid when no duplicate points', () => {
      const points = [0, 1, 2, 3]
      const result = validateNoDuplicatePoints(points)
      expect(result.valid).toBe(true)
      expect(result.message).toBe('点位无重复')
    })

    it('should return invalid when there are duplicate points', () => {
      const points = [0, 1, 2, 1, 3]
      const result = validateNoDuplicatePoints(points)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('手势中不能有重复的点位')
    })

    it('should return invalid when input is not an array', () => {
      const result = validateNoDuplicatePoints(123)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('手势数据格式错误')
    })
  })

  describe('validateGesture', () => {
    it('should return valid for a proper gesture', () => {
      const points = [0, 4, 8, 2]
      const result = validateGesture(points)
      expect(result.valid).toBe(true)
      expect(result.message).toBe('手势有效')
    })

    it('should return invalid for too few points', () => {
      const points = [0, 1, 2]
      const result = validateGesture(points)
      expect(result.valid).toBe(false)
      expect(result.message).toContain('至少需要连接')
    })

    it('should return invalid for out of range points', () => {
      const points = [0, 1, 2, 10]
      const result = validateGesture(points)
      expect(result.valid).toBe(false)
      expect(result.message).toContain('点位索引必须在')
    })

    it('should return invalid for duplicate points', () => {
      const points = [0, 1, 2, 1]
      const result = validateGesture(points)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('手势中不能有重复的点位')
    })

    it('should accept custom min and max values', () => {
      const points = [0, 1, 2]
      const result = validateGesture(points, 3, 4)
      expect(result.valid).toBe(true)
    })
  })

  describe('matchGestures', () => {
    it('should return matched for identical gestures', () => {
      const first = [0, 4, 8, 2]
      const second = [0, 4, 8, 2]
      const result = matchGestures(first, second)
      expect(result.matched).toBe(true)
      expect(result.message).toBe('手势匹配成功')
    })

    it('should return not matched for different gestures', () => {
      const first = [0, 4, 8, 2]
      const second = [0, 4, 2, 8]
      const result = matchGestures(first, second)
      expect(result.matched).toBe(false)
      expect(result.message).toBe('手势不匹配，请重新绘制')
    })

    it('should return not matched for different lengths', () => {
      const first = [0, 4, 8, 2]
      const second = [0, 4, 8]
      const result = matchGestures(first, second)
      expect(result.matched).toBe(false)
      expect(result.message).toBe('两次绘制的手势长度不一致')
    })

    it('should return not matched when inputs are not arrays', () => {
      const result = matchGestures(null, [0, 1, 2, 3])
      expect(result.matched).toBe(false)
      expect(result.message).toBe('手势数据格式错误')
    })
  })

  describe('incrementErrorCount', () => {
    it('should increment error count correctly', () => {
      const result = incrementErrorCount(0)
      expect(result.errorCount).toBe(1)
      expect(result.isLocked).toBe(false)
      expect(result.remainingAttempts).toBe(MAX_ERRORS - 1)
      expect(result.message).toBe(`还有 ${MAX_ERRORS - 1} 次机会`)
    })

    it('should lock when reaching max errors', () => {
      const result = incrementErrorCount(MAX_ERRORS - 1)
      expect(result.errorCount).toBe(MAX_ERRORS)
      expect(result.isLocked).toBe(true)
      expect(result.remainingAttempts).toBe(0)
      expect(result.message).toBe(`错误次数已达上限（${MAX_ERRORS}次），请稍后再试`)
    })

    it('should accept custom maxErrors value', () => {
      const result = incrementErrorCount(2, 3)
      expect(result.errorCount).toBe(3)
      expect(result.isLocked).toBe(true)
    })

    it('should lock when exceeding max errors', () => {
      const result = incrementErrorCount(MAX_ERRORS)
      expect(result.isLocked).toBe(true)
    })
  })

  describe('resetErrorCount', () => {
    it('should reset error count to zero', () => {
      const result = resetErrorCount()
      expect(result.errorCount).toBe(0)
      expect(result.isLocked).toBe(false)
      expect(result.remainingAttempts).toBe(MAX_ERRORS)
      expect(result.message).toBe('错误次数已重置')
    })
  })

  describe('canVerify', () => {
    it('should return true when under error limit', () => {
      expect(canVerify(0)).toBe(true)
      expect(canVerify(MAX_ERRORS - 1)).toBe(true)
    })

    it('should return false when at or over error limit', () => {
      expect(canVerify(MAX_ERRORS)).toBe(false)
      expect(canVerify(MAX_ERRORS + 1)).toBe(false)
    })

    it('should accept custom maxErrors value', () => {
      expect(canVerify(2, 3)).toBe(true)
      expect(canVerify(3, 3)).toBe(false)
    })
  })

  describe('getLockRemainingTime', () => {
    it('should return correct remaining time', () => {
      const now = Date.now()
      const lockStartTime = now - 10000
      const lockDuration = 30000
      const result = getLockRemainingTime(lockStartTime, lockDuration)
      expect(result).toBeGreaterThan(19000)
      expect(result).toBeLessThanOrEqual(20000)
    })

    it('should return 0 when lock time is expired', () => {
      const now = Date.now()
      const lockStartTime = now - 40000
      const lockDuration = 30000
      const result = getLockRemainingTime(lockStartTime, lockDuration)
      expect(result).toBe(0)
    })

    it('should return 0 when lockStartTime is null', () => {
      const result = getLockRemainingTime(null, 30000)
      expect(result).toBe(0)
    })
  })

  describe('isLockExpired', () => {
    it('should return false when lock is still active', () => {
      const now = Date.now()
      const lockStartTime = now - 10000
      const lockDuration = 30000
      expect(isLockExpired(lockStartTime, lockDuration)).toBe(false)
    })

    it('should return true when lock is expired', () => {
      const now = Date.now()
      const lockStartTime = now - 40000
      const lockDuration = 30000
      expect(isLockExpired(lockStartTime, lockDuration)).toBe(true)
    })

    it('should return true when lockStartTime is null', () => {
      expect(isLockExpired(null, 30000)).toBe(true)
    })
  })

  describe('resetGesture', () => {
    it('should reset all gesture related state', () => {
      const result = resetGesture()
      expect(result.gesture).toBeNull()
      expect(result.firstGesture).toBeNull()
      expect(result.secondGesture).toBeNull()
      expect(result.errorCount).toBe(0)
      expect(result.isLocked).toBe(false)
      expect(result.lockStartTime).toBeNull()
      expect(result.message).toBe('手势数据已重置')
    })
  })

  describe('syncToggleState', () => {
    it('should reset all state when toggle is disabled', () => {
      const currentState = {
        gesture: [0, 4, 8, 2],
        errorCount: 2,
        isLocked: false
      }
      const result = syncToggleState(false, currentState)
      expect(result.isEnabled).toBe(false)
      expect(result.gesture).toBeNull()
      expect(result.firstGesture).toBeNull()
      expect(result.errorCount).toBe(0)
      expect(result.isLocked).toBe(false)
      expect(result.message).toBe('手势密码已关闭，相关数据已清理')
    })

    it('should preserve state when toggle is enabled', () => {
      const currentState = {
        gesture: [0, 4, 8, 2],
        errorCount: 0,
        isLocked: false
      }
      const result = syncToggleState(true, currentState)
      expect(result.isEnabled).toBe(true)
      expect(result.gesture).toEqual([0, 4, 8, 2])
      expect(result.errorCount).toBe(0)
      expect(result.message).toBe('手势密码已开启')
    })
  })
})
