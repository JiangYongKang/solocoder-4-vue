import { describe, it, expect } from 'vitest'
import {
  getFreezeReasonLabel,
  getFreezeReasonDescription,
  getFreezeReasonSuggestion,
  getFreezeSeverity,
  getSeverityLabel,
  getSeverityColor,
  canAppeal,
  getAppealInstructions,
  getFreezeRecordDetails,
  groupFreezeRecordsBySeverity,
  calculateFreezeSummary,
  FREEZE_REASON_LIST
} from '../../invite-rebate/freezeReason.js'
import {
  FREEZE_REASON,
  FREEZE_REASON_LABELS,
  FREEZE_REASON_DESCRIPTIONS,
  FREEZE_REASON_SUGGESTIONS,
  FREEZE_SEVERITY,
  FREEZE_REASON_SEVERITY
} from '../../invite-rebate/constants.js'

describe('freezeReason', () => {
  describe('getFreezeReasonLabel', () => {
    it('should return correct label for all freeze reasons', () => {
      Object.keys(FREEZE_REASON).forEach(key => {
        const reason = FREEZE_REASON[key]
        expect(getFreezeReasonLabel(reason)).toBe(FREEZE_REASON_LABELS[reason])
      })
    })

    it('should return default for unknown reason', () => {
      expect(getFreezeReasonLabel('unknown')).toBe('未知原因')
    })
  })

  describe('getFreezeReasonDescription', () => {
    it('should return correct description for all freeze reasons', () => {
      Object.keys(FREEZE_REASON).forEach(key => {
        const reason = FREEZE_REASON[key]
        expect(getFreezeReasonDescription(reason)).toBe(FREEZE_REASON_DESCRIPTIONS[reason])
        expect(typeof getFreezeReasonDescription(reason)).toBe('string')
        expect(getFreezeReasonDescription(reason).length).toBeGreaterThan(0)
      })
    })

    it('should return default for unknown reason', () => {
      const desc = getFreezeReasonDescription('unknown')
      expect(typeof desc).toBe('string')
      expect(desc.length).toBeGreaterThan(0)
    })
  })

  describe('getFreezeReasonSuggestion', () => {
    it('should return correct suggestion for all freeze reasons', () => {
      Object.keys(FREEZE_REASON).forEach(key => {
        const reason = FREEZE_REASON[key]
        expect(getFreezeReasonSuggestion(reason)).toBe(FREEZE_REASON_SUGGESTIONS[reason])
        expect(typeof getFreezeReasonSuggestion(reason)).toBe('string')
        expect(getFreezeReasonSuggestion(reason).length).toBeGreaterThan(0)
      })
    })

    it('should return default for unknown reason', () => {
      const suggestion = getFreezeReasonSuggestion('unknown')
      expect(typeof suggestion).toBe('string')
      expect(suggestion.length).toBeGreaterThan(0)
    })
  })

  describe('getFreezeSeverity', () => {
    it('should return correct severity for all freeze reasons', () => {
      Object.keys(FREEZE_REASON).forEach(key => {
        const reason = FREEZE_REASON[key]
        expect(getFreezeSeverity(reason)).toBe(FREEZE_REASON_SEVERITY[reason])
      })
    })

    it('should default to MEDIUM for unknown reason', () => {
      expect(getFreezeSeverity('unknown')).toBe(FREEZE_SEVERITY.MEDIUM)
    })
  })

  describe('getSeverityLabel', () => {
    it('should return correct label for all severities', () => {
      expect(getSeverityLabel(FREEZE_SEVERITY.LOW)).toBe('低风险')
      expect(getSeverityLabel(FREEZE_SEVERITY.MEDIUM)).toBe('中风险')
      expect(getSeverityLabel(FREEZE_SEVERITY.HIGH)).toBe('高风险')
      expect(getSeverityLabel(FREEZE_SEVERITY.CRITICAL)).toBe('严重违规')
    })

    it('should return default for unknown severity', () => {
      expect(getSeverityLabel('unknown')).toBe('未知风险')
    })
  })

  describe('getSeverityColor', () => {
    it('should return valid color strings for all severities', () => {
      const colors = [
        getSeverityColor(FREEZE_SEVERITY.LOW),
        getSeverityColor(FREEZE_SEVERITY.MEDIUM),
        getSeverityColor(FREEZE_SEVERITY.HIGH),
        getSeverityColor(FREEZE_SEVERITY.CRITICAL)
      ]
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
      })
    })

    it('should return default for unknown severity', () => {
      const color = getSeverityColor('unknown')
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })

  describe('canAppeal', () => {
    it('should disallow appeal for SELF_INVITE', () => {
      expect(canAppeal(FREEZE_REASON.SELF_INVITE)).toBe(false)
    })

    it('should disallow appeal for POLICY_VIOLATION', () => {
      expect(canAppeal(FREEZE_REASON.POLICY_VIOLATION)).toBe(false)
    })

    it('should allow appeal for most other reasons', () => {
      expect(canAppeal(FREEZE_REASON.SUSPICIOUS_ACTIVITY)).toBe(true)
      expect(canAppeal(FREEZE_REASON.BOT_ACCOUNT)).toBe(true)
      expect(canAppeal(FREEZE_REASON.DUPLICATE_INVITE)).toBe(true)
      expect(canAppeal(FREEZE_REASON.INVALID_CONVERSION)).toBe(true)
      expect(canAppeal(FREEZE_REASON.RISK_REVIEW)).toBe(true)
      expect(canAppeal(FREEZE_REASON.REFUNDED_ORDER)).toBe(true)
    })
  })

  describe('getAppealInstructions', () => {
    it('should return null for non-appealable reasons', () => {
      expect(getAppealInstructions(FREEZE_REASON.SELF_INVITE)).toBeNull()
      expect(getAppealInstructions(FREEZE_REASON.POLICY_VIOLATION)).toBeNull()
    })

    it('should return array of steps for appealable reasons', () => {
      const appealableReasons = [
        FREEZE_REASON.SUSPICIOUS_ACTIVITY,
        FREEZE_REASON.BOT_ACCOUNT,
        FREEZE_REASON.DUPLICATE_INVITE,
        FREEZE_REASON.INVALID_CONVERSION,
        FREEZE_REASON.RISK_REVIEW,
        FREEZE_REASON.REFUNDED_ORDER
      ]

      appealableReasons.forEach(reason => {
        const instructions = getAppealInstructions(reason)
        expect(instructions).not.toBeNull()
        expect(Array.isArray(instructions)).toBe(true)
        expect(instructions.length).toBeGreaterThan(0)
        instructions.forEach(step => {
          expect(typeof step).toBe('string')
          expect(step.length).toBeGreaterThan(0)
        })
      })
    })

    it('should return default instructions for unknown appealable reason', () => {
      const instructions = getAppealInstructions('some_other_reason')
      expect(Array.isArray(instructions)).toBe(true)
      expect(instructions.length).toBeGreaterThan(0)
    })
  })

  describe('getFreezeRecordDetails', () => {
    it('should return null for record without freezeReason', () => {
      expect(getFreezeRecordDetails({})).toBeNull()
    })

    it('should return null for null record', () => {
      expect(getFreezeRecordDetails(null)).toBeNull()
    })

    it('should return complete details for valid frozen record', () => {
      const record = {
        freezeReason: FREEZE_REASON.REFUNDED_ORDER,
        frozenAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-16T00:00:00Z',
        rewardAmount: 99.9,
        inviteeName: '测试用户',
        inviteePhone: '13800138000'
      }

      const details = getFreezeRecordDetails(record)
      expect(details).not.toBeNull()
      expect(details.reason).toBe(FREEZE_REASON.REFUNDED_ORDER)
      expect(details.label).toBe(FREEZE_REASON_LABELS[FREEZE_REASON.REFUNDED_ORDER])
      expect(details.description).toBe(FREEZE_REASON_DESCRIPTIONS[FREEZE_REASON.REFUNDED_ORDER])
      expect(details.suggestion).toBe(FREEZE_REASON_SUGGESTIONS[FREEZE_REASON.REFUNDED_ORDER])
      expect(details.severity).toBe(FREEZE_REASON_SEVERITY[FREEZE_REASON.REFUNDED_ORDER])
      expect(details.severityLabel).toBeDefined()
      expect(details.severityColor).toBeDefined()
      expect(details.canAppeal).toBe(true)
      expect(details.appealInstructions).not.toBeNull()
      expect(details.frozenAt).toBe(record.frozenAt)
      expect(details.frozenAmount).toBe(record.rewardAmount)
      expect(details.invitee).toBe(record.inviteeName)
    })

    it('should fall back to updatedAt when no frozenAt', () => {
      const record = {
        freezeReason: FREEZE_REASON.SUSPICIOUS_ACTIVITY,
        updatedAt: '2024-01-16T00:00:00Z'
      }
      const details = getFreezeRecordDetails(record)
      expect(details.frozenAt).toBe(record.updatedAt)
    })

    it('should fall back to phone when no invitee name', () => {
      const record = {
        freezeReason: FREEZE_REASON.SUSPICIOUS_ACTIVITY,
        inviteePhone: '13800138000'
      }
      const details = getFreezeRecordDetails(record)
      expect(details.invitee).toBe(record.inviteePhone)
    })
  })

  describe('groupFreezeRecordsBySeverity', () => {
    it('should return empty groups for null records', () => {
      const grouped = groupFreezeRecordsBySeverity(null)
      expect(Object.keys(grouped)).toHaveLength(4)
      Object.values(grouped).forEach(group => {
        expect(Array.isArray(group)).toBe(true)
        expect(group).toHaveLength(0)
      })
    })

    it('should return empty groups for empty array', () => {
      const grouped = groupFreezeRecordsBySeverity([])
      Object.values(grouped).forEach(group => {
        expect(group).toHaveLength(0)
      })
    })

    it('should correctly group records by severity', () => {
      const records = [
        { id: 1, freezeReason: FREEZE_REASON.DUPLICATE_INVITE },
        { id: 2, freezeReason: FREEZE_REASON.SUSPICIOUS_ACTIVITY },
        { id: 3, freezeReason: FREEZE_REASON.SELF_INVITE },
        { id: 4, freezeReason: FREEZE_REASON.POLICY_VIOLATION },
        { id: 5 },
        { id: 6, freezeReason: FREEZE_REASON.REFUNDED_ORDER },
        { id: 7, freezeReason: FREEZE_REASON.INVALID_CONVERSION }
      ]

      const grouped = groupFreezeRecordsBySeverity(records)
      expect(grouped[FREEZE_SEVERITY.LOW]).toHaveLength(3)
      expect(grouped[FREEZE_SEVERITY.MEDIUM]).toHaveLength(1)
      expect(grouped[FREEZE_SEVERITY.HIGH]).toHaveLength(1)
      expect(grouped[FREEZE_SEVERITY.CRITICAL]).toHaveLength(1)
    })
  })

  describe('calculateFreezeSummary', () => {
    it('should return zero summary for null records', () => {
      const summary = calculateFreezeSummary(null)
      expect(summary.totalCount).toBe(0)
      expect(summary.totalAmount).toBe(0)
      expect(summary.appealableCount).toBe(0)
      expect(summary.appealableAmount).toBe(0)
    })

    it('should return zero summary for empty array', () => {
      const summary = calculateFreezeSummary([])
      expect(summary.totalCount).toBe(0)
      expect(summary.totalAmount).toBe(0)
    })

    it('should correctly calculate summary for mixed records', () => {
      const records = [
        { id: 1, freezeReason: FREEZE_REASON.REFUNDED_ORDER, rewardAmount: 50 },
        { id: 2, freezeReason: FREEZE_REASON.SELF_INVITE, rewardAmount: 100 },
        { id: 3, freezeReason: FREEZE_REASON.SUSPICIOUS_ACTIVITY, rewardAmount: 25.5 },
        { id: 4 },
        { id: 5, freezeReason: FREEZE_REASON.POLICY_VIOLATION, rewardAmount: 200 }
      ]

      const summary = calculateFreezeSummary(records)
      expect(summary.totalCount).toBe(4)
      expect(summary.totalAmount).toBe(375.5)
      expect(summary.appealableCount).toBe(2)
      expect(summary.appealableAmount).toBe(75.5)

      expect(summary.bySeverity.low.count).toBe(1)
      expect(summary.bySeverity.low.amount).toBe(50)
      expect(summary.bySeverity.medium.count).toBe(1)
      expect(summary.bySeverity.medium.amount).toBe(25.5)
      expect(summary.bySeverity.high.count).toBe(1)
      expect(summary.bySeverity.high.amount).toBe(100)
      expect(summary.bySeverity.critical.count).toBe(1)
      expect(summary.bySeverity.critical.amount).toBe(200)
    })

    it('should round amounts to 2 decimal places', () => {
      const records = [
        { freezeReason: FREEZE_REASON.REFUNDED_ORDER, rewardAmount: 10.345 }
      ]
      const summary = calculateFreezeSummary(records)
      expect(summary.totalAmount).toBe(10.35)
    })
  })

  describe('FREEZE_REASON_LIST', () => {
    it('should contain all freeze reason values', () => {
      expect(FREEZE_REASON_LIST).toHaveLength(Object.keys(FREEZE_REASON).length)
      Object.values(FREEZE_REASON).forEach(reason => {
        expect(FREEZE_REASON_LIST).toContain(reason)
      })
    })
  })
})
