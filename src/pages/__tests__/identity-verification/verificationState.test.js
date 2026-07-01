import { describe, it, expect } from 'vitest'
import { VERIFICATION_STATUS } from '../../identity-verification/constants.js'
import {
  canTransition,
  getNextPossibleTransitions,
  transitionStatus,
  submitForReview,
  approveVerification,
  rejectVerification,
  resubmitForReview,
  generateRandomRejectReason,
  isEditable,
  isViewOnly,
  canResubmit,
  canSubmit,
  getStatusDescription,
  getStatusIcon,
  getStatusColor
} from '../../identity-verification/verificationState.js'

const NOT_SUBMITTED = VERIFICATION_STATUS.NOT_SUBMITTED
const PENDING = VERIFICATION_STATUS.PENDING
const APPROVED = VERIFICATION_STATUS.APPROVED
const REJECTED = VERIFICATION_STATUS.REJECTED

describe('verificationState', () => {
  describe('canTransition', () => {
    it('should allow transition from NOT_SUBMITTED to PENDING', () => {
      expect(canTransition(NOT_SUBMITTED, PENDING)).toBe(true)
    })

    it('should allow transition from PENDING to APPROVED', () => {
      expect(canTransition(PENDING, APPROVED)).toBe(true)
    })

    it('should allow transition from PENDING to REJECTED', () => {
      expect(canTransition(PENDING, REJECTED)).toBe(true)
    })

    it('should allow transition from REJECTED to PENDING', () => {
      expect(canTransition(REJECTED, PENDING)).toBe(true)
    })

    it('should not allow transition from NOT_SUBMITTED to APPROVED', () => {
      expect(canTransition(NOT_SUBMITTED, APPROVED)).toBe(false)
    })

    it('should not allow transition from NOT_SUBMITTED to REJECTED', () => {
      expect(canTransition(NOT_SUBMITTED, REJECTED)).toBe(false)
    })

    it('should not allow transition from APPROVED to any other state', () => {
      expect(canTransition(APPROVED, NOT_SUBMITTED)).toBe(false)
      expect(canTransition(APPROVED, PENDING)).toBe(false)
      expect(canTransition(APPROVED, REJECTED)).toBe(false)
    })

    it('should not allow transition from REJECTED to APPROVED directly', () => {
      expect(canTransition(REJECTED, APPROVED)).toBe(false)
    })
  })

  describe('getNextPossibleTransitions', () => {
    it('should return PENDING for NOT_SUBMITTED', () => {
      expect(getNextPossibleTransitions(NOT_SUBMITTED)).toEqual([PENDING])
    })

    it('should return APPROVED and REJECTED for PENDING', () => {
      const transitions = getNextPossibleTransitions(PENDING)
      expect(transitions).toContain(APPROVED)
      expect(transitions).toContain(REJECTED)
      expect(transitions).toHaveLength(2)
    })

    it('should return empty array for APPROVED', () => {
      expect(getNextPossibleTransitions(APPROVED)).toEqual([])
    })

    it('should return PENDING for REJECTED', () => {
      expect(getNextPossibleTransitions(REJECTED)).toEqual([PENDING])
    })

    it('should return empty array for invalid status', () => {
      expect(getNextPossibleTransitions('invalid')).toEqual([])
    })
  })

  describe('transitionStatus', () => {
    it('should transition successfully when valid', () => {
      const result = transitionStatus(NOT_SUBMITTED, PENDING, { some: 'data' })
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(PENDING)
      expect(result.error).toBeNull()
      expect(result.some).toBe('data')
    })

    it('should fail transition when invalid', () => {
      const result = transitionStatus(NOT_SUBMITTED, APPROVED)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(NOT_SUBMITTED)
      expect(result.error).toBeDefined()
      expect(typeof result.error).toBe('string')
    })
  })

  describe('submitForReview', () => {
    it('should submit from NOT_SUBMITTED to PENDING', () => {
      const result = submitForReview(NOT_SUBMITTED)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(PENDING)
      expect(result.submittedAt).toBeDefined()
    })

    it('should fail to submit from APPROVED', () => {
      const result = submitForReview(APPROVED)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(APPROVED)
    })
  })

  describe('approveVerification', () => {
    it('should approve from PENDING to APPROVED', () => {
      const result = approveVerification(PENDING)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(APPROVED)
      expect(result.approvedAt).toBeDefined()
    })

    it('should fail to approve from NOT_SUBMITTED', () => {
      const result = approveVerification(NOT_SUBMITTED)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(NOT_SUBMITTED)
    })
  })

  describe('rejectVerification', () => {
    it('should reject from PENDING to REJECTED with custom reason', () => {
      const customReason = '照片不清晰'
      const result = rejectVerification(PENDING, customReason)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(REJECTED)
      expect(result.rejectedAt).toBeDefined()
      expect(result.rejectReason).toBe(customReason)
    })

    it('should reject from PENDING to REJECTED with random reason', () => {
      const result = rejectVerification(PENDING)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(REJECTED)
      expect(result.rejectedAt).toBeDefined()
      expect(result.rejectReason).toBeDefined()
      expect(typeof result.rejectReason).toBe('string')
      expect(result.rejectReason.length).toBeGreaterThan(0)
    })

    it('should fail to reject from NOT_SUBMITTED', () => {
      const result = rejectVerification(NOT_SUBMITTED)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(NOT_SUBMITTED)
    })
  })

  describe('resubmitForReview', () => {
    it('should resubmit from REJECTED to PENDING and increment count', () => {
      const result = resubmitForReview(REJECTED, 0)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(PENDING)
      expect(result.resubmittedAt).toBeDefined()
      expect(result.resubmitCount).toBe(1)
    })

    it('should increment resubmit count correctly', () => {
      const result1 = resubmitForReview(REJECTED, 2)
      expect(result1.resubmitCount).toBe(3)

      const result2 = resubmitForReview(REJECTED, 5)
      expect(result2.resubmitCount).toBe(6)
    })

    it('should default resubmit count to 1 when not provided', () => {
      const result = resubmitForReview(REJECTED)
      expect(result.resubmitCount).toBe(1)
    })

    it('should fail to resubmit from NOT_SUBMITTED', () => {
      const result = resubmitForReview(NOT_SUBMITTED)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(NOT_SUBMITTED)
      expect(result.error).toBe('只有已失败状态才能重新提交')
    })

    it('should fail to resubmit from PENDING', () => {
      const result = resubmitForReview(PENDING)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(PENDING)
    })

    it('should fail to resubmit from APPROVED', () => {
      const result = resubmitForReview(APPROVED)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(APPROVED)
    })
  })

  describe('generateRandomRejectReason', () => {
    it('should return a string reason', () => {
      const reason = generateRandomRejectReason()
      expect(typeof reason).toBe('string')
      expect(reason.length).toBeGreaterThan(0)
    })

    it('should return one of the predefined reasons', () => {
      const predefinedReasons = [
        '证件照片模糊，请重新上传清晰的照片',
        '证件信息填写有误，请核对后重新提交',
        '证件类型与上传照片不匹配',
        '证件已过期，请使用有效期内的证件',
        '人脸照片与证件照片不符，请重新拍摄',
        '提交材料不完整，请补充完整后重新提交'
      ]

      const reasons = Array.from({ length: 20 }, () => generateRandomRejectReason())
      for (const reason of reasons) {
        expect(predefinedReasons).toContain(reason)
      }
    })
  })

  describe('isEditable', () => {
    it('should return true for NOT_SUBMITTED', () => {
      expect(isEditable(NOT_SUBMITTED)).toBe(true)
    })

    it('should return true for REJECTED', () => {
      expect(isEditable(REJECTED)).toBe(true)
    })

    it('should return false for PENDING', () => {
      expect(isEditable(PENDING)).toBe(false)
    })

    it('should return false for APPROVED', () => {
      expect(isEditable(APPROVED)).toBe(false)
    })
  })

  describe('isViewOnly', () => {
    it('should return false for NOT_SUBMITTED', () => {
      expect(isViewOnly(NOT_SUBMITTED)).toBe(false)
    })

    it('should return false for REJECTED', () => {
      expect(isViewOnly(REJECTED)).toBe(false)
    })

    it('should return true for PENDING', () => {
      expect(isViewOnly(PENDING)).toBe(true)
    })

    it('should return true for APPROVED', () => {
      expect(isViewOnly(APPROVED)).toBe(true)
    })
  })

  describe('canResubmit', () => {
    it('should return true for REJECTED', () => {
      expect(canResubmit(REJECTED)).toBe(true)
    })

    it('should return false for other states', () => {
      expect(canResubmit(NOT_SUBMITTED)).toBe(false)
      expect(canResubmit(PENDING)).toBe(false)
      expect(canResubmit(APPROVED)).toBe(false)
    })
  })

  describe('canSubmit', () => {
    it('should return true for NOT_SUBMITTED', () => {
      expect(canSubmit(NOT_SUBMITTED)).toBe(true)
    })

    it('should return true for REJECTED', () => {
      expect(canSubmit(REJECTED)).toBe(true)
    })

    it('should return false for PENDING', () => {
      expect(canSubmit(PENDING)).toBe(false)
    })

    it('should return false for APPROVED', () => {
      expect(canSubmit(APPROVED)).toBe(false)
    })
  })

  describe('getStatusDescription', () => {
    it('should return correct description for NOT_SUBMITTED', () => {
      expect(getStatusDescription(NOT_SUBMITTED)).toBe('请上传并填写您的证件信息完成实名认证')
    })

    it('should return correct description for PENDING', () => {
      expect(getStatusDescription(PENDING)).toBe('您的认证申请正在审核中，请耐心等待')
    })

    it('should return correct description for APPROVED', () => {
      expect(getStatusDescription(APPROVED)).toBe('恭喜您，实名认证已通过')
    })

    it('should return correct description for REJECTED', () => {
      expect(getStatusDescription(REJECTED)).toBe('实名认证未通过，请根据失败原因修正后重新提交')
    })

    it('should return empty string for invalid status', () => {
      expect(getStatusDescription('invalid')).toBe('')
    })
  })

  describe('getStatusIcon', () => {
    it('should return correct icon for NOT_SUBMITTED', () => {
      expect(getStatusIcon(NOT_SUBMITTED)).toBe('📝')
    })

    it('should return correct icon for PENDING', () => {
      expect(getStatusIcon(PENDING)).toBe('⏳')
    })

    it('should return correct icon for APPROVED', () => {
      expect(getStatusIcon(APPROVED)).toBe('✅')
    })

    it('should return correct icon for REJECTED', () => {
      expect(getStatusIcon(REJECTED)).toBe('❌')
    })

    it('should return default icon for invalid status', () => {
      expect(getStatusIcon('invalid')).toBe('📄')
    })
  })

  describe('getStatusColor', () => {
    it('should return correct color for NOT_SUBMITTED', () => {
      expect(getStatusColor(NOT_SUBMITTED)).toBe('#6b7280')
    })

    it('should return correct color for PENDING', () => {
      expect(getStatusColor(PENDING)).toBe('#f59e0b')
    })

    it('should return correct color for APPROVED', () => {
      expect(getStatusColor(APPROVED)).toBe('#10b981')
    })

    it('should return correct color for REJECTED', () => {
      expect(getStatusColor(REJECTED)).toBe('#ef4444')
    })

    it('should return default color for invalid status', () => {
      expect(getStatusColor('invalid')).toBe('#6b7280')
    })
  })
})
