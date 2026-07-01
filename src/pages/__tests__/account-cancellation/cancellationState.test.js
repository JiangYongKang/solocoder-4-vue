import { describe, it, expect } from 'vitest'
import {
  CANCELLATION_STATUS,
  COOLING_PERIOD_DAYS
} from '../../account-cancellation/constants.js'
import {
  canTransition,
  getNextPossibleTransitions,
  transitionStatus,
  submitCancellation,
  revokeCancellation,
  completeCancellation,
  canSubmitCancellation,
  canRevokeCancellation,
  canViewProgress,
  isTerminalStatus,
  getStatusDescription,
  getStatusIcon,
  getStatusColor,
  computeActualStatus,
  getCancellationSummary,
  getRevokeReasons,
  canReapplyAfterRevoke
} from '../../account-cancellation/cancellationState.js'

const NOT_APPLIED = CANCELLATION_STATUS.NOT_APPLIED
const COOLING_PERIOD = CANCELLATION_STATUS.COOLING_PERIOD
const REVOKED = CANCELLATION_STATUS.REVOKED
const COMPLETED = CANCELLATION_STATUS.COMPLETED

describe('cancellationState', () => {
  describe('canTransition', () => {
    it('should allow transition from NOT_APPLIED to COOLING_PERIOD', () => {
      expect(canTransition(NOT_APPLIED, COOLING_PERIOD)).toBe(true)
    })

    it('should allow transition from COOLING_PERIOD to REVOKED', () => {
      expect(canTransition(COOLING_PERIOD, REVOKED)).toBe(true)
    })

    it('should allow transition from COOLING_PERIOD to COMPLETED', () => {
      expect(canTransition(COOLING_PERIOD, COMPLETED)).toBe(true)
    })

    it('should allow transition from REVOKED to COOLING_PERIOD', () => {
      expect(canTransition(REVOKED, COOLING_PERIOD)).toBe(true)
    })

    it('should not allow transition from NOT_APPLIED to REVOKED', () => {
      expect(canTransition(NOT_APPLIED, REVOKED)).toBe(false)
    })

    it('should not allow transition from NOT_APPLIED to COMPLETED', () => {
      expect(canTransition(NOT_APPLIED, COMPLETED)).toBe(false)
    })

    it('should not allow transition from COMPLETED to any other state', () => {
      expect(canTransition(COMPLETED, NOT_APPLIED)).toBe(false)
      expect(canTransition(COMPLETED, COOLING_PERIOD)).toBe(false)
      expect(canTransition(COMPLETED, REVOKED)).toBe(false)
    })

    it('should not allow transition from REVOKED to COMPLETED directly', () => {
      expect(canTransition(REVOKED, COMPLETED)).toBe(false)
    })
  })

  describe('getNextPossibleTransitions', () => {
    it('should return COOLING_PERIOD for NOT_APPLIED', () => {
      expect(getNextPossibleTransitions(NOT_APPLIED)).toEqual([COOLING_PERIOD])
    })

    it('should return REVOKED and COMPLETED for COOLING_PERIOD', () => {
      const transitions = getNextPossibleTransitions(COOLING_PERIOD)
      expect(transitions).toContain(REVOKED)
      expect(transitions).toContain(COMPLETED)
      expect(transitions).toHaveLength(2)
    })

    it('should return COOLING_PERIOD for REVOKED', () => {
      expect(getNextPossibleTransitions(REVOKED)).toEqual([COOLING_PERIOD])
    })

    it('should return empty array for COMPLETED', () => {
      expect(getNextPossibleTransitions(COMPLETED)).toEqual([])
    })

    it('should return empty array for invalid status', () => {
      expect(getNextPossibleTransitions('invalid_status')).toEqual([])
    })
  })

  describe('transitionStatus', () => {
    it('should transition successfully when valid', () => {
      const result = transitionStatus(NOT_APPLIED, COOLING_PERIOD, { some: 'data' })
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(COOLING_PERIOD)
      expect(result.error).toBeNull()
      expect(result.some).toBe('data')
    })

    it('should fail transition when invalid', () => {
      const result = transitionStatus(NOT_APPLIED, COMPLETED)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(NOT_APPLIED)
      expect(result.error).toBeDefined()
      expect(typeof result.error).toBe('string')
    })
  })

  describe('submitCancellation', () => {
    const submittedAt = '2025-01-01T00:00:00.000Z'

    it('should submit from NOT_APPLIED to COOLING_PERIOD when verified', () => {
      const result = submitCancellation(NOT_APPLIED, true, submittedAt)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(COOLING_PERIOD)
      expect(result.submittedAt).toBe(submittedAt)
      expect(result.coolingEndAt).toBeDefined()
      expect(result.identityVerified).toBe(true)
    })

    it('should submit from REVOKED to COOLING_PERIOD when verified', () => {
      const result = submitCancellation(REVOKED, true, submittedAt)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(COOLING_PERIOD)
    })

    it('should fail when identity not verified', () => {
      const result = submitCancellation(NOT_APPLIED, false, submittedAt)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(NOT_APPLIED)
      expect(result.error).toBe('请先完成身份验证')
    })

    it('should fail from COOLING_PERIOD state', () => {
      const result = submitCancellation(COOLING_PERIOD, true, submittedAt)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(COOLING_PERIOD)
    })

    it('should fail from COMPLETED state', () => {
      const result = submitCancellation(COMPLETED, true, submittedAt)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(COMPLETED)
    })

    it('should calculate cooling end correctly', () => {
      const result = submitCancellation(NOT_APPLIED, true, submittedAt)
      const expectedEnd = new Date(submittedAt)
      expectedEnd.setDate(expectedEnd.getDate() + COOLING_PERIOD_DAYS)
      expect(result.coolingEndAt).toBe(expectedEnd.toISOString())
    })
  })

  describe('revokeCancellation', () => {
    const submittedAt = '2025-01-01T00:00:00.000Z'
    const revokedAt = '2025-01-03T00:00:00.000Z'

    it('should revoke from COOLING_PERIOD to REVOKED', () => {
      const result = revokeCancellation(COOLING_PERIOD, submittedAt, revokedAt)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(REVOKED)
      expect(result.revokedAt).toBe(revokedAt)
      expect(result.originalSubmittedAt).toBe(submittedAt)
    })

    it('should fail from NOT_APPLIED state', () => {
      const result = revokeCancellation(NOT_APPLIED, submittedAt, revokedAt)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(NOT_APPLIED)
      expect(result.error).toBe('仅冷静期中的申请可以撤销')
    })

    it('should fail from REVOKED state', () => {
      const result = revokeCancellation(REVOKED, submittedAt, revokedAt)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(REVOKED)
    })

    it('should fail from COMPLETED state', () => {
      const result = revokeCancellation(COMPLETED, submittedAt, revokedAt)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(COMPLETED)
    })
  })

  describe('completeCancellation', () => {
    const submittedAt = '2025-01-01T00:00:00.000Z'
    const lateCompletedAt = '2025-01-10T00:00:00.000Z'

    it('should complete from COOLING_PERIOD after cooling ends', () => {
      const result = completeCancellation(COOLING_PERIOD, submittedAt, lateCompletedAt)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(COMPLETED)
      expect(result.completedAt).toBe(lateCompletedAt)
      expect(result.originalSubmittedAt).toBe(submittedAt)
    })

    it('should fail when completed before cooling ends', () => {
      const earlyTime = '2025-01-03T00:00:00.000Z'
      const result = completeCancellation(COOLING_PERIOD, submittedAt, earlyTime)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(COOLING_PERIOD)
      expect(result.error).toBeDefined()
    })

    it('should fail from NOT_APPLIED state', () => {
      const result = completeCancellation(NOT_APPLIED, submittedAt, lateCompletedAt)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(NOT_APPLIED)
    })
  })

  describe('canSubmitCancellation', () => {
    it('should return true for NOT_APPLIED', () => {
      expect(canSubmitCancellation(NOT_APPLIED)).toBe(true)
    })

    it('should return true for REVOKED', () => {
      expect(canSubmitCancellation(REVOKED)).toBe(true)
    })

    it('should return false for COOLING_PERIOD', () => {
      expect(canSubmitCancellation(COOLING_PERIOD)).toBe(false)
    })

    it('should return false for COMPLETED', () => {
      expect(canSubmitCancellation(COMPLETED)).toBe(false)
    })
  })

  describe('canRevokeCancellation', () => {
    it('should return true for COOLING_PERIOD', () => {
      expect(canRevokeCancellation(COOLING_PERIOD)).toBe(true)
    })

    it('should return false for other states', () => {
      expect(canRevokeCancellation(NOT_APPLIED)).toBe(false)
      expect(canRevokeCancellation(REVOKED)).toBe(false)
      expect(canRevokeCancellation(COMPLETED)).toBe(false)
    })
  })

  describe('canViewProgress', () => {
    it('should return true for COOLING_PERIOD', () => {
      expect(canViewProgress(COOLING_PERIOD)).toBe(true)
    })

    it('should return true for REVOKED', () => {
      expect(canViewProgress(REVOKED)).toBe(true)
    })

    it('should return true for COMPLETED', () => {
      expect(canViewProgress(COMPLETED)).toBe(true)
    })

    it('should return false for NOT_APPLIED', () => {
      expect(canViewProgress(NOT_APPLIED)).toBe(false)
    })
  })

  describe('isTerminalStatus', () => {
    it('should return true for COMPLETED', () => {
      expect(isTerminalStatus(COMPLETED)).toBe(true)
    })

    it('should return false for other states', () => {
      expect(isTerminalStatus(NOT_APPLIED)).toBe(false)
      expect(isTerminalStatus(COOLING_PERIOD)).toBe(false)
      expect(isTerminalStatus(REVOKED)).toBe(false)
    })
  })

  describe('getStatusDescription', () => {
    it('should return correct description for NOT_APPLIED', () => {
      const desc = getStatusDescription(NOT_APPLIED)
      expect(typeof desc).toBe('string')
      expect(desc.length).toBeGreaterThan(0)
    })

    it('should return correct description for COOLING_PERIOD', () => {
      const desc = getStatusDescription(COOLING_PERIOD)
      expect(desc).toContain(String(COOLING_PERIOD_DAYS))
    })

    it('should return correct description for REVOKED', () => {
      const desc = getStatusDescription(REVOKED)
      expect(typeof desc).toBe('string')
      expect(desc.length).toBeGreaterThan(0)
    })

    it('should return correct description for COMPLETED', () => {
      const desc = getStatusDescription(COMPLETED)
      expect(typeof desc).toBe('string')
      expect(desc.length).toBeGreaterThan(0)
    })

    it('should return empty string for invalid status', () => {
      expect(getStatusDescription('invalid')).toBe('')
    })
  })

  describe('getStatusIcon', () => {
    it('should return icon for each status', () => {
      expect(getStatusIcon(NOT_APPLIED)).toBeDefined()
      expect(getStatusIcon(COOLING_PERIOD)).toBeDefined()
      expect(getStatusIcon(REVOKED)).toBeDefined()
      expect(getStatusIcon(COMPLETED)).toBeDefined()
    })

    it('should return default icon for invalid status', () => {
      const icon = getStatusIcon('invalid')
      expect(typeof icon).toBe('string')
      expect(icon.length).toBeGreaterThan(0)
    })
  })

  describe('getStatusColor', () => {
    it('should return valid hex color for each status', () => {
      const hexPattern = /^#[0-9a-fA-F]{6}$/
      expect(hexPattern.test(getStatusColor(NOT_APPLIED))).toBe(true)
      expect(hexPattern.test(getStatusColor(COOLING_PERIOD))).toBe(true)
      expect(hexPattern.test(getStatusColor(REVOKED))).toBe(true)
      expect(hexPattern.test(getStatusColor(COMPLETED))).toBe(true)
    })

    it('should return default color for invalid status', () => {
      const hexPattern = /^#[0-9a-fA-F]{6}$/
      expect(hexPattern.test(getStatusColor('invalid'))).toBe(true)
    })
  })

  describe('computeActualStatus', () => {
    const submittedAt = '2025-01-01T00:00:00.000Z'

    it('should return NOT_APPLIED when no submission', () => {
      const result = computeActualStatus(null, null)
      expect(result).toBe(NOT_APPLIED)
    })

    it('should return REVOKED when revokedAt exists', () => {
      const result = computeActualStatus(submittedAt, '2025-01-02T00:00:00.000Z')
      expect(result).toBe(REVOKED)
    })

    it('should return COOLING_PERIOD during cooling period', () => {
      const current = '2025-01-03T00:00:00.000Z'
      const result = computeActualStatus(submittedAt, null, current)
      expect(result).toBe(COOLING_PERIOD)
    })

    it('should return COMPLETED after cooling period', () => {
      const current = '2025-01-10T00:00:00.000Z'
      const result = computeActualStatus(submittedAt, null, current)
      expect(result).toBe(COMPLETED)
    })
  })

  describe('getCancellationSummary', () => {
    const submittedAt = '2025-01-01T00:00:00.000Z'

    it('should return summary with NOT_APPLIED status', () => {
      const result = getCancellationSummary(null, null, null)
      expect(result.status).toBe(NOT_APPLIED)
      expect(Array.isArray(result.events)).toBe(true)
      expect(result.events).toHaveLength(0)
    })

    it('should return summary with submit event', () => {
      const result = getCancellationSummary(submittedAt, null, null)
      expect(result.events.length).toBeGreaterThan(0)
      const submitEvent = result.events.find(e => e.type === 'submit')
      expect(submitEvent).toBeDefined()
      expect(submitEvent.time).toBe(submittedAt)
    })

    it('should return summary with revoke event', () => {
      const revokedAt = '2025-01-02T00:00:00.000Z'
      const result = getCancellationSummary(submittedAt, revokedAt, null)
      expect(result.status).toBe(REVOKED)
      const revokeEvent = result.events.find(e => e.type === 'revoke')
      expect(revokeEvent).toBeDefined()
    })

    it('should include coolingEndAt when submitted', () => {
      const result = getCancellationSummary(submittedAt, null, null)
      expect(result.coolingEndAt).toBeDefined()
    })
  })

  describe('getRevokeReasons', () => {
    it('should return array of reasons', () => {
      const reasons = getRevokeReasons()
      expect(Array.isArray(reasons)).toBe(true)
      expect(reasons.length).toBeGreaterThan(0)
    })

    it('should have id and label for each reason', () => {
      const reasons = getRevokeReasons()
      for (const reason of reasons) {
        expect(reason.id).toBeDefined()
        expect(reason.label).toBeDefined()
      }
    })
  })

  describe('canReapplyAfterRevoke', () => {
    it('should allow reapply when no revoke time', () => {
      const result = canReapplyAfterRevoke(null)
      expect(result.allowed).toBe(true)
      expect(result.remainingSeconds).toBe(0)
    })

    it('should allow reapply when cooldown is 0', () => {
      const revokedAt = '2025-01-01T00:00:00.000Z'
      const current = '2025-01-01T00:00:01.000Z'
      const result = canReapplyAfterRevoke(revokedAt, 0, current)
      expect(result.allowed).toBe(true)
    })

    it('should not allow reapply during cooldown', () => {
      const revokedAt = '2025-01-01T00:00:00.000Z'
      const current = '2025-01-01T00:30:00.000Z'
      const result = canReapplyAfterRevoke(revokedAt, 2, current)
      expect(result.allowed).toBe(false)
      expect(result.remainingSeconds).toBeGreaterThan(0)
    })

    it('should allow reapply after cooldown', () => {
      const revokedAt = '2025-01-01T00:00:00.000Z'
      const current = '2025-01-01T03:00:00.000Z'
      const result = canReapplyAfterRevoke(revokedAt, 2, current)
      expect(result.allowed).toBe(true)
      expect(result.remainingSeconds).toBe(0)
    })

    it('should handle invalid dates gracefully', () => {
      const result = canReapplyAfterRevoke('invalid', 2)
      expect(result.allowed).toBe(true)
    })
  })
})
