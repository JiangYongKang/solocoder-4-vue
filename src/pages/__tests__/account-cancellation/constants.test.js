import { describe, expect, it } from 'vitest'
import {
    CANCELLATION_STATUS,
    COOLING_PERIOD_DAYS,
    DATA_CLEAR_SCOPE,
    DATA_CLEAR_SCOPE_LABELS,
    DATA_IMPACT_CATEGORIES,
    EMAIL_CODE_LENGTH,
    MAX_VERIFICATION_ATTEMPTS,
    PASSWORD_MIN_LENGTH,
    SMS_CODE_LENGTH,
    STATUS_LABELS,
    VERIFICATION_ERRORS,
    VERIFICATION_METHOD,
    VERIFICATION_METHOD_LABELS
} from '../../account-cancellation/constants.js'

describe('constants', () => {
  describe('CANCELLATION_STATUS', () => {
    it('should have all required status values', () => {
      expect(CANCELLATION_STATUS.NOT_APPLIED).toBe('not_applied')
      expect(CANCELLATION_STATUS.COOLING_PERIOD).toBe('cooling_period')
      expect(CANCELLATION_STATUS.REVOKED).toBe('revoked')
      expect(CANCELLATION_STATUS.COMPLETED).toBe('completed')
    })

    it('should have exactly 4 status values', () => {
      expect(Object.keys(CANCELLATION_STATUS)).toHaveLength(4)
    })
  })

  describe('VERIFICATION_METHOD', () => {
    it('should have all required verification methods', () => {
      expect(VERIFICATION_METHOD.PASSWORD).toBe('password')
      expect(VERIFICATION_METHOD.SMS_CODE).toBe('sms_code')
      expect(VERIFICATION_METHOD.EMAIL_CODE).toBe('email_code')
    })

    it('should have exactly 3 verification methods', () => {
      expect(Object.keys(VERIFICATION_METHOD)).toHaveLength(3)
    })
  })

  describe('DATA_CLEAR_SCOPE', () => {
    it('should have all required scope values', () => {
      expect(DATA_CLEAR_SCOPE.IMMEDIATE).toBe('immediate')
      expect(DATA_CLEAR_SCOPE.COOLING_PERIOD_END).toBe('cooling_period_end')
      expect(DATA_CLEAR_SCOPE.RETAINED).toBe('retained')
    })

    it('should have exactly 3 scope values', () => {
      expect(Object.keys(DATA_CLEAR_SCOPE)).toHaveLength(3)
    })
  })

  describe('STATUS_LABELS', () => {
    it('should have correct labels for all statuses', () => {
      expect(STATUS_LABELS[CANCELLATION_STATUS.NOT_APPLIED]).toBe('未申请')
      expect(STATUS_LABELS[CANCELLATION_STATUS.COOLING_PERIOD]).toBe('冷静期中')
      expect(STATUS_LABELS[CANCELLATION_STATUS.REVOKED]).toBe('已撤销')
      expect(STATUS_LABELS[CANCELLATION_STATUS.COMPLETED]).toBe('已完成')
    })
  })

  describe('VERIFICATION_METHOD_LABELS', () => {
    it('should have correct labels for all verification methods', () => {
      expect(VERIFICATION_METHOD_LABELS[VERIFICATION_METHOD.PASSWORD]).toBe('账号密码')
      expect(VERIFICATION_METHOD_LABELS[VERIFICATION_METHOD.SMS_CODE]).toBe('手机验证码')
      expect(VERIFICATION_METHOD_LABELS[VERIFICATION_METHOD.EMAIL_CODE]).toBe('邮箱验证码')
    })
  })

  describe('DATA_CLEAR_SCOPE_LABELS', () => {
    it('should have correct labels for all scopes', () => {
      expect(DATA_CLEAR_SCOPE_LABELS[DATA_CLEAR_SCOPE.IMMEDIATE]).toBe('申请提交后立即清除')
      expect(DATA_CLEAR_SCOPE_LABELS[DATA_CLEAR_SCOPE.COOLING_PERIOD_END]).toBe('冷静期结束后清除')
      expect(DATA_CLEAR_SCOPE_LABELS[DATA_CLEAR_SCOPE.RETAINED]).toBe('依法依规保留')
    })
  })

  describe('DATA_IMPACT_CATEGORIES', () => {
    it('should have all required categories', () => {
      expect(DATA_IMPACT_CATEGORIES.PERSONAL_DATA).toBe('personal_data')
      expect(DATA_IMPACT_CATEGORIES.ORDER_DATA).toBe('order_data')
      expect(DATA_IMPACT_CATEGORIES.ASSET_DATA).toBe('asset_data')
      expect(DATA_IMPACT_CATEGORIES.PRIVILEGE_DATA).toBe('privilege_data')
      expect(DATA_IMPACT_CATEGORIES.SOCIAL_DATA).toBe('social_data')
    })

    it('should have exactly 5 categories', () => {
      expect(Object.keys(DATA_IMPACT_CATEGORIES)).toHaveLength(5)
    })
  })

  describe('VERIFICATION_ERRORS', () => {
    it('should have all required error messages', () => {
      expect(VERIFICATION_ERRORS.EMPTY_PASSWORD).toBe('请输入登录密码')
      expect(VERIFICATION_ERRORS.WRONG_PASSWORD).toBe('密码错误，请重试')
      expect(VERIFICATION_ERRORS.EMPTY_CODE).toBe('请输入验证码')
      expect(VERIFICATION_ERRORS.INVALID_CODE).toBe('验证码格式不正确')
      expect(VERIFICATION_ERRORS.WRONG_CODE).toBe('验证码错误或已过期')
      expect(VERIFICATION_ERRORS.TOO_MANY_ATTEMPTS).toBe('验证失败次数过多，请稍后再试')
      expect(VERIFICATION_ERRORS.NETWORK_ERROR).toBe('网络错误，请稍后重试')
    })
  })

  describe('numeric constants', () => {
    it('should have correct cooling period days', () => {
      expect(COOLING_PERIOD_DAYS).toBe(7)
    })

    it('should have correct max verification attempts', () => {
      expect(MAX_VERIFICATION_ATTEMPTS).toBe(5)
    })

    it('should have correct code lengths', () => {
      expect(SMS_CODE_LENGTH).toBe(6)
      expect(EMAIL_CODE_LENGTH).toBe(6)
    })

    it('should have correct password min length', () => {
      expect(PASSWORD_MIN_LENGTH).toBe(6)
    })
  })
})
