import { describe, it, expect } from 'vitest'
import {
  GESTURE_STATUS,
  GESTURE_STEP,
  MIN_POINTS,
  MAX_ERRORS,
  LOCK_DURATION,
  POINT_COUNT,
  GESTURE_STATUS_LABELS,
  GESTURE_STEP_LABELS,
  SECURITY_TIPS
} from '../../gesture-settings/constants.js'

describe('gesture constants', () => {
  describe('GESTURE_STATUS', () => {
    it('should have all required status values', () => {
      expect(GESTURE_STATUS.OFF).toBe('off')
      expect(GESTURE_STATUS.DRAWING).toBe('drawing')
      expect(GESTURE_STATUS.CONFIRMING).toBe('confirming')
      expect(GESTURE_STATUS.SET).toBe('set')
      expect(GESTURE_STATUS.VERIFYING).toBe('verifying')
      expect(GESTURE_STATUS.LOCKED).toBe('locked')
    })

    it('should have exactly 6 status values', () => {
      expect(Object.keys(GESTURE_STATUS)).toHaveLength(6)
    })
  })

  describe('GESTURE_STEP', () => {
    it('should have all required step values', () => {
      expect(GESTURE_STEP.IDLE).toBe('idle')
      expect(GESTURE_STEP.FIRST_DRAW).toBe('first_draw')
      expect(GESTURE_STEP.SECOND_DRAW).toBe('second_draw')
      expect(GESTURE_STEP.VERIFY).toBe('verify')
      expect(GESTURE_STEP.RESET).toBe('reset')
    })

    it('should have exactly 5 step values', () => {
      expect(Object.keys(GESTURE_STEP)).toHaveLength(5)
    })
  })

  describe('configuration constants', () => {
    it('should have correct MIN_POINTS value', () => {
      expect(MIN_POINTS).toBe(4)
    })

    it('should have correct MAX_ERRORS value', () => {
      expect(MAX_ERRORS).toBe(5)
    })

    it('should have correct LOCK_DURATION value', () => {
      expect(LOCK_DURATION).toBe(30000)
    })

    it('should have correct POINT_COUNT value', () => {
      expect(POINT_COUNT).toBe(9)
    })
  })

  describe('GESTURE_STATUS_LABELS', () => {
    it('should have labels for all statuses', () => {
      expect(GESTURE_STATUS_LABELS[GESTURE_STATUS.OFF]).toBe('未开启')
      expect(GESTURE_STATUS_LABELS[GESTURE_STATUS.DRAWING]).toBe('绘制中')
      expect(GESTURE_STATUS_LABELS[GESTURE_STATUS.CONFIRMING]).toBe('确认中')
      expect(GESTURE_STATUS_LABELS[GESTURE_STATUS.SET]).toBe('已设置')
      expect(GESTURE_STATUS_LABELS[GESTURE_STATUS.VERIFYING]).toBe('验证中')
      expect(GESTURE_STATUS_LABELS[GESTURE_STATUS.LOCKED]).toBe('已锁定')
    })
  })

  describe('GESTURE_STEP_LABELS', () => {
    it('should have labels for all steps', () => {
      expect(GESTURE_STEP_LABELS[GESTURE_STEP.IDLE]).toBe('请绘制手势密码')
      expect(GESTURE_STEP_LABELS[GESTURE_STEP.FIRST_DRAW]).toBe('请绘制新手势')
      expect(GESTURE_STEP_LABELS[GESTURE_STEP.SECOND_DRAW]).toBe('请再次绘制手势')
      expect(GESTURE_STEP_LABELS[GESTURE_STEP.VERIFY]).toBe('请验证手势密码')
      expect(GESTURE_STEP_LABELS[GESTURE_STEP.RESET]).toBe('请验证原手势以重置')
    })
  })

  describe('SECURITY_TIPS', () => {
    it('should have exactly 3 security tips', () => {
      expect(SECURITY_TIPS).toHaveLength(3)
    })

    it('should have valid tip structure', () => {
      SECURITY_TIPS.forEach(tip => {
        expect(tip).toHaveProperty('id')
        expect(tip).toHaveProperty('icon')
        expect(tip).toHaveProperty('title')
        expect(tip).toHaveProperty('description')
        expect(typeof tip.id).toBe('number')
        expect(typeof tip.icon).toBe('string')
        expect(typeof tip.title).toBe('string')
        expect(typeof tip.description).toBe('string')
        expect(tip.title.length).toBeGreaterThan(0)
        expect(tip.description.length).toBeGreaterThan(0)
      })
    })

    it('should have unique tip ids', () => {
      const ids = SECURITY_TIPS.map(tip => tip.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should contain expected tip content', () => {
      expect(SECURITY_TIPS[0].title).toBe('保护账号安全')
      expect(SECURITY_TIPS[1].title).toBe('避免简单手势')
      expect(SECURITY_TIPS[2].title).toBe('牢记手势图案')
    })
  })
})
