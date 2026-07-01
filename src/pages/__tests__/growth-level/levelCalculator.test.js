import { describe, it, expect } from 'vitest'
import {
  getLevelByExp,
  getExpForLevel,
  getExpForNextLevel,
  getExpToNextLevel,
  getLevelProgress,
  getOverallProgress,
  calculateLevelInfo,
  addExp,
  subtractExp,
  groupExpRecordsBySource,
  calculateExpSummary
} from '../../growth-level/levelCalculator.js'
import { LEVELS, MAX_LEVEL } from '../../growth-level/constants.js'

describe('levelCalculator', () => {
  describe('getLevelByExp', () => {
    it('should return L1 for negative exp', () => {
      expect(getLevelByExp(-100)).toBe(LEVELS.L1)
    })

    it('should return L1 for 0 exp', () => {
      expect(getLevelByExp(0)).toBe(LEVELS.L1)
    })

    it('should return L1 for exp just below L2 requirement', () => {
      expect(getLevelByExp(99)).toBe(LEVELS.L1)
    })

    it('should return L2 for exp at L2 requirement', () => {
      expect(getLevelByExp(100)).toBe(LEVELS.L2)
    })

    it('should return L3 for exp at L3 requirement', () => {
      expect(getLevelByExp(300)).toBe(LEVELS.L3)
    })

    it('should return L10 for exp at L10 requirement', () => {
      expect(getLevelByExp(4500)).toBe(LEVELS.L10)
    })

    it('should return L10 for exp beyond max', () => {
      expect(getLevelByExp(10000)).toBe(LEVELS.L10)
    })
  })

  describe('getExpForLevel', () => {
    it('should return 0 for invalid level (too low)', () => {
      expect(getExpForLevel(0)).toBe(0)
    })

    it('should return 0 for invalid level (too high)', () => {
      expect(getExpForLevel(11)).toBe(0)
    })

    it('should return correct exp for valid levels', () => {
      expect(getExpForLevel(LEVELS.L1)).toBe(0)
      expect(getExpForLevel(LEVELS.L2)).toBe(100)
      expect(getExpForLevel(LEVELS.L3)).toBe(300)
      expect(getExpForLevel(LEVELS.L10)).toBe(4500)
    })
  })

  describe('getExpForNextLevel', () => {
    it('should return 0 when at max level', () => {
      expect(getExpForNextLevel(MAX_LEVEL)).toBe(0)
    })

    it('should return correct exp for next level', () => {
      expect(getExpForNextLevel(LEVELS.L1)).toBe(100)
      expect(getExpForNextLevel(LEVELS.L2)).toBe(300)
      expect(getExpForNextLevel(LEVELS.L9)).toBe(4500)
    })
  })

  describe('getExpToNextLevel', () => {
    it('should return 0 when at max level', () => {
      expect(getExpToNextLevel(5000)).toBe(0)
    })

    it('should return correct exp needed for next level', () => {
      expect(getExpToNextLevel(0)).toBe(100)
      expect(getExpToNextLevel(50)).toBe(50)
      expect(getExpToNextLevel(99)).toBe(1)
      expect(getExpToNextLevel(100)).toBe(200)
    })
  })

  describe('getLevelProgress', () => {
    it('should return 100 when at max level', () => {
      expect(getLevelProgress(5000)).toBe(100)
    })

    it('should return 0 at level start', () => {
      expect(getLevelProgress(0)).toBe(0)
      expect(getLevelProgress(100)).toBe(0)
    })

    it('should return correct progress percentage', () => {
      expect(getLevelProgress(50)).toBe(50)
      expect(getLevelProgress(200)).toBe(50)
      expect(getLevelProgress(250)).toBe(75)
    })

    it('should be clamped between 0 and 100', () => {
      expect(getLevelProgress(-100)).toBe(0)
      expect(getLevelProgress(10000)).toBe(100)
    })
  })

  describe('getOverallProgress', () => {
    it('should return 0 for 0 exp', () => {
      expect(getOverallProgress(0)).toBe(0)
    })

    it('should return 100 for max exp', () => {
      expect(getOverallProgress(4500)).toBe(100)
    })

    it('should return correct overall percentage', () => {
      expect(getOverallProgress(450)).toBe(10)
      expect(getOverallProgress(2250)).toBe(50)
    })

    it('should be clamped at 100', () => {
      expect(getOverallProgress(10000)).toBe(100)
    })
  })

  describe('calculateLevelInfo', () => {
    it('should return complete level info for mid-level', () => {
      const info = calculateLevelInfo(250)
      expect(info.level).toBe(LEVELS.L2)
      expect(info.currentExp).toBe(250)
      expect(info.currentLevelExp).toBe(100)
      expect(info.nextLevelExp).toBe(300)
      expect(info.expToNext).toBe(50)
      expect(info.levelProgress).toBe(75)
      expect(info.overallProgress).toBe(6)
      expect(info.isMaxLevel).toBe(false)
    })

    it('should return correct info for max level', () => {
      const info = calculateLevelInfo(5000)
      expect(info.level).toBe(LEVELS.L10)
      expect(info.isMaxLevel).toBe(true)
      expect(info.expToNext).toBe(0)
      expect(info.levelProgress).toBe(100)
    })
  })

  describe('addExp', () => {
    it('should not add negative exp', () => {
      const result = addExp(100, -50)
      expect(result.newExp).toBe(100)
      expect(result.addedExp).toBe(0)
      expect(result.leveledUp).toBe(false)
    })

    it('should add exp correctly without daily cap', () => {
      const result = addExp(50, 100)
      expect(result.newExp).toBe(150)
      expect(result.addedExp).toBe(100)
      expect(result.cappedExp).toBe(0)
    })

    it('should trigger level up when crossing threshold', () => {
      const result = addExp(50, 100)
      expect(result.oldLevel).toBe(LEVELS.L1)
      expect(result.newLevel).toBe(LEVELS.L2)
      expect(result.leveledUp).toBe(true)
    })

    it('should respect daily cap', () => {
      const result = addExp(100, 200, 150, 100)
      expect(result.addedExp).toBe(50)
      expect(result.cappedExp).toBe(150)
      expect(result.newExp).toBe(150)
    })

    it('should cap at daily limit when currentDailyExp is 0', () => {
      const result = addExp(0, 600, 500, 0)
      expect(result.addedExp).toBe(500)
      expect(result.cappedExp).toBe(100)
    })
  })

  describe('subtractExp', () => {
    it('should not subtract negative exp', () => {
      const result = subtractExp(100, -50)
      expect(result.newExp).toBe(100)
      expect(result.subtractedExp).toBe(0)
      expect(result.leveledDown).toBe(false)
    })

    it('should subtract exp correctly', () => {
      const result = subtractExp(200, 50)
      expect(result.newExp).toBe(150)
      expect(result.subtractedExp).toBe(50)
    })

    it('should not go below 0', () => {
      const result = subtractExp(50, 100)
      expect(result.newExp).toBe(0)
      expect(result.subtractedExp).toBe(50)
    })

    it('should trigger level down when crossing threshold', () => {
      const result = subtractExp(150, 100)
      expect(result.oldLevel).toBe(LEVELS.L2)
      expect(result.newLevel).toBe(LEVELS.L1)
      expect(result.leveledDown).toBe(true)
    })
  })

  describe('groupExpRecordsBySource', () => {
    it('should group records by source', () => {
      const records = [
        { id: 1, source: 'daily_login', exp: 10 },
        { id: 2, source: 'task_complete', exp: 50 },
        { id: 3, source: 'daily_login', exp: 10 },
        { id: 4, source: 'task_complete', exp: 30 }
      ]

      const grouped = groupExpRecordsBySource(records)

      expect(grouped).toHaveLength(2)

      const taskGroup = grouped.find(g => g.source === 'task_complete')
      expect(taskGroup.totalExp).toBe(80)
      expect(taskGroup.count).toBe(2)

      const loginGroup = grouped.find(g => g.source === 'daily_login')
      expect(loginGroup.totalExp).toBe(20)
      expect(loginGroup.count).toBe(2)
    })

    it('should sort groups by absolute total exp', () => {
      const records = [
        { id: 1, source: 'daily_login', exp: 10 },
        { id: 2, source: 'penalty', exp: -100 },
        { id: 3, source: 'task_complete', exp: 50 }
      ]

      const grouped = groupExpRecordsBySource(records)
      expect(grouped[0].source).toBe('penalty')
      expect(grouped[1].source).toBe('task_complete')
      expect(grouped[2].source).toBe('daily_login')
    })
  })

  describe('calculateExpSummary', () => {
    it('should calculate correct summary', () => {
      const records = [
        { id: 1, exp: 100 },
        { id: 2, exp: -50 },
        { id: 3, exp: 200 },
        { id: 4, exp: -30 }
      ]

      const summary = calculateExpSummary(records)
      expect(summary.totalGained).toBe(300)
      expect(summary.totalLost).toBe(80)
      expect(summary.netExp).toBe(220)
      expect(summary.recordCount).toBe(4)
    })

    it('should handle empty records', () => {
      const summary = calculateExpSummary([])
      expect(summary.totalGained).toBe(0)
      expect(summary.totalLost).toBe(0)
      expect(summary.netExp).toBe(0)
      expect(summary.recordCount).toBe(0)
    })
  })
})
