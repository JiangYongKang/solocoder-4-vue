import { describe, it, expect, vi } from 'vitest'
import {
  calculateDailyExpRate,
  estimateDaysToUpgrade,
  estimateUpgradeDate,
  calculateUpgradeEstimate,
  calculateUpgradeMilestones,
  formatUpgradeEstimate,
  getExpEfficiencyTip
} from '../../growth-level/upgradeEstimate.js'
import { LEVELS } from '../../growth-level/constants.js'

describe('upgradeEstimate', () => {
  describe('calculateDailyExpRate', () => {
    it('should return 0 for empty records', () => {
      expect(calculateDailyExpRate([])).toBe(0)
    })

    it('should return 0 when no recent records', () => {
      const oldRecords = [
        { id: 1, exp: 100, timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000 }
      ]
      expect(calculateDailyExpRate(oldRecords)).toBe(0)
    })

    it('should ignore negative exp records', () => {
      const records = [
        { id: 1, exp: 100, timestamp: Date.now() },
        { id: 2, exp: -50, timestamp: Date.now() }
      ]
      expect(calculateDailyExpRate(records, 1)).toBe(100)
    })

    it('should calculate average daily rate', () => {
      const now = Date.now()
      const records = [
        { id: 1, exp: 50, timestamp: now },
        { id: 2, exp: 30, timestamp: now - 24 * 60 * 60 * 1000 },
        { id: 3, exp: 20, timestamp: now - 2 * 24 * 60 * 60 * 1000 }
      ]
      expect(calculateDailyExpRate(records, 3)).toBe(33)
    })
  })

  describe('estimateDaysToUpgrade', () => {
    it('should return isMaxLevel true when at max level', () => {
      const result = estimateDaysToUpgrade(5000, 100)
      expect(result.isMaxLevel).toBe(true)
      expect(result.canEstimate).toBe(false)
    })

    it('should return 0 days when exp to next is 0', () => {
      const result = estimateDaysToUpgrade(99, 100)
      expect(result.days).toBe(0)
      expect(result.canEstimate).toBe(true)
    })

    it('should return cannot estimate when daily rate is 0', () => {
      const result = estimateDaysToUpgrade(0, 0)
      expect(result.canEstimate).toBe(false)
      expect(result.days).toBe(Infinity)
    })

    it('should calculate correct days', () => {
      const result = estimateDaysToUpgrade(0, 50)
      expect(result.days).toBe(2)
      expect(result.canEstimate).toBe(true)
    })

    it('should round up to next day', () => {
      const result = estimateDaysToUpgrade(0, 34)
      expect(result.days).toBe(3)
    })
  })

  describe('estimateUpgradeDate', () => {
    it('should return null when cannot estimate', () => {
      const result = estimateUpgradeDate(0, 0)
      expect(result.date).toBeNull()
    })

    it('should return null when at max level', () => {
      const result = estimateUpgradeDate(5000, 100)
      expect(result.date).toBeNull()
    })

    it('should calculate correct future date', () => {
      const fromDate = new Date('2024-01-01')
      const result = estimateUpgradeDate(0, 50, fromDate)
      expect(result.date).toBeInstanceOf(Date)
      expect(result.date.getDate()).toBe(3)
    })
  })

  describe('calculateUpgradeMilestones', () => {
    it('should return empty array when daily rate is 0', () => {
      const milestones = calculateUpgradeMilestones(0, 0)
      expect(milestones).toEqual([])
    })

    it('should return empty array when at max level', () => {
      const milestones = calculateUpgradeMilestones(5000, 100)
      expect(milestones).toEqual([])
    })

    it('should return milestones for future levels', () => {
      const milestones = calculateUpgradeMilestones(0, 100)
      expect(milestones.length).toBeGreaterThan(0)
      expect(milestones[0].level).toBe(LEVELS.L2)
      expect(milestones[0].expNeeded).toBe(100)
      expect(milestones[0].daysToReach).toBe(1)
    })

    it('should skip already reached levels', () => {
      const milestones = calculateUpgradeMilestones(300, 100)
      expect(milestones[0].level).toBe(LEVELS.L4)
    })
  })

  describe('formatUpgradeEstimate', () => {
    it('should show max level message', () => {
      const estimate = { isMaxLevel: true }
      expect(formatUpgradeEstimate(estimate)).toBe('已达最高等级')
    })

    it('should show no data message when cannot estimate', () => {
      const estimate = { isMaxLevel: false, daysToUpgrade: { canEstimate: false } }
      expect(formatUpgradeEstimate(estimate)).toBe('暂无足够数据预估升级时间')
    })

    it('should show immediate upgrade message', () => {
      const estimate = {
        isMaxLevel: false,
        daysToUpgrade: { canEstimate: true, days: 0 }
      }
      expect(formatUpgradeEstimate(estimate)).toBe('即将升级')
    })

    it('should format single day correctly', () => {
      const estimate = {
        isMaxLevel: false,
        daysToUpgrade: { canEstimate: true, days: 1 }
      }
      expect(formatUpgradeEstimate(estimate)).toBe('预计 1 天后升级')
    })

    it('should format multiple days correctly', () => {
      const estimate = {
        isMaxLevel: false,
        daysToUpgrade: { canEstimate: true, days: 5 }
      }
      expect(formatUpgradeEstimate(estimate)).toBe('预计 5 天后升级')
    })

    it('should format months correctly', () => {
      const estimate = {
        isMaxLevel: false,
        daysToUpgrade: { canEstimate: true, days: 60 }
      }
      expect(formatUpgradeEstimate(estimate)).toBe('预计约 2 个月后升级')
    })

    it('should format years correctly', () => {
      const estimate = {
        isMaxLevel: false,
        daysToUpgrade: { canEstimate: true, days: 400 }
      }
      expect(formatUpgradeEstimate(estimate)).toBe('预计约 1.1 年后升级')
    })
  })

  describe('getExpEfficiencyTip', () => {
    it('should warn when no exp gain recently', () => {
      const tips = getExpEfficiencyTip(100, 0, 500)
      expect(tips[0].type).toBe('warning')
      expect(tips[0].message).toContain('最近没有获得经验')
    })

    it('should congratulate at max level', () => {
      const tips = getExpEfficiencyTip(5000, 100, 500)
      expect(tips[0].type).toBe('success')
      expect(tips[0].message).toContain('恭喜达到最高等级')
    })

    it('should praise high efficiency (90%+ of cap)', () => {
      const tips = getExpEfficiencyTip(100, 460, 500)
      expect(tips[0].type).toBe('success')
      expect(tips[0].message).toContain('效率很高')
    })

    it('should suggest improvement for medium efficiency (50-90% of cap)', () => {
      const tips = getExpEfficiencyTip(100, 300, 500)
      expect(tips[0].type).toBe('info')
      expect(tips[0].message).toContain('还可以更快')
    })

    it('should warn for low efficiency (<50% of cap)', () => {
      const tips = getExpEfficiencyTip(100, 100, 500)
      expect(tips[0].type).toBe('warning')
      expect(tips[0].message).toContain('建议完成更多任务')
    })

    it('should celebrate when can upgrade today', () => {
      const tips = getExpEfficiencyTip(50, 100, 500)
      expect(tips.some(t => t.message.includes('今天就能升级'))).toBe(true)
    })
  })

  describe('calculateUpgradeEstimate', () => {
    it('should return complete estimate object', () => {
      const records = [
        { id: 1, exp: 100, timestamp: Date.now() }
      ]
      const estimate = calculateUpgradeEstimate(50, records, 500)

      expect(estimate.currentExp).toBe(50)
      expect(estimate.dailyExpRate).toBeGreaterThan(0)
      expect(estimate.milestones).toBeDefined()
      expect(Array.isArray(estimate.milestones)).toBe(true)
    })

    it('should adjust daily rate by daily cap', () => {
      const now = Date.now()
      const records = []
      for (let i = 0; i < 7; i++) {
        records.push({
          id: i + 1,
          exp: 800,
          timestamp: now - i * 24 * 60 * 60 * 1000
        })
      }
      const estimate = calculateUpgradeEstimate(0, records, 500)
      expect(estimate.adjustedDailyRate).toBe(500)
      expect(estimate.dailyExpRate).toBe(800)
    })
  })
})
