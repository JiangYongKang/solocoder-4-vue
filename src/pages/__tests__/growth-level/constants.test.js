import { describe, it, expect } from 'vitest'
import {
  LEVELS,
  LEVEL_NAMES,
  LEVEL_COLORS,
  LEVEL_ICONS,
  LEVEL_EXP_REQUIREMENTS,
  EXP_SOURCE_TYPES,
  EXP_SOURCE_LABELS,
  BENEFIT_STATUS,
  BENEFIT_STATUS_LABELS,
  BENEFIT_TYPES,
  BENEFIT_TYPE_LABELS,
  TASK_STATUS,
  TASK_STATUS_LABELS,
  TASK_TYPES,
  MAX_LEVEL,
  DAILY_EXP_CAP,
  CLAIM_COOLDOWN_HOURS
} from '../../growth-level/constants.js'

describe('constants', () => {
  describe('LEVELS', () => {
    it('should have 10 levels from L1 to L10', () => {
      expect(LEVELS.L1).toBe(1)
      expect(LEVELS.L2).toBe(2)
      expect(LEVELS.L3).toBe(3)
      expect(LEVELS.L4).toBe(4)
      expect(LEVELS.L5).toBe(5)
      expect(LEVELS.L6).toBe(6)
      expect(LEVELS.L7).toBe(7)
      expect(LEVELS.L8).toBe(8)
      expect(LEVELS.L9).toBe(9)
      expect(LEVELS.L10).toBe(10)
      expect(Object.keys(LEVELS)).toHaveLength(10)
    })
  })

  describe('LEVEL_NAMES', () => {
    it('should have correct names for all levels', () => {
      expect(LEVEL_NAMES[LEVELS.L1]).toBe('新手')
      expect(LEVEL_NAMES[LEVELS.L2]).toBe('入门')
      expect(LEVEL_NAMES[LEVELS.L3]).toBe('进阶')
      expect(LEVEL_NAMES[LEVELS.L4]).toBe('熟练')
      expect(LEVEL_NAMES[LEVELS.L5]).toBe('精通')
      expect(LEVEL_NAMES[LEVELS.L6]).toBe('专家')
      expect(LEVEL_NAMES[LEVELS.L7]).toBe('大师')
      expect(LEVEL_NAMES[LEVELS.L8]).toBe('宗师')
      expect(LEVEL_NAMES[LEVELS.L9]).toBe('传奇')
      expect(LEVEL_NAMES[LEVELS.L10]).toBe('神话')
    })
  })

  describe('LEVEL_EXP_REQUIREMENTS', () => {
    it('should have increasing exp requirements', () => {
      for (let i = 1; i < 10; i++) {
        expect(LEVEL_EXP_REQUIREMENTS[i + 1]).toBeGreaterThan(LEVEL_EXP_REQUIREMENTS[i])
      }
    })

    it('should have correct values', () => {
      expect(LEVEL_EXP_REQUIREMENTS[LEVELS.L1]).toBe(0)
      expect(LEVEL_EXP_REQUIREMENTS[LEVELS.L2]).toBe(100)
      expect(LEVEL_EXP_REQUIREMENTS[LEVELS.L3]).toBe(300)
      expect(LEVEL_EXP_REQUIREMENTS[LEVELS.L10]).toBe(4500)
    })
  })

  describe('EXP_SOURCE_TYPES', () => {
    it('should have all required source types', () => {
      expect(EXP_SOURCE_TYPES.DAILY_LOGIN).toBe('daily_login')
      expect(EXP_SOURCE_TYPES.TASK_COMPLETE).toBe('task_complete')
      expect(EXP_SOURCE_TYPES.CONTENT_CONTRIBUTE).toBe('content_contribute')
      expect(EXP_SOURCE_TYPES.COMMUNITY_INTERACT).toBe('community_interact')
      expect(EXP_SOURCE_TYPES.ACHIEVEMENT).toBe('achievement')
      expect(EXP_SOURCE_TYPES.PURCHASE).toBe('purchase')
      expect(EXP_SOURCE_TYPES.PENALTY).toBe('penalty')
      expect(EXP_SOURCE_TYPES.CORRECTION).toBe('correction')
      expect(Object.keys(EXP_SOURCE_TYPES)).toHaveLength(8)
    })
  })

  describe('BENEFIT_STATUS', () => {
    it('should have all 5 benefit statuses', () => {
      expect(BENEFIT_STATUS.UNLOCKED).toBe('unlocked')
      expect(BENEFIT_STATUS.LOCKED).toBe('locked')
      expect(BENEFIT_STATUS.CLAIMABLE).toBe('claimable')
      expect(BENEFIT_STATUS.CLAIMED).toBe('claimed')
      expect(BENEFIT_STATUS.EXPIRED).toBe('expired')
      expect(Object.keys(BENEFIT_STATUS)).toHaveLength(5)
    })
  })

  describe('TASK_STATUS', () => {
    it('should have all 4 task statuses', () => {
      expect(TASK_STATUS.NOT_STARTED).toBe('not_started')
      expect(TASK_STATUS.IN_PROGRESS).toBe('in_progress')
      expect(TASK_STATUS.COMPLETED).toBe('completed')
      expect(TASK_STATUS.CLAIMED).toBe('claimed')
      expect(Object.keys(TASK_STATUS)).toHaveLength(4)
    })
  })

  describe('configuration constants', () => {
    it('should have correct config values', () => {
      expect(MAX_LEVEL).toBe(10)
      expect(DAILY_EXP_CAP).toBe(500)
      expect(CLAIM_COOLDOWN_HOURS).toBe(24)
    })
  })
})
