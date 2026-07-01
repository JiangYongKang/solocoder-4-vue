import { describe, expect, it } from 'vitest'
import { CANCELLATION_STATUS, COOLING_PERIOD_DAYS } from '../../account-cancellation/constants.js'
import {
    calculateCoolingPeriodEnd,
    checkStatusFromTime,
    formatDateString,
    formatRemainingTime,
    getMilestoneEvents,
    getProgressPercentage,
    getProgressStage,
    getRemainingTime,
    isInCoolingPeriod,
    shouldAutoComplete
} from '../../account-cancellation/coolingPeriod.js'

describe('coolingPeriod', () => {
  const baseTime = '2025-01-01T00:00:00.000Z'

  describe('calculateCoolingPeriodEnd', () => {
    it('should calculate cooling end correctly with default days', () => {
      const result = calculateCoolingPeriodEnd(baseTime)
      const expected = new Date('2025-01-08T00:00:00.000Z').toISOString()
      expect(result).toBe(expected)
    })

    it('should calculate cooling end correctly with custom days', () => {
      const result = calculateCoolingPeriodEnd(baseTime, 3)
      const expected = new Date('2025-01-04T00:00:00.000Z').toISOString()
      expect(result).toBe(expected)
    })

    it('should handle edge case: 0 days', () => {
      const result = calculateCoolingPeriodEnd(baseTime, 0)
      expect(result).toBe(baseTime)
    })

    it('should return null for invalid date', () => {
      const result = calculateCoolingPeriodEnd('invalid-date')
      expect(result).toBeNull()
    })
  })

  describe('getRemainingTime', () => {
    it('should return correct remaining time when in the future', () => {
      const target = new Date(new Date(baseTime).getTime() + 2 * 86400000 + 3 * 3600000 + 4 * 60000 + 5000).toISOString()
      const result = getRemainingTime(target, baseTime)
      expect(result.expired).toBe(false)
      expect(result.days).toBe(2)
      expect(result.hours).toBe(3)
      expect(result.minutes).toBe(4)
      expect(result.seconds).toBe(5)
      expect(result.totalSeconds).toBe(2 * 86400 + 3 * 3600 + 4 * 60 + 5)
    })

    it('should return expired when target is in the past', () => {
      const pastTarget = '2024-12-25T00:00:00.000Z'
      const result = getRemainingTime(pastTarget, baseTime)
      expect(result.expired).toBe(true)
      expect(result.days).toBe(0)
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
      expect(result.seconds).toBe(0)
      expect(result.totalSeconds).toBe(0)
    })

    it('should return expired when target equals current time', () => {
      const result = getRemainingTime(baseTime, baseTime)
      expect(result.expired).toBe(true)
    })

    it('should return null for invalid target time', () => {
      const result = getRemainingTime('invalid', baseTime)
      expect(result).toBeNull()
    })

    it('should return null for invalid current time', () => {
      const result = getRemainingTime(baseTime, 'invalid')
      expect(result).toBeNull()
    })

    it('should handle exactly one day', () => {
      const target = new Date(new Date(baseTime).getTime() + 86400000).toISOString()
      const result = getRemainingTime(target, baseTime)
      expect(result.expired).toBe(false)
      expect(result.days).toBe(1)
      expect(result.hours).toBe(0)
    })
  })

  describe('formatRemainingTime', () => {
    it('should format correctly with days', () => {
      const remaining = { expired: false, days: 2, hours: 3, minutes: 4, seconds: 5, totalSeconds: 0 }
      const result = formatRemainingTime(remaining)
      expect(result).toContain('2天')
      expect(result).toContain('03时')
      expect(result).toContain('04分')
      expect(result).toContain('05秒')
    })

    it('should format correctly without days', () => {
      const remaining = { expired: false, days: 0, hours: 5, minutes: 30, seconds: 15, totalSeconds: 0 }
      const result = formatRemainingTime(remaining)
      expect(result).not.toContain('天')
      expect(result).toContain('05时')
      expect(result).toContain('30分')
      expect(result).toContain('15秒')
    })

    it('should return "已结束" when expired', () => {
      const remaining = { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 }
      const result = formatRemainingTime(remaining)
      expect(result).toBe('已结束')
    })

    it('should return default string for null input', () => {
      const result = formatRemainingTime(null)
      expect(result).toBe('--天 --时 --分 --秒')
    })

    it('should pad single digit values', () => {
      const remaining = { expired: false, days: 1, hours: 1, minutes: 2, seconds: 3, totalSeconds: 0 }
      const result = formatRemainingTime(remaining)
      expect(result).toContain('01时')
      expect(result).toContain('02分')
      expect(result).toContain('03秒')
    })
  })

  describe('getProgressPercentage', () => {
    it('should return 0% at the beginning', () => {
      const result = getProgressPercentage(baseTime, baseTime)
      expect(result).toBe(0)
    })

    it('should return 100% at the end', () => {
      const endTime = new Date(new Date(baseTime).getTime() + COOLING_PERIOD_DAYS * 86400000).toISOString()
      const result = getProgressPercentage(baseTime, endTime)
      expect(result).toBe(100)
    })

    it('should return 50% at halfway point', () => {
      const halfway = new Date(new Date(baseTime).getTime() + COOLING_PERIOD_DAYS * 86400000 / 2).toISOString()
      const result = getProgressPercentage(baseTime, halfway)
      expect(result).toBe(50)
    })

    it('should return 0% when current is before submit', () => {
      const before = '2024-12-31T00:00:00.000Z'
      const result = getProgressPercentage(baseTime, before)
      expect(result).toBe(0)
    })

    it('should return 100% when current is far after end', () => {
      const farFuture = '2026-01-01T00:00:00.000Z'
      const result = getProgressPercentage(baseTime, farFuture)
      expect(result).toBe(100)
    })

    it('should return 0 for invalid dates', () => {
      expect(getProgressPercentage('invalid', baseTime)).toBe(0)
      expect(getProgressPercentage(baseTime, 'invalid')).toBe(0)
    })

    it('should work with custom cooling days', () => {
      const customDays = 10
      const halfway = new Date(new Date(baseTime).getTime() + customDays * 86400000 / 2).toISOString()
      const result = getProgressPercentage(baseTime, halfway, customDays)
      expect(result).toBe(50)
    })
  })

  describe('getProgressStage', () => {
    it('should return stage 0 at 0%', () => {
      const result = getProgressStage(0)
      expect(result.stage).toBe(0)
      expect(result.label).toBe('待处理')
    })

    it('should return stage 1 at 25%', () => {
      const result = getProgressStage(25)
      expect(result.stage).toBe(1)
      expect(result.label).toBe('冷静期初期')
    })

    it('should return stage 2 at 50%', () => {
      const result = getProgressStage(50)
      expect(result.stage).toBe(2)
      expect(result.label).toBe('冷静期中期')
    })

    it('should return stage 3 at 75%', () => {
      const result = getProgressStage(75)
      expect(result.stage).toBe(3)
      expect(result.label).toBe('冷静期后期')
    })

    it('should return stage 4 at 100%', () => {
      const result = getProgressStage(100)
      expect(result.stage).toBe(4)
      expect(result.label).toBe('即将完成')
    })

    it('should handle edge boundary: 33% vs 34%', () => {
      expect(getProgressStage(33).stage).toBe(1)
      expect(getProgressStage(34).stage).toBe(2)
    })

    it('should handle edge boundary: 66% vs 67%', () => {
      expect(getProgressStage(66).stage).toBe(2)
      expect(getProgressStage(67).stage).toBe(3)
    })

    it('should handle edge boundary: 99% vs 100%', () => {
      expect(getProgressStage(99).stage).toBe(3)
      expect(getProgressStage(100).stage).toBe(4)
    })
  })

  describe('isInCoolingPeriod', () => {
    it('should return true during cooling period', () => {
      const during = new Date(new Date(baseTime).getTime() + 3 * 86400000).toISOString()
      const result = isInCoolingPeriod(baseTime, during)
      expect(result).toBe(true)
    })

    it('should return false before cooling period', () => {
      const before = '2024-12-31T00:00:00.000Z'
      const result = isInCoolingPeriod(baseTime, before)
      expect(result).toBe(false)
    })

    it('should return false after cooling period', () => {
      const after = new Date(new Date(baseTime).getTime() + 10 * 86400000).toISOString()
      const result = isInCoolingPeriod(baseTime, after)
      expect(result).toBe(false)
    })

    it('should return false exactly at cooling end', () => {
      const end = new Date(new Date(baseTime).getTime() + COOLING_PERIOD_DAYS * 86400000).toISOString()
      const result = isInCoolingPeriod(baseTime, end)
      expect(result).toBe(false)
    })

    it('should return true exactly at cooling start', () => {
      const result = isInCoolingPeriod(baseTime, baseTime)
      expect(result).toBe(true)
    })

    it('should return false for invalid dates', () => {
      expect(isInCoolingPeriod('invalid', baseTime)).toBe(false)
      expect(isInCoolingPeriod(baseTime, 'invalid')).toBe(false)
    })
  })

  describe('shouldAutoComplete', () => {
    it('should return true after cooling period ends', () => {
      const after = new Date(new Date(baseTime).getTime() + 10 * 86400000).toISOString()
      const result = shouldAutoComplete(baseTime, after)
      expect(result).toBe(true)
    })

    it('should return false during cooling period', () => {
      const during = new Date(new Date(baseTime).getTime() + 3 * 86400000).toISOString()
      const result = shouldAutoComplete(baseTime, during)
      expect(result).toBe(false)
    })

    it('should return false before cooling period', () => {
      const before = '2024-12-31T00:00:00.000Z'
      const result = shouldAutoComplete(baseTime, before)
      expect(result).toBe(false)
    })

    it('should return true exactly at cooling end', () => {
      const end = new Date(new Date(baseTime).getTime() + COOLING_PERIOD_DAYS * 86400000).toISOString()
      const result = shouldAutoComplete(baseTime, end)
      expect(result).toBe(true)
    })

    it('should return false for invalid dates', () => {
      expect(shouldAutoComplete('invalid', baseTime)).toBe(false)
      expect(shouldAutoComplete(baseTime, 'invalid')).toBe(false)
    })
  })

  describe('formatDateString', () => {
    it('should format date correctly', () => {
      const result = formatDateString(baseTime)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    })

    it('should pad single digit month and day', () => {
      const result = formatDateString(baseTime)
      expect(result).toBe('2025-01-01 00:00')
    })

    it('should return "--" for invalid date', () => {
      const result = formatDateString('invalid-date')
      expect(result).toBe('--')
    })

    it('should handle non-zero time components', () => {
      const date = '2025-06-15T14:30:45.000Z'
      const result = formatDateString(date)
      expect(result).toContain('14:30')
    })
  })

  describe('getMilestoneEvents', () => {
    it('should return 4 milestones', () => {
      const result = getMilestoneEvents(baseTime)
      expect(result).toHaveLength(4)
    })

    it('should have correct milestone structure', () => {
      const result = getMilestoneEvents(baseTime)
      for (const milestone of result) {
        expect(milestone.id).toBeDefined()
        expect(milestone.label).toBeDefined()
        expect(milestone.date).toBeDefined()
        expect(typeof milestone.offset).toBe('number')
        expect(milestone.description).toBeDefined()
      }
    })

    it('should have offsets in increasing order', () => {
      const result = getMilestoneEvents(baseTime)
      const offsets = result.map(m => m.offset)
      for (let i = 1; i < offsets.length; i++) {
        expect(offsets[i]).toBeGreaterThanOrEqual(offsets[i - 1])
      }
    })

    it('should have first offset 0 and last offset 100', () => {
      const result = getMilestoneEvents(baseTime)
      expect(result[0].offset).toBe(0)
      expect(result[result.length - 1].offset).toBe(100)
    })

    it('should return empty array for invalid date', () => {
      const result = getMilestoneEvents('invalid')
      expect(result).toEqual([])
    })

    it('should work with custom cooling days', () => {
      const result = getMilestoneEvents(baseTime, 14)
      expect(result).toHaveLength(4)
    })
  })

  describe('checkStatusFromTime', () => {
    it('should return REVOKED when revokedAt exists', () => {
      const revokedAt = '2025-01-03T00:00:00.000Z'
      const current = '2025-01-02T00:00:00.000Z'
      const result = checkStatusFromTime(baseTime, revokedAt, current)
      expect(result).toBe(CANCELLATION_STATUS.REVOKED)
    })

    it('should return NOT_APPLIED when no submittedAt', () => {
      const result = checkStatusFromTime(null, null, baseTime)
      expect(result).toBe(CANCELLATION_STATUS.NOT_APPLIED)
    })

    it('should return COOLING_PERIOD during cooling period', () => {
      const current = new Date(new Date(baseTime).getTime() + 3 * 86400000).toISOString()
      const result = checkStatusFromTime(baseTime, null, current)
      expect(result).toBe(CANCELLATION_STATUS.COOLING_PERIOD)
    })

    it('should return COMPLETED after cooling period', () => {
      const current = new Date(new Date(baseTime).getTime() + 10 * 86400000).toISOString()
      const result = checkStatusFromTime(baseTime, null, current)
      expect(result).toBe(CANCELLATION_STATUS.COMPLETED)
    })

    it('should return COMPLETED exactly at cooling end', () => {
      const end = new Date(new Date(baseTime).getTime() + COOLING_PERIOD_DAYS * 86400000).toISOString()
      const result = checkStatusFromTime(baseTime, null, end)
      expect(result).toBe(CANCELLATION_STATUS.COMPLETED)
    })
  })
})
