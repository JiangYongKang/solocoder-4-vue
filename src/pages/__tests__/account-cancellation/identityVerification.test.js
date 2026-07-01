import { describe, expect, it } from 'vitest'
import {
    EMAIL_CODE_LENGTH,
    MAX_VERIFICATION_ATTEMPTS,
    SMS_CODE_LENGTH,
    VERIFICATION_ERRORS,
    VERIFICATION_METHOD
} from '../../account-cancellation/constants.js'
import {
    checkAttempts,
    generateVerificationCode,
    getCodeExpirationTime,
    getMaskedEmail,
    getMaskedPhone,
    isCodeExpired,
    performVerificationWithAttempts,
    sendVerificationCodeAsync,
    validateEmailCodeFormat,
    validateFormat,
    validatePasswordFormat,
    validateSmsCodeFormat,
    verifyEmailCode,
    verifyIdentity,
    verifyIdentityAsync,
    verifyPassword,
    verifySmsCode
} from '../../account-cancellation/identityVerification.js'

describe('identityVerification', () => {
  describe('validatePasswordFormat', () => {
    it('should return error for empty password', () => {
      const result = validatePasswordFormat('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.EMPTY_PASSWORD)
    })

    it('should return error for whitespace only password', () => {
      const result = validatePasswordFormat('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.EMPTY_PASSWORD)
    })

    it('should return error for too short password', () => {
      const result = validatePasswordFormat('12345')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should pass for valid password', () => {
      const result = validatePasswordFormat('password123')
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should pass for exactly 6 character password', () => {
      const result = validatePasswordFormat('123456')
      expect(result.valid).toBe(true)
    })
  })

  describe('validateSmsCodeFormat', () => {
    it('should return error for empty code', () => {
      const result = validateSmsCodeFormat('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.EMPTY_CODE)
    })

    it('should return error for whitespace only code', () => {
      const result = validateSmsCodeFormat('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.EMPTY_CODE)
    })

    it('should return error for non-numeric code', () => {
      const result = validateSmsCodeFormat('abcdef')
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.INVALID_CODE)
    })

    it('should return error for wrong length code (too short)', () => {
      const result = validateSmsCodeFormat('12345')
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.INVALID_CODE)
    })

    it('should return error for wrong length code (too long)', () => {
      const result = validateSmsCodeFormat('1234567')
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.INVALID_CODE)
    })

    it('should pass for valid 6-digit code', () => {
      const result = validateSmsCodeFormat('123456')
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })
  })

  describe('validateEmailCodeFormat', () => {
    it('should return error for empty code', () => {
      const result = validateEmailCodeFormat('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.EMPTY_CODE)
    })

    it('should return error for invalid format', () => {
      const result = validateEmailCodeFormat('abc123')
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.INVALID_CODE)
    })

    it('should pass for valid 6-digit code', () => {
      const result = validateEmailCodeFormat('654321')
      expect(result.valid).toBe(true)
    })

    it('should match SMS code length constant', () => {
      expect(SMS_CODE_LENGTH).toBe(6)
      expect(EMAIL_CODE_LENGTH).toBe(6)
    })
  })

  describe('validateFormat', () => {
    it('should validate password correctly', () => {
      const result = validateFormat(VERIFICATION_METHOD.PASSWORD, 'test123')
      expect(result.valid).toBe(true)
    })

    it('should validate SMS code correctly', () => {
      const result = validateFormat(VERIFICATION_METHOD.SMS_CODE, '123456')
      expect(result.valid).toBe(true)
    })

    it('should validate email code correctly', () => {
      const result = validateFormat(VERIFICATION_METHOD.EMAIL_CODE, '654321')
      expect(result.valid).toBe(true)
    })

    it('should return error for unknown method', () => {
      const result = validateFormat('unknown_method', 'test')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('checkAttempts', () => {
    it('should allow when attempts below max', () => {
      const result = checkAttempts(0)
      expect(result.allowed).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should allow when attempts at max - 1', () => {
      const result = checkAttempts(MAX_VERIFICATION_ATTEMPTS - 1)
      expect(result.allowed).toBe(true)
    })

    it('should not allow when attempts reach max', () => {
      const result = checkAttempts(MAX_VERIFICATION_ATTEMPTS)
      expect(result.allowed).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.TOO_MANY_ATTEMPTS)
    })

    it('should not allow when attempts exceed max', () => {
      const result = checkAttempts(MAX_VERIFICATION_ATTEMPTS + 5)
      expect(result.allowed).toBe(false)
    })
  })

  describe('verifyPassword', () => {
    it('should fail for invalid format', () => {
      const result = verifyPassword('')
      expect(result.valid).toBe(false)
    })

    it('should fail for wrong password', () => {
      const result = verifyPassword('wrongpassword')
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.WRONG_PASSWORD)
    })

    it('should pass for correct password', () => {
      const result = verifyPassword('password123')
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })
  })

  describe('verifySmsCode', () => {
    it('should fail for invalid format', () => {
      const result = verifySmsCode('')
      expect(result.valid).toBe(false)
    })

    it('should fail for wrong code', () => {
      const result = verifySmsCode('999999')
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.WRONG_CODE)
    })

    it('should pass for correct default code', () => {
      const result = verifySmsCode('123456')
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should pass with custom expected code', () => {
      const customCode = '654321'
      const result = verifySmsCode('654321', customCode)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should fail when custom code does not match', () => {
      const customCode = '654321'
      const result = verifySmsCode('111111', customCode)
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VERIFICATION_ERRORS.WRONG_CODE)
    })
  })

  describe('verifyEmailCode', () => {
    it('should fail for wrong code', () => {
      const result = verifyEmailCode('000000')
      expect(result.valid).toBe(false)
    })

    it('should pass for correct default code', () => {
      const result = verifyEmailCode('123456')
      expect(result.valid).toBe(true)
    })

    it('should pass with custom expected code', () => {
      const customCode = '987654'
      const result = verifyEmailCode('987654', customCode)
      expect(result.valid).toBe(true)
    })

    it('should fail when custom code does not match', () => {
      const customCode = '987654'
      const result = verifyEmailCode('111111', customCode)
      expect(result.valid).toBe(false)
    })
  })

  describe('verifyIdentity', () => {
    it('should verify password via method', () => {
      const result = verifyIdentity(VERIFICATION_METHOD.PASSWORD, 'password123')
      expect(result.valid).toBe(true)
    })

    it('should verify SMS code via method with default code', () => {
      const result = verifyIdentity(VERIFICATION_METHOD.SMS_CODE, '123456')
      expect(result.valid).toBe(true)
    })

    it('should verify email code via method with default code', () => {
      const result = verifyIdentity(VERIFICATION_METHOD.EMAIL_CODE, '123456')
      expect(result.valid).toBe(true)
    })

    it('should verify SMS code with custom expected code', () => {
      const result = verifyIdentity(VERIFICATION_METHOD.SMS_CODE, '654321', '654321')
      expect(result.valid).toBe(true)
    })

    it('should verify email code with custom expected code', () => {
      const result = verifyIdentity(VERIFICATION_METHOD.EMAIL_CODE, '987654', '987654')
      expect(result.valid).toBe(true)
    })

    it('should fail for unknown method', () => {
      const result = verifyIdentity('unknown', '123456')
      expect(result.valid).toBe(false)
    })
  })

  describe('performVerificationWithAttempts', () => {
    it('should succeed with correct credentials and 0 attempts', () => {
      const result = performVerificationWithAttempts(
        VERIFICATION_METHOD.PASSWORD,
        'password123',
        0
      )
      expect(result.valid).toBe(true)
      expect(result.attempts).toBe(0)
      expect(result.locked).toBe(false)
    })

    it('should increment attempts on failure', () => {
      const result = performVerificationWithAttempts(
        VERIFICATION_METHOD.PASSWORD,
        'wrongpass',
        0
      )
      expect(result.valid).toBe(false)
      expect(result.attempts).toBe(1)
      expect(result.locked).toBe(false)
    })

    it('should lock when attempts reach max - 1 and fail', () => {
      const result = performVerificationWithAttempts(
        VERIFICATION_METHOD.PASSWORD,
        'wrongpass',
        MAX_VERIFICATION_ATTEMPTS - 1
      )
      expect(result.valid).toBe(false)
      expect(result.attempts).toBe(MAX_VERIFICATION_ATTEMPTS)
      expect(result.locked).toBe(true)
    })

    it('should not allow verification when already at max attempts', () => {
      const result = performVerificationWithAttempts(
        VERIFICATION_METHOD.PASSWORD,
        'password123',
        MAX_VERIFICATION_ATTEMPTS
      )
      expect(result.valid).toBe(false)
      expect(result.locked).toBe(true)
      expect(result.error).toBe(VERIFICATION_ERRORS.TOO_MANY_ATTEMPTS)
    })

    it('should work for SMS code verification with default code', () => {
      const result = performVerificationWithAttempts(
        VERIFICATION_METHOD.SMS_CODE,
        '123456',
        2
      )
      expect(result.valid).toBe(true)
      expect(result.attempts).toBe(0)
    })

    it('should work for SMS code with custom expected code', () => {
      const customCode = '111222'
      const result = performVerificationWithAttempts(
        VERIFICATION_METHOD.SMS_CODE,
        '111222',
        0,
        customCode
      )
      expect(result.valid).toBe(true)
      expect(result.attempts).toBe(0)
    })

    it('should work for email code with custom expected code', () => {
      const customCode = '333444'
      const result = performVerificationWithAttempts(
        VERIFICATION_METHOD.EMAIL_CODE,
        '333444',
        1,
        customCode
      )
      expect(result.valid).toBe(true)
      expect(result.attempts).toBe(0)
    })

    it('should fail when custom code does not match', () => {
      const customCode = '111222'
      const result = performVerificationWithAttempts(
        VERIFICATION_METHOD.SMS_CODE,
        '999999',
        0,
        customCode
      )
      expect(result.valid).toBe(false)
      expect(result.attempts).toBe(1)
    })
  })

  describe('sendVerificationCodeAsync', () => {
    it('should generate a 6-digit code', async () => {
      const originalRandom = Math.random
      try {
        Math.random = () => 0.5
        const code = await sendVerificationCodeAsync(VERIFICATION_METHOD.SMS_CODE, '13800138000')
        expect(code).toHaveLength(6)
        expect(/^\d+$/.test(code)).toBe(true)
      } finally {
        Math.random = originalRandom
      }
    })

    it('should throw network error when random fails', async () => {
      const originalRandom = Math.random
      try {
        Math.random = () => 0.05
        await expect(sendVerificationCodeAsync(VERIFICATION_METHOD.SMS_CODE, '13800138000'))
          .rejects
          .toThrow(VERIFICATION_ERRORS.NETWORK_ERROR)
      } finally {
        Math.random = originalRandom
      }
    })
  })

  describe('verifyIdentityAsync', () => {
    it('should succeed with correct credentials', async () => {
      const originalRandom = Math.random
      try {
        Math.random = () => 0.5
        const result = await verifyIdentityAsync(
          VERIFICATION_METHOD.PASSWORD,
          'password123',
          0
        )
        expect(result.valid).toBe(true)
        expect(result.attempts).toBe(0)
        expect(result.locked).toBe(false)
      } finally {
        Math.random = originalRandom
      }
    })

    it('should fail with wrong credentials', async () => {
      const originalRandom = Math.random
      try {
        Math.random = () => 0.5
        const result = await verifyIdentityAsync(
          VERIFICATION_METHOD.PASSWORD,
          'wrongpass',
          0
        )
        expect(result.valid).toBe(false)
        expect(result.attempts).toBe(1)
      } finally {
        Math.random = originalRandom
      }
    })

    it('should throw network error when random fails', async () => {
      const originalRandom = Math.random
      try {
        Math.random = () => 0.05
        await expect(verifyIdentityAsync(
          VERIFICATION_METHOD.PASSWORD,
          'password123',
          0
        )).rejects.toThrow(VERIFICATION_ERRORS.NETWORK_ERROR)
      } finally {
        Math.random = originalRandom
      }
    })

    it('should work with custom expected code', async () => {
      const originalRandom = Math.random
      try {
        Math.random = () => 0.5
        const customCode = '555666'
        const result = await verifyIdentityAsync(
          VERIFICATION_METHOD.SMS_CODE,
          '555666',
          0,
          customCode
        )
        expect(result.valid).toBe(true)
      } finally {
        Math.random = originalRandom
      }
    })
  })

  describe('generateVerificationCode', () => {
    it('should generate code of default length 6', () => {
      const code = generateVerificationCode()
      expect(code).toHaveLength(6)
      expect(/^\d+$/.test(code)).toBe(true)
    })

    it('should generate code of custom length', () => {
      const code = generateVerificationCode(4)
      expect(code).toHaveLength(4)
      expect(/^\d+$/.test(code)).toBe(true)
    })

    it('should generate different codes (randomness check)', () => {
      const originalRandom = Math.random
      try {
        Math.random = () => Math.random()
        const codes = new Set()
        for (let i = 0; i < 20; i++) {
          Math.random = () => i * 0.05
          codes.add(generateVerificationCode())
        }
        expect(codes.size).toBeGreaterThan(1)
      } finally {
        Math.random = originalRandom
      }
    })
  })

  describe('getCodeExpirationTime', () => {
    it('should return a future ISO date', () => {
      const now = new Date()
      const expiration = getCodeExpirationTime(5)
      const expDate = new Date(expiration)
      expect(expDate.getTime()).toBeGreaterThan(now.getTime())
    })

    it('should add correct number of minutes', () => {
      const now = new Date()
      const expiration = getCodeExpirationTime(10)
      const expDate = new Date(expiration)
      const diffMinutes = (expDate.getTime() - now.getTime()) / 60000
      expect(diffMinutes).toBeGreaterThanOrEqual(9.5)
      expect(diffMinutes).toBeLessThanOrEqual(10.5)
    })

    it('should use default 5 minutes', () => {
      const now = new Date()
      const expiration = getCodeExpirationTime()
      const expDate = new Date(expiration)
      const diffMinutes = (expDate.getTime() - now.getTime()) / 60000
      expect(diffMinutes).toBeGreaterThanOrEqual(4.5)
      expect(diffMinutes).toBeLessThanOrEqual(5.5)
    })
  })

  describe('isCodeExpired', () => {
    it('should return false when not expired', () => {
      const future = new Date(new Date().getTime() + 5 * 60000).toISOString()
      const result = isCodeExpired(future)
      expect(result).toBe(false)
    })

    it('should return true when expired', () => {
      const past = new Date(new Date().getTime() - 5 * 60000).toISOString()
      const result = isCodeExpired(past)
      expect(result).toBe(true)
    })

    it('should return true at exact expiration time', () => {
      const now = new Date().toISOString()
      const result = isCodeExpired(now, now)
      expect(result).toBe(true)
    })

    it('should return true for invalid expiration time', () => {
      const result = isCodeExpired('invalid')
      expect(result).toBe(true)
    })

    it('should return true for invalid current time', () => {
      const future = new Date(new Date().getTime() + 5 * 60000).toISOString()
      const result = isCodeExpired(future, 'invalid')
      expect(result).toBe(true)
    })
  })

  describe('getMaskedPhone', () => {
    it('should mask valid 11-digit phone correctly', () => {
      const result = getMaskedPhone('13800138000')
      expect(result).toBe('138****8000')
    })

    it('should mask 10-digit phone', () => {
      const result = getMaskedPhone('1380013800')
      expect(result).toBe('138****3800')
    })

    it('should return original for very short phone', () => {
      const result = getMaskedPhone('12345')
      expect(result).toBe('12345')
    })

    it('should return empty string for empty input', () => {
      const result = getMaskedPhone('')
      expect(result).toBe('')
    })
  })

  describe('getMaskedEmail', () => {
    it('should mask long username email correctly', () => {
      const result = getMaskedEmail('username@example.com')
      expect(result).toBe('u***e@example.com')
      expect(result.endsWith('@example.com')).toBe(true)
    })

    it('should mask short username (2 chars) email', () => {
      const result = getMaskedEmail('ab@example.com')
      expect(result).toBe('ab***@example.com')
    })

    it('should return original for non-email format', () => {
      const result = getMaskedEmail('notanemail')
      expect(result).toBe('notanemail')
    })

    it('should return empty string for empty input', () => {
      const result = getMaskedEmail('')
      expect(result).toBe('')
    })
  })
})
