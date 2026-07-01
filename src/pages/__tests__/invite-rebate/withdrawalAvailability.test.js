import { describe, it, expect } from 'vitest'
import {
  getWithdrawalStatusLabel,
  checkWithdrawalAvailability,
  calculateWithdrawalFee,
  calculateActualReceive,
  getWithdrawalMethods,
  validateWithdrawalRequest,
  estimateWithdrawalTiming
} from '../../invite-rebate/withdrawalAvailability.js'
import {
  WITHDRAWAL_STATUS,
  WITHDRAWAL_STATUS_LABELS,
  SETTLEMENT_RULES
} from '../../invite-rebate/constants.js'

describe('withdrawalAvailability', () => {
  describe('getWithdrawalStatusLabel', () => {
    it('should return correct label for all statuses', () => {
      Object.keys(WITHDRAWAL_STATUS).forEach(key => {
        const status = WITHDRAWAL_STATUS[key]
        expect(getWithdrawalStatusLabel(status)).toBe(WITHDRAWAL_STATUS_LABELS[status])
      })
    })

    it('should return default for unknown status', () => {
      expect(getWithdrawalStatusLabel('unknown')).toBe('状态未知')
    })
  })

  describe('checkWithdrawalAvailability', () => {
    it('should return available when all conditions met', () => {
      const result = checkWithdrawalAvailability({
        availableBalance: 500,
        isIdentityVerified: true,
        isAccountRestricted: false
      })
      expect(result.available).toBe(true)
      expect(result.status).toBe(WITHDRAWAL_STATUS.AVAILABLE)
      expect(result.maxWithdrawalAmount).toBe(500)
    })

    it('should return MAINTENANCE during system maintenance', () => {
      const result = checkWithdrawalAvailability({
        availableBalance: 500,
        isIdentityVerified: true,
        isSystemMaintenance: true
      })
      expect(result.available).toBe(false)
      expect(result.status).toBe(WITHDRAWAL_STATUS.MAINTENANCE)
      expect(result.reason.length).toBeGreaterThan(0)
      expect(result.suggestion.length).toBeGreaterThan(0)
    })

    it('should return ACCOUNT_RESTRICTED when account restricted', () => {
      const result = checkWithdrawalAvailability({
        availableBalance: 500,
        isIdentityVerified: true,
        isAccountRestricted: true
      })
      expect(result.available).toBe(false)
      expect(result.status).toBe(WITHDRAWAL_STATUS.ACCOUNT_RESTRICTED)
    })

    it('should return IDENTITY_NOT_VERIFIED without verification', () => {
      const result = checkWithdrawalAvailability({
        availableBalance: 500,
        isIdentityVerified: false
      })
      expect(result.available).toBe(false)
      expect(result.status).toBe(WITHDRAWAL_STATUS.IDENTITY_NOT_VERIFIED)
    })

    it('should return MIN_AMOUNT_NOT_MET when balance below minimum', () => {
      const result = checkWithdrawalAvailability({
        availableBalance: 50,
        isIdentityVerified: true,
        minAmount: 100
      })
      expect(result.available).toBe(false)
      expect(result.status).toBe(WITHDRAWAL_STATUS.MIN_AMOUNT_NOT_MET)
      expect(result.shortfall).toBe(50)
    })

    it('should return MIN_AMOUNT_NOT_MET when requested amount below minimum', () => {
      const result = checkWithdrawalAvailability({
        availableBalance: 500,
        isIdentityVerified: true,
        requestedAmount: 50,
        minAmount: 100
      })
      expect(result.available).toBe(false)
      expect(result.status).toBe(WITHDRAWAL_STATUS.MIN_AMOUNT_NOT_MET)
    })

    it('should return MAX_AMOUNT_EXCEEDED when requested amount exceeds max', () => {
      const result = checkWithdrawalAvailability({
        availableBalance: 100000,
        isIdentityVerified: true,
        requestedAmount: 80000,
        maxAmount: 50000
      })
      expect(result.available).toBe(false)
      expect(result.status).toBe(WITHDRAWAL_STATUS.MAX_AMOUNT_EXCEEDED)
      expect(result.excess).toBe(30000)
    })

    it('should return INSUFFICIENT_BALANCE when requested exceeds balance', () => {
      const result = checkWithdrawalAvailability({
        availableBalance: 500,
        isIdentityVerified: true,
        requestedAmount: 600
      })
      expect(result.available).toBe(false)
      expect(result.status).toBe(WITHDRAWAL_STATUS.INSUFFICIENT_BALANCE)
      expect(result.shortfall).toBe(100)
    })

    it('should correctly distinguish three distinct amount failure modes', () => {
      const minResult = checkWithdrawalAvailability({
        availableBalance: 50,
        isIdentityVerified: true,
        requestedAmount: 50,
        minAmount: 100,
        maxAmount: 50000
      })
      expect(minResult.status).toBe(WITHDRAWAL_STATUS.MIN_AMOUNT_NOT_MET)

      const maxResult = checkWithdrawalAvailability({
        availableBalance: 60000,
        isIdentityVerified: true,
        requestedAmount: 60000,
        minAmount: 100,
        maxAmount: 50000
      })
      expect(maxResult.status).toBe(WITHDRAWAL_STATUS.MAX_AMOUNT_EXCEEDED)

      const balResult = checkWithdrawalAvailability({
        availableBalance: 200,
        isIdentityVerified: true,
        requestedAmount: 300,
        minAmount: 100,
        maxAmount: 50000
      })
      expect(balResult.status).toBe(WITHDRAWAL_STATUS.INSUFFICIENT_BALANCE)

      expect(minResult.status).not.toBe(maxResult.status)
      expect(maxResult.status).not.toBe(balResult.status)
      expect(minResult.status).not.toBe(balResult.status)
    })

    it('should return COOLDOWN_ACTIVE during cooldown period', () => {
      const now = new Date()
      const lastWithdrawal = new Date(now)
      lastWithdrawal.setHours(lastWithdrawal.getHours() - 12)

      const result = checkWithdrawalAvailability({
        availableBalance: 500,
        isIdentityVerified: true,
        lastWithdrawalAt: lastWithdrawal.toISOString(),
        cooldownHours: 24,
        now
      })
      expect(result.available).toBe(false)
      expect(result.status).toBe(WITHDRAWAL_STATUS.COOLDOWN_ACTIVE)
      expect(result.remainingHours).toBeGreaterThan(0)
      expect(result.cooldownEndTime).toBeDefined()
    })

    it('should be available after cooldown period', () => {
      const now = new Date()
      const lastWithdrawal = new Date(now)
      lastWithdrawal.setHours(lastWithdrawal.getHours() - 25)

      const result = checkWithdrawalAvailability({
        availableBalance: 500,
        isIdentityVerified: true,
        lastWithdrawalAt: lastWithdrawal.toISOString(),
        cooldownHours: 24,
        now
      })
      expect(result.available).toBe(true)
    })

    it('should use default values when options not provided', () => {
      const result = checkWithdrawalAvailability()
      expect(result.available).toBe(false)
      expect(result.minAmount).toBe(SETTLEMENT_RULES.MIN_WITHDRAWAL_AMOUNT)
      expect(result.maxAmount).toBe(SETTLEMENT_RULES.MAX_WITHDRAWAL_AMOUNT)
    })

    it('should cap max withdrawal at balance and max amount', () => {
      const result = checkWithdrawalAvailability({
        availableBalance: 1000,
        isIdentityVerified: true
      })
      expect(result.maxWithdrawalAmount).toBe(1000)

      const result2 = checkWithdrawalAvailability({
        availableBalance: 100000,
        isIdentityVerified: true,
        maxAmount: 50000
      })
      expect(result2.maxWithdrawalAmount).toBe(50000)
    })
  })

  describe('calculateWithdrawalFee', () => {
    it('should return 0 for zero or negative amount', () => {
      expect(calculateWithdrawalFee(0)).toBe(0)
      expect(calculateWithdrawalFee(-100)).toBe(0)
      expect(calculateWithdrawalFee(null)).toBe(0)
    })

    it('should apply minimum fee when calculated fee is below min', () => {
      const fee = calculateWithdrawalFee(10, 0.006, 1)
      expect(fee).toBe(1)
    })

    it('should calculate correct percentage fee', () => {
      const fee = calculateWithdrawalFee(1000, 0.006, 1)
      expect(fee).toBe(6)
    })

    it('should round to 2 decimal places', () => {
      const fee = calculateWithdrawalFee(166.67, 0.006, 0.5)
      expect(fee).toBeCloseTo(1.0, 2)
    })

    it('should use default rate and min when not provided', () => {
      const smallFee = calculateWithdrawalFee(10)
      expect(smallFee).toBe(1)
      const bigFee = calculateWithdrawalFee(1000)
      expect(bigFee).toBe(6)
    })
  })

  describe('calculateActualReceive', () => {
    it('should return 0 for zero or negative amount', () => {
      expect(calculateActualReceive(0)).toBe(0)
      expect(calculateActualReceive(-100)).toBe(0)
    })

    it('should correctly calculate amount after fee', () => {
      const receive = calculateActualReceive(1000, 0.006, 1)
      expect(receive).toBe(994)
    })

    it('should apply min fee correctly', () => {
      const receive = calculateActualReceive(10, 0.006, 1)
      expect(receive).toBe(9)
    })

    it('should round to 2 decimal places', () => {
      const receive = calculateActualReceive(33.33)
      expect(typeof receive).toBe('number')
    })
  })

  describe('getWithdrawalMethods', () => {
    it('should return at least 3 methods', () => {
      const methods = getWithdrawalMethods()
      expect(methods.length).toBeGreaterThanOrEqual(3)
    })

    it('should have valid method structure', () => {
      const methods = getWithdrawalMethods()
      methods.forEach(method => {
        expect(method.id).toBeDefined()
        expect(method.name).toBeDefined()
        expect(method.icon).toBeDefined()
        expect(typeof method.feeRate).toBe('number')
        expect(typeof method.minFee).toBe('number')
        expect(method.processingTime).toBeDefined()
        expect(typeof method.enabled).toBe('boolean')
      })
    })

    it('should include common payment methods', () => {
      const methods = getWithdrawalMethods()
      const ids = methods.map(m => m.id)
      expect(ids).toContain('alipay')
      expect(ids).toContain('wechat')
      expect(ids).toContain('bank')
    })

    it('should have all methods enabled by default', () => {
      const methods = getWithdrawalMethods()
      methods.forEach(method => {
        expect(method.enabled).toBe(true)
      })
    })
  })

  describe('validateWithdrawalRequest', () => {
    const baseValidOptions = {
      amount: 500,
      method: 'alipay',
      availableBalance: 1000,
      accountInfo: { alipayAccount: 'test@example.com' }
    }

    it('should pass validation for valid request', () => {
      const result = validateWithdrawalRequest(baseValidOptions)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing amount', () => {
      const result = validateWithdrawalRequest({
        ...baseValidOptions,
        amount: null
      })
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject negative amount', () => {
      const result = validateWithdrawalRequest({
        ...baseValidOptions,
        amount: -100
      })
      expect(result.valid).toBe(false)
    })

    it('should reject NaN amount', () => {
      const result = validateWithdrawalRequest({
        ...baseValidOptions,
        amount: NaN
      })
      expect(result.valid).toBe(false)
    })

    it('should reject amount below minimum', () => {
      const result = validateWithdrawalRequest({
        ...baseValidOptions,
        amount: 50,
        minAmount: 100
      })
      expect(result.valid).toBe(false)
    })

    it('should reject amount above maximum', () => {
      const result = validateWithdrawalRequest({
        ...baseValidOptions,
        amount: 60000,
        maxAmount: 50000
      })
      expect(result.valid).toBe(false)
    })

    it('should reject amount exceeding balance', () => {
      const result = validateWithdrawalRequest({
        ...baseValidOptions,
        amount: 2000
      })
      expect(result.valid).toBe(false)
    })

    it('should reject invalid withdrawal method', () => {
      const result = validateWithdrawalRequest({
        ...baseValidOptions,
        method: 'invalid_method'
      })
      expect(result.valid).toBe(false)
    })

    it('should reject missing account info', () => {
      const result = validateWithdrawalRequest({
        ...baseValidOptions,
        accountInfo: null
      })
      expect(result.valid).toBe(false)
    })

    it('should validate alipay account info', () => {
      const result = validateWithdrawalRequest({
        ...baseValidOptions,
        accountInfo: {}
      })
      expect(result.valid).toBe(false)
    })

    it('should validate wechat account info', () => {
      const result = validateWithdrawalRequest({
        ...baseValidOptions,
        method: 'wechat',
        accountInfo: {}
      })
      expect(result.valid).toBe(false)
    })

    it('should validate bank transfer account info', () => {
      const result = validateWithdrawalRequest({
        ...baseValidOptions,
        method: 'bank',
        accountInfo: { bankName: 'Bank' }
      })
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })

    it('should pass validation for complete bank transfer info', () => {
      const result = validateWithdrawalRequest({
        ...baseValidOptions,
        method: 'bank',
        accountInfo: {
          bankName: '中国工商银行',
          bankAccount: '6222000000000000',
          accountName: '张三'
        }
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('estimateWithdrawalTiming', () => {
    it('should return timing for alipay', () => {
      const timing = estimateWithdrawalTiming('alipay')
      expect(timing.minMinutes).toBe(1)
      expect(timing.maxMinutes).toBe(60)
      expect(timing.label).toBe('实时到账')
    })

    it('should return timing for wechat', () => {
      const timing = estimateWithdrawalTiming('wechat')
      expect(timing.label).toBe('实时到账')
    })

    it('should return timing for bank transfer', () => {
      const timing = estimateWithdrawalTiming('bank')
      expect(timing.minMinutes).toBe(60 * 24)
      expect(timing.maxMinutes).toBe(60 * 24 * 3)
      expect(timing.label).toBe('1-3个工作日')
    })

    it('should return default timing for unknown method', () => {
      const timing = estimateWithdrawalTiming('unknown')
      expect(timing.minMinutes).toBeDefined()
      expect(timing.maxMinutes).toBeDefined()
      expect(timing.label).toBeDefined()
    })
  })
})
