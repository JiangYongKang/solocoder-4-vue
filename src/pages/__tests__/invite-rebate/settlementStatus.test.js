import { describe, it, expect } from 'vitest'
import {
  getSettlementStatusLabel,
  getSettlementStatusIcon,
  getSettlementStatusColor,
  determineSettlementStatus,
  canSettleNow,
  isInFreezePeriod,
  isProcessing,
  hasProblem,
  calculateSettlementTimeline,
  getDaysUntilSettlement,
  getSettlementStatusBadgeClass
} from '../../invite-rebate/settlementStatus.js'
import {
  SETTLEMENT_STATUS,
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_ICONS,
  SETTLEMENT_STATUS_COLORS,
  SETTLEMENT_RULES
} from '../../invite-rebate/constants.js'

describe('settlementStatus', () => {
  describe('getSettlementStatusLabel', () => {
    it('should return correct label for all statuses', () => {
      Object.keys(SETTLEMENT_STATUS).forEach(key => {
        const status = SETTLEMENT_STATUS[key]
        expect(getSettlementStatusLabel(status)).toBe(SETTLEMENT_STATUS_LABELS[status])
      })
    })

    it('should return default label for unknown status', () => {
      expect(getSettlementStatusLabel('unknown')).toBe('未知状态')
    })
  })

  describe('getSettlementStatusIcon', () => {
    it('should return correct icon for all statuses', () => {
      Object.keys(SETTLEMENT_STATUS).forEach(key => {
        const status = SETTLEMENT_STATUS[key]
        expect(getSettlementStatusIcon(status)).toBe(SETTLEMENT_STATUS_ICONS[status])
      })
    })

    it('should return default icon for unknown status', () => {
      expect(getSettlementStatusIcon('unknown')).toBe('❓')
    })
  })

  describe('getSettlementStatusColor', () => {
    it('should return correct color for all statuses', () => {
      Object.keys(SETTLEMENT_STATUS).forEach(key => {
        const status = SETTLEMENT_STATUS[key]
        expect(getSettlementStatusColor(status)).toBe(SETTLEMENT_STATUS_COLORS[status])
      })
    })

    it('should return default color for unknown status', () => {
      expect(getSettlementStatusColor('unknown')).toBe('#6b7280')
    })
  })

  describe('determineSettlementStatus', () => {
    it('should return PENDING for null record', () => {
      expect(determineSettlementStatus(null)).toBe(SETTLEMENT_STATUS.PENDING)
    })

    it('should return FROZEN when freezeReason is set', () => {
      const record = {
        freezeReason: 'suspicious_activity'
      }
      expect(determineSettlementStatus(record)).toBe(SETTLEMENT_STATUS.FROZEN)
    })

    it('should return REJECTED when rejected is true', () => {
      const record = {
        rejected: true
      }
      expect(determineSettlementStatus(record)).toBe(SETTLEMENT_STATUS.REJECTED)
    })

    it('should return PENDING for non-converted status', () => {
      const record = {
        status: 'registered'
      }
      expect(determineSettlementStatus(record)).toBe(SETTLEMENT_STATUS.PENDING)
    })

    it('should return PENDING when in freeze period', () => {
      const now = new Date()
      const conversionDate = new Date(now)
      conversionDate.setDate(conversionDate.getDate() - 5)

      const record = {
        status: 'converted',
        conversionDate: conversionDate.toISOString()
      }
      expect(determineSettlementStatus(record, now)).toBe(SETTLEMENT_STATUS.PENDING)
    })

    it('should return PROCESSING when freeze period ended but cycle not completed', () => {
      const now = new Date()
      const conversionDate = new Date(now)
      conversionDate.setDate(conversionDate.getDate() - (SETTLEMENT_RULES.FREEZE_DAYS + 5))

      const record = {
        status: 'converted',
        conversionDate: conversionDate.toISOString()
      }
      expect(determineSettlementStatus(record, now)).toBe(SETTLEMENT_STATUS.PROCESSING)
    })

    it('should return SETTLED when full cycle completed', () => {
      const now = new Date()
      const conversionDate = new Date(now)
      conversionDate.setDate(conversionDate.getDate() - (SETTLEMENT_RULES.SETTLEMENT_CYCLE_DAYS + 1))

      const record = {
        status: 'converted',
        conversionDate: conversionDate.toISOString()
      }
      expect(determineSettlementStatus(record, now)).toBe(SETTLEMENT_STATUS.SETTLED)
    })

    it('should fall back to updatedAt when no conversionDate', () => {
      const now = new Date()
      const updatedAt = new Date(now)
      updatedAt.setDate(updatedAt.getDate() - (SETTLEMENT_RULES.SETTLEMENT_CYCLE_DAYS + 1))

      const record = {
        status: 'converted',
        updatedAt: updatedAt.toISOString()
      }
      expect(determineSettlementStatus(record, now)).toBe(SETTLEMENT_STATUS.SETTLED)
    })

    it('should return PENDING for invalid date', () => {
      const record = {
        status: 'converted',
        conversionDate: 'invalid-date'
      }
      expect(determineSettlementStatus(record)).toBe(SETTLEMENT_STATUS.PENDING)
    })
  })

  describe('canSettleNow', () => {
    it('should return true for SETTLED status', () => {
      expect(canSettleNow(SETTLEMENT_STATUS.SETTLED)).toBe(true)
    })

    it('should return false for other statuses', () => {
      expect(canSettleNow(SETTLEMENT_STATUS.PENDING)).toBe(false)
      expect(canSettleNow(SETTLEMENT_STATUS.PROCESSING)).toBe(false)
      expect(canSettleNow(SETTLEMENT_STATUS.FROZEN)).toBe(false)
      expect(canSettleNow(SETTLEMENT_STATUS.REJECTED)).toBe(false)
    })
  })

  describe('isInFreezePeriod', () => {
    it('should return true for PENDING status', () => {
      expect(isInFreezePeriod(SETTLEMENT_STATUS.PENDING)).toBe(true)
    })

    it('should return false for other statuses', () => {
      expect(isInFreezePeriod(SETTLEMENT_STATUS.SETTLED)).toBe(false)
      expect(isInFreezePeriod(SETTLEMENT_STATUS.FROZEN)).toBe(false)
    })
  })

  describe('isProcessing', () => {
    it('should return true for PROCESSING status', () => {
      expect(isProcessing(SETTLEMENT_STATUS.PROCESSING)).toBe(true)
    })

    it('should return false for other statuses', () => {
      expect(isProcessing(SETTLEMENT_STATUS.PENDING)).toBe(false)
      expect(isProcessing(SETTLEMENT_STATUS.SETTLED)).toBe(false)
    })
  })

  describe('hasProblem', () => {
    it('should return true for FROZEN status', () => {
      expect(hasProblem(SETTLEMENT_STATUS.FROZEN)).toBe(true)
    })

    it('should return true for REJECTED status', () => {
      expect(hasProblem(SETTLEMENT_STATUS.REJECTED)).toBe(true)
    })

    it('should return false for normal statuses', () => {
      expect(hasProblem(SETTLEMENT_STATUS.PENDING)).toBe(false)
      expect(hasProblem(SETTLEMENT_STATUS.PROCESSING)).toBe(false)
      expect(hasProblem(SETTLEMENT_STATUS.SETTLED)).toBe(false)
    })
  })

  describe('calculateSettlementTimeline', () => {
    it('should return empty array for null record', () => {
      expect(calculateSettlementTimeline(null)).toEqual([])
    })

    it('should return empty array for record without conversionDate', () => {
      expect(calculateSettlementTimeline({})).toEqual([])
    })

    it('should return 4 base timeline events for valid record', () => {
      const now = new Date('2024-01-20')
      const record = {
        conversionDate: new Date('2024-01-01').toISOString()
      }
      const timeline = calculateSettlementTimeline(record, now)
      expect(timeline.length).toBe(4)
    })

    it('should mark completed events correctly when fully settled', () => {
      const now = new Date('2024-02-15')
      const conversionDate = new Date('2024-01-01')
      const record = {
        conversionDate: conversionDate.toISOString()
      }
      const timeline = calculateSettlementTimeline(record, now)
      expect(timeline[0].completed).toBe(true)
      expect(timeline[1].completed).toBe(true)
      expect(timeline[2].completed).toBe(true)
      expect(timeline[3].completed).toBe(true)
    })

    it('should add problem event when frozen', () => {
      const record = {
        conversionDate: new Date('2024-01-01').toISOString(),
        freezeReason: 'suspicious_activity'
      }
      const timeline = calculateSettlementTimeline(record)
      expect(timeline.length).toBe(5)
      expect(timeline[4].isProblem).toBe(true)
      expect(timeline[4].status).toBe(SETTLEMENT_STATUS.FROZEN)
    })

    it('should add problem event when rejected', () => {
      const record = {
        conversionDate: new Date('2024-01-01').toISOString(),
        rejected: true,
        rejectReason: 'Test rejection'
      }
      const timeline = calculateSettlementTimeline(record)
      expect(timeline.length).toBe(5)
      expect(timeline[4].isProblem).toBe(true)
      expect(timeline[4].status).toBe(SETTLEMENT_STATUS.REJECTED)
    })
  })

  describe('getDaysUntilSettlement', () => {
    it('should return null for null record', () => {
      expect(getDaysUntilSettlement(null)).toBeNull()
    })

    it('should return null for record without conversionDate', () => {
      expect(getDaysUntilSettlement({})).toBeNull()
    })

    it('should return 0 when settlement cycle completed', () => {
      const now = new Date('2024-02-15')
      const record = {
        conversionDate: new Date('2024-01-01').toISOString()
      }
      expect(getDaysUntilSettlement(record, now)).toBe(0)
    })

    it('should return positive days when in cycle', () => {
      const now = new Date('2024-01-10')
      const record = {
        conversionDate: new Date('2024-01-01').toISOString()
      }
      const days = getDaysUntilSettlement(record, now)
      expect(typeof days).toBe('number')
      expect(days).toBeGreaterThan(0)
    })
  })

  describe('getSettlementStatusBadgeClass', () => {
    it('should include base class for all statuses', () => {
      Object.keys(SETTLEMENT_STATUS).forEach(key => {
        const cls = getSettlementStatusBadgeClass(SETTLEMENT_STATUS[key])
        expect(cls).toContain('settlement-badge')
      })
    })

    it('should return unknown class for unknown status', () => {
      expect(getSettlementStatusBadgeClass('unknown')).toContain('unknown')
    })
  })
})
