import { describe, expect, it } from 'vitest'
import {
    CERTIFICATE_TYPE_LABELS,
    CERTIFICATE_TYPES,
    STATUS_LABELS,
    VERIFICATION_STATUS
} from '../../identity-verification/constants.js'

describe('constants', () => {
  describe('VERIFICATION_STATUS', () => {
    it('should have all required status values', () => {
      expect(VERIFICATION_STATUS.NOT_SUBMITTED).toBe('not_submitted')
      expect(VERIFICATION_STATUS.PENDING).toBe('pending')
      expect(VERIFICATION_STATUS.APPROVED).toBe('approved')
      expect(VERIFICATION_STATUS.REJECTED).toBe('rejected')
    })

    it('should have exactly 4 status values', () => {
      expect(Object.keys(VERIFICATION_STATUS)).toHaveLength(4)
    })
  })

  describe('CERTIFICATE_TYPES', () => {
    it('should have all required certificate types', () => {
      expect(CERTIFICATE_TYPES.ID_CARD).toBe('id_card')
      expect(CERTIFICATE_TYPES.PASSPORT).toBe('passport')
      expect(CERTIFICATE_TYPES.HK_MACAU_PASS).toBe('hk_macau_pass')
    })

    it('should have exactly 3 certificate types', () => {
      expect(Object.keys(CERTIFICATE_TYPES)).toHaveLength(3)
    })
  })

  describe('STATUS_LABELS', () => {
    it('should have correct labels for all statuses', () => {
      expect(STATUS_LABELS[VERIFICATION_STATUS.NOT_SUBMITTED]).toBe('未提交')
      expect(STATUS_LABELS[VERIFICATION_STATUS.PENDING]).toBe('审核中')
      expect(STATUS_LABELS[VERIFICATION_STATUS.APPROVED]).toBe('已通过')
      expect(STATUS_LABELS[VERIFICATION_STATUS.REJECTED]).toBe('已失败')
    })
  })

  describe('CERTIFICATE_TYPE_LABELS', () => {
    it('should have correct labels for all certificate types', () => {
      expect(CERTIFICATE_TYPE_LABELS[CERTIFICATE_TYPES.ID_CARD]).toBe('身份证')
      expect(CERTIFICATE_TYPE_LABELS[CERTIFICATE_TYPES.PASSPORT]).toBe('护照')
      expect(CERTIFICATE_TYPE_LABELS[CERTIFICATE_TYPES.HK_MACAU_PASS]).toBe('港澳通行证')
    })
  })
})
