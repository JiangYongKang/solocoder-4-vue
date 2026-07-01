import { describe, it, expect, beforeEach } from 'vitest'
import {
  GESTURE_STATUS,
  GESTURE_STEP,
  LOCK_DURATION
} from '../../gesture-settings/constants.js'
import {
  canTransition,
  getNextPossibleTransitions,
  transitionStatus,
  enableGesture,
  disableGesture,
  setFirstGesture,
  confirmGesture,
  verifyGesture,
  unlockAfterLock,
  startReset,
  cancelReset,
  toggleGesture,
  getStatusLabel,
  getStepLabel,
  getInitialState
} from '../../gesture-settings/gestureState.js'

const OFF = GESTURE_STATUS.OFF
const DRAWING = GESTURE_STATUS.DRAWING
const CONFIRMING = GESTURE_STATUS.CONFIRMING
const SET = GESTURE_STATUS.SET
const VERIFYING = GESTURE_STATUS.VERIFYING
const LOCKED = GESTURE_STATUS.LOCKED

const FIRST_DRAW = GESTURE_STEP.FIRST_DRAW
const SECOND_DRAW = GESTURE_STEP.SECOND_DRAW
const IDLE = GESTURE_STEP.IDLE

const validGesture = [0, 4, 8, 2]
const anotherGesture = [0, 1, 2, 3]

describe('gestureState', () => {
  describe('canTransition', () => {
    it('should allow transition from OFF to DRAWING', () => {
      expect(canTransition(OFF, DRAWING)).toBe(true)
    })

    it('should allow transition from DRAWING to CONFIRMING', () => {
      expect(canTransition(DRAWING, CONFIRMING)).toBe(true)
    })

    it('should allow transition from DRAWING to OFF', () => {
      expect(canTransition(DRAWING, OFF)).toBe(true)
    })

    it('should allow transition from CONFIRMING to SET', () => {
      expect(canTransition(CONFIRMING, SET)).toBe(true)
    })

    it('should allow transition from CONFIRMING to DRAWING', () => {
      expect(canTransition(CONFIRMING, DRAWING)).toBe(true)
    })

    it('should allow transition from SET to VERIFYING', () => {
      expect(canTransition(SET, VERIFYING)).toBe(true)
    })

    it('should allow transition from SET to LOCKED', () => {
      expect(canTransition(SET, LOCKED)).toBe(true)
    })

    it('should allow transition from SET to OFF', () => {
      expect(canTransition(SET, OFF)).toBe(true)
    })

    it('should allow transition from VERIFYING to SET', () => {
      expect(canTransition(VERIFYING, SET)).toBe(true)
    })

    it('should allow transition from VERIFYING to LOCKED', () => {
      expect(canTransition(VERIFYING, LOCKED)).toBe(true)
    })

    it('should allow transition from LOCKED to SET', () => {
      expect(canTransition(LOCKED, SET)).toBe(true)
    })

    it('should not allow invalid transitions', () => {
      expect(canTransition(OFF, SET)).toBe(false)
      expect(canTransition(DRAWING, LOCKED)).toBe(false)
      expect(canTransition(OFF, LOCKED)).toBe(false)
      expect(canTransition('invalid', DRAWING)).toBe(false)
    })
  })

  describe('getNextPossibleTransitions', () => {
    it('should return correct transitions for OFF', () => {
      expect(getNextPossibleTransitions(OFF)).toEqual([DRAWING])
    })

    it('should return correct transitions for DRAWING', () => {
      expect(getNextPossibleTransitions(DRAWING)).toEqual([CONFIRMING, OFF, SET])
    })

    it('should return correct transitions for SET', () => {
      const transitions = getNextPossibleTransitions(SET)
      expect(transitions).toContain(VERIFYING)
      expect(transitions).toContain(LOCKED)
      expect(transitions).toContain(OFF)
    })

    it('should return empty array for invalid status', () => {
      expect(getNextPossibleTransitions('invalid')).toEqual([])
    })
  })

  describe('transitionStatus', () => {
    it('should transition successfully when valid', () => {
      const result = transitionStatus(OFF, DRAWING, { step: FIRST_DRAW })
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(DRAWING)
      expect(result.step).toBe(FIRST_DRAW)
      expect(result.error).toBeNull()
    })

    it('should fail transition when invalid', () => {
      const result = transitionStatus(OFF, SET)
      expect(result.success).toBe(false)
      expect(result.currentStatus).toBe(OFF)
      expect(result.error).toBeDefined()
      expect(typeof result.error).toBe('string')
    })
  })

  describe('enableGesture', () => {
    it('should enable gesture from OFF status', () => {
      const result = enableGesture(OFF)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(DRAWING)
      expect(result.step).toBe(FIRST_DRAW)
      expect(result.message).toBe('请绘制新手势密码')
    })

    it('should fail to enable from non-OFF status', () => {
      const result = enableGesture(SET)
      expect(result.success).toBe(false)
      expect(result.currentStatus).toBe(SET)
      expect(result.error).toBe('手势密码已经开启')
    })
  })

  describe('disableGesture', () => {
    it('should disable gesture from SET status', () => {
      const result = disableGesture(SET)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(OFF)
      expect(result.step).toBe(IDLE)
      expect(result.gesture).toBeNull()
      expect(result.errorCount).toBe(0)
      expect(result.message).toBe('手势密码已关闭')
    })

    it('should disable gesture from DRAWING status', () => {
      const result = disableGesture(DRAWING)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(OFF)
    })

    it('should fail to disable from invalid transition', () => {
      const result = disableGesture('invalid')
      expect(result.success).toBe(false)
    })
  })

  describe('setFirstGesture', () => {
    it('should set first gesture successfully', () => {
      const result = setFirstGesture(DRAWING, FIRST_DRAW, validGesture)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(CONFIRMING)
      expect(result.step).toBe(SECOND_DRAW)
      expect(result.firstGesture).toEqual(validGesture)
      expect(result.message).toBe('请再次绘制手势进行确认')
    })

    it('should fail when status is not DRAWING', () => {
      const result = setFirstGesture(SET, FIRST_DRAW, validGesture)
      expect(result.success).toBe(false)
      expect(result.currentStatus).toBe(SET)
      expect(result.error).toBe('当前状态不允许设置手势')
    })

    it('should fail when step is not FIRST_DRAW', () => {
      const result = setFirstGesture(DRAWING, SECOND_DRAW, validGesture)
      expect(result.success).toBe(false)
      expect(result.step).toBe(SECOND_DRAW)
    })

    it('should fail when gesture is invalid (too few points)', () => {
      const result = setFirstGesture(DRAWING, FIRST_DRAW, [0, 1, 2])
      expect(result.success).toBe(false)
      expect(result.currentStatus).toBe(DRAWING)
      expect(result.error).toContain('至少需要连接')
    })
  })

  describe('confirmGesture', () => {
    it('should confirm gesture successfully when matching', () => {
      const result = confirmGesture(CONFIRMING, SECOND_DRAW, validGesture, validGesture)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(SET)
      expect(result.step).toBe(IDLE)
      expect(result.gesture).toEqual(validGesture)
      expect(result.firstGesture).toBeNull()
      expect(result.errorCount).toBe(0)
      expect(result.message).toBe('手势密码设置成功')
    })

    it('should fail when gestures do not match', () => {
      const result = confirmGesture(CONFIRMING, SECOND_DRAW, validGesture, anotherGesture)
      expect(result.success).toBe(false)
      expect(result.currentStatus).toBe(CONFIRMING)
      expect(result.step).toBe(FIRST_DRAW)
      expect(result.firstGesture).toBeNull()
      expect(result.error).toBe('手势不匹配，请重新绘制')
    })

    it('should fail when status is not CONFIRMING', () => {
      const result = confirmGesture(DRAWING, SECOND_DRAW, validGesture, validGesture)
      expect(result.success).toBe(false)
      expect(result.error).toBe('当前状态不允许确认手势')
    })

    it('should fail when second gesture is invalid', () => {
      const result = confirmGesture(CONFIRMING, SECOND_DRAW, validGesture, [0, 1, 2])
      expect(result.success).toBe(false)
      expect(result.error).toContain('至少需要连接')
    })
  })

  describe('verifyGesture', () => {
    it('should verify successfully when gesture matches', () => {
      const result = verifyGesture(SET, validGesture, validGesture, 0)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(SET)
      expect(result.errorCount).toBe(0)
      expect(result.isLocked).toBe(false)
      expect(result.message).toBe('手势验证成功')
    })

    it('should increment error count when gesture does not match', () => {
      const result = verifyGesture(SET, validGesture, anotherGesture, 0)
      expect(result.success).toBe(false)
      expect(result.currentStatus).toBe(VERIFYING)
      expect(result.errorCount).toBe(1)
      expect(result.isLocked).toBe(false)
      expect(result.error).toBe('手势不匹配，请重新绘制')
    })

    it('should lock when error count reaches max', () => {
      const result = verifyGesture(SET, validGesture, anotherGesture, 4)
      expect(result.success).toBe(false)
      expect(result.currentStatus).toBe(LOCKED)
      expect(result.isLocked).toBe(true)
      expect(result.lockStartTime).toBeDefined()
    })

    it('should lock immediately when cannot verify', () => {
      const result = verifyGesture(SET, validGesture, anotherGesture, 5)
      expect(result.success).toBe(false)
      expect(result.currentStatus).toBe(LOCKED)
      expect(result.isLocked).toBe(true)
    })

    it('should fail when status is not SET or VERIFYING', () => {
      const result = verifyGesture(DRAWING, validGesture, validGesture, 0)
      expect(result.success).toBe(false)
      expect(result.error).toBe('当前状态不允许验证手势')
    })
  })

  describe('unlockAfterLock', () => {
    it('should unlock after lock duration expires', () => {
      const lockStartTime = Date.now() - LOCK_DURATION - 1000
      const result = unlockAfterLock(LOCKED, lockStartTime, LOCK_DURATION)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(SET)
      expect(result.isLocked).toBe(false)
      expect(result.errorCount).toBe(0)
      expect(result.lockStartTime).toBeNull()
    })

    it('should fail when not in LOCKED status', () => {
      const result = unlockAfterLock(SET, Date.now(), LOCK_DURATION)
      expect(result.success).toBe(false)
      expect(result.error).toBe('当前未处于锁定状态')
    })

    it('should fail when lock duration not expired', () => {
      const lockStartTime = Date.now() - 10000
      const result = unlockAfterLock(LOCKED, lockStartTime, LOCK_DURATION)
      expect(result.success).toBe(false)
      expect(result.error).toBe('锁定时间未到，请稍后再试')
    })
  })

  describe('startReset', () => {
    it('should start reset after successful verification', () => {
      const result = startReset(SET, validGesture, validGesture, 0)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(DRAWING)
      expect(result.step).toBe(FIRST_DRAW)
      expect(result.gesture).toBeNull()
      expect(result.message).toBe('验证成功，请绘制新手势')
    })

    it('should fail when verification fails', () => {
      const result = startReset(SET, validGesture, anotherGesture, 0)
      expect(result.success).toBe(false)
      expect(result.currentStatus).toBe(VERIFYING)
      expect(result.errorCount).toBe(1)
    })

    it('should fail when not in SET status', () => {
      const result = startReset(DRAWING, validGesture, validGesture, 0)
      expect(result.success).toBe(false)
      expect(result.error).toBe('当前状态不允许重置手势')
    })
  })

  describe('cancelReset', () => {
    it('should cancel reset from DRAWING status', () => {
      const result = cancelReset(DRAWING)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(SET)
      expect(result.step).toBe(IDLE)
      expect(result.firstGesture).toBeNull()
      expect(result.message).toBe('已取消重置')
    })

    it('should cancel reset from CONFIRMING status', () => {
      const result = cancelReset(CONFIRMING)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(SET)
    })

    it('should fail to cancel from SET status', () => {
      const result = cancelReset(SET)
      expect(result.success).toBe(false)
      expect(result.error).toBe('当前状态不支持取消操作')
    })
  })

  describe('toggleGesture', () => {
    it('should enable gesture when toggle is true and current status is OFF', () => {
      const currentState = getInitialState()
      const result = toggleGesture(true, OFF, currentState)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(DRAWING)
      expect(result.isEnabled).toBe(true)
    })

    it('should disable gesture when toggle is false', () => {
      const currentState = {
        ...getInitialState(),
        gesture: validGesture,
        errorCount: 2
      }
      const result = toggleGesture(false, SET, currentState)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(OFF)
      expect(result.isEnabled).toBe(false)
      expect(result.gesture).toBeNull()
      expect(result.errorCount).toBe(0)
    })

    it('should return success when toggle is true but already enabled', () => {
      const currentState = {
        ...getInitialState(),
        isEnabled: true,
        gesture: validGesture
      }
      const result = toggleGesture(true, SET, currentState)
      expect(result.success).toBe(true)
      expect(result.currentStatus).toBe(SET)
      expect(result.isEnabled).toBe(true)
      expect(result.gesture).toEqual(validGesture)
    })
  })

  describe('getStatusLabel', () => {
    it('should return correct labels for all statuses', () => {
      expect(getStatusLabel(OFF)).toBe('未开启')
      expect(getStatusLabel(DRAWING)).toBe('绘制中')
      expect(getStatusLabel(CONFIRMING)).toBe('确认中')
      expect(getStatusLabel(SET)).toBe('已设置')
      expect(getStatusLabel(VERIFYING)).toBe('验证中')
      expect(getStatusLabel(LOCKED)).toBe('已锁定')
    })

    it('should return default label for invalid status', () => {
      expect(getStatusLabel('invalid')).toBe('未知状态')
    })
  })

  describe('getStepLabel', () => {
    it('should return correct labels for all steps', () => {
      expect(getStepLabel(IDLE)).toBe('请绘制手势密码')
      expect(getStepLabel(FIRST_DRAW)).toBe('请绘制新手势')
      expect(getStepLabel(SECOND_DRAW)).toBe('请再次绘制手势')
      expect(getStepLabel(GESTURE_STEP.VERIFY)).toBe('请验证手势密码')
      expect(getStepLabel(GESTURE_STEP.RESET)).toBe('请验证原手势以重置')
    })

    it('should return empty string for invalid step', () => {
      expect(getStepLabel('invalid')).toBe('')
    })
  })

  describe('getInitialState', () => {
    it('should return correct initial state', () => {
      const state = getInitialState()
      expect(state.isEnabled).toBe(false)
      expect(state.status).toBe(OFF)
      expect(state.step).toBe(IDLE)
      expect(state.gesture).toBeNull()
      expect(state.firstGesture).toBeNull()
      expect(state.errorCount).toBe(0)
      expect(state.isLocked).toBe(false)
      expect(state.lockStartTime).toBeNull()
      expect(state.message).toBe('')
    })

    it('should return a new object each time', () => {
      const state1 = getInitialState()
      const state2 = getInitialState()
      expect(state1).not.toBe(state2)
    })
  })
})
