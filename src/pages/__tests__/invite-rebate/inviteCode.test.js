import { describe, it, expect } from 'vitest'
import {
  generateInviteCode,
  validateInviteCode,
  normalizeInviteCode,
  generateInviteLink,
  parseInviteLink,
  maskInviteCode,
  formatInviteCode
} from '../../invite-rebate/inviteCode.js'
import { INVITE_CODE, DEFAULT_BASE_URL } from '../../invite-rebate/constants.js'

describe('inviteCode', () => {
  describe('generateInviteCode', () => {
    it('should generate code with correct prefix', () => {
      const code = generateInviteCode(8)
      expect(code.startsWith(INVITE_CODE.PREFIX)).toBe(true)
    })

    it('should generate code within min and max length bounds', () => {
      const code = generateInviteCode(8)
      expect(code.length).toBeGreaterThanOrEqual(INVITE_CODE.MIN_LENGTH)
      expect(code.length).toBeLessThanOrEqual(INVITE_CODE.MAX_LENGTH)
    })

    it('should clamp length to min when too short', () => {
      const code = generateInviteCode(2)
      expect(code.length).toBe(INVITE_CODE.MIN_LENGTH)
    })

    it('should clamp length to max when too long', () => {
      const code = generateInviteCode(20)
      expect(code.length).toBe(INVITE_CODE.MAX_LENGTH)
    })

    it('should use only valid characters from charset', () => {
      const charset = INVITE_CODE.CHARSET
      for (let i = 0; i < 100; i++) {
        const code = generateInviteCode(10)
        const codeWithoutPrefix = code.slice(INVITE_CODE.PREFIX.length)
        for (const char of codeWithoutPrefix) {
          expect(charset).toContain(char)
        }
      }
    })

    it('should generate different codes on successive calls', () => {
      const codes = new Set()
      for (let i = 0; i < 100; i++) {
        codes.add(generateInviteCode(10))
      }
      expect(codes.size).toBeGreaterThan(90)
    })
  })

  describe('validateInviteCode', () => {
    it('should return invalid for null code', () => {
      const result = validateInviteCode(null)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('empty')
    })

    it('should return invalid for undefined code', () => {
      const result = validateInviteCode(undefined)
      expect(result.valid).toBe(false)
    })

    it('should return invalid for empty string', () => {
      const result = validateInviteCode('')
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('empty')
    })

    it('should return invalid for code too short', () => {
      const result = validateInviteCode('AB')
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('too_short')
    })

    it('should return invalid for code too long', () => {
      const result = validateInviteCode('A'.repeat(15))
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('too_long')
    })

    it('should return invalid for code with invalid characters', () => {
      const result = validateInviteCode('INV-123')
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('invalid_chars')
    })

    it('should auto-normalize lowercase letters and accept them', () => {
      const result = validateInviteCode('inv12345')
      expect(result.valid).toBe(true)
      expect(result.normalizedCode).toBe('INV12345')
    })

    it('should return invalid for code without correct prefix', () => {
      const result = validateInviteCode('XYZ12345')
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('invalid_prefix')
    })

    it('should return valid for correct code', () => {
      const result = validateInviteCode('INV12345')
      expect(result.valid).toBe(true)
      expect(result.reason).toBeNull()
      expect(result.normalizedCode).toBe('INV12345')
    })

    it('should normalize lowercase code when trimmed', () => {
      const result = validateInviteCode('  inv12345  ')
      expect(result.valid).toBe(true)
      expect(result.normalizedCode).toBe('INV12345')
    })
  })

  describe('normalizeInviteCode', () => {
    it('should return empty string for null', () => {
      expect(normalizeInviteCode(null)).toBe('')
    })

    it('should return empty string for undefined', () => {
      expect(normalizeInviteCode(undefined)).toBe('')
    })

    it('should trim and uppercase code', () => {
      expect(normalizeInviteCode('  inv12345  ')).toBe('INV12345')
    })

    it('should remove non-alphanumeric characters', () => {
      expect(normalizeInviteCode('INV-123_45')).toBe('INV12345')
    })
  })

  describe('generateInviteLink', () => {
    it('should return null for invalid code', () => {
      const link = generateInviteLink('bad-code')
      expect(link).toBeNull()
    })

    it('should generate link with invite_code query param', () => {
      const link = generateInviteLink('INV12345', DEFAULT_BASE_URL)
      expect(link).toContain(DEFAULT_BASE_URL)
      expect(link).toContain('invite_code=INV12345')
    })

    it('should append additional params', () => {
      const link = generateInviteLink('INV12345', DEFAULT_BASE_URL, {
        utm_source: 'share',
        ref: 'user123'
      })
      expect(link).toContain('utm_source=share')
      expect(link).toContain('ref=user123')
    })

    it('should not append undefined or empty params', () => {
      const link = generateInviteLink('INV12345', DEFAULT_BASE_URL, {
        empty: '',
        nothing: undefined,
        valid: 'value'
      })
      expect(link).not.toContain('empty=')
      expect(link).not.toContain('nothing=')
      expect(link).toContain('valid=value')
    })

    it('should use default base URL when not provided', () => {
      const link = generateInviteLink('INV12345')
      expect(link).toContain(DEFAULT_BASE_URL)
    })
  })

  describe('parseInviteLink', () => {
    it('should return null for null link', () => {
      expect(parseInviteLink(null)).toBeNull()
    })

    it('should return null for undefined link', () => {
      expect(parseInviteLink(undefined)).toBeNull()
    })

    it('should return null for invalid URL', () => {
      expect(parseInviteLink('not a url')).toBeNull()
    })

    it('should return null for URL without invite_code', () => {
      expect(parseInviteLink('https://example.com/page')).toBeNull()
    })

    it('should return null for URL with invalid invite_code', () => {
      expect(parseInviteLink('https://example.com/page?invite_code=bad')).toBeNull()
    })

    it('should correctly parse valid invite link', () => {
      const result = parseInviteLink('https://example.com/invite?invite_code=INV12345')
      expect(result).not.toBeNull()
      expect(result.code).toBe('INV12345')
      expect(result.baseUrl).toBe('https://example.com/invite')
      expect(result.params).toEqual({})
    })

    it('should correctly parse additional params', () => {
      const result = parseInviteLink(
        'https://example.com/invite?invite_code=INV12345&utm_source=share&ref=123'
      )
      expect(result.params.utm_source).toBe('share')
      expect(result.params.ref).toBe('123')
      expect(result.params.invite_code).toBeUndefined()
    })
  })

  describe('maskInviteCode', () => {
    it('should return original for invalid code', () => {
      expect(maskInviteCode('bad')).toBe('bad')
    })

    it('should not mask short codes', () => {
      expect(maskInviteCode('INV123', 3, 2)).toBe('INV123')
    })

    it('should correctly mask code with default params', () => {
      const result = maskInviteCode('INV12345678')
      expect(result).toMatch(/^INV.{4,}..$/)
      expect(result).not.toContain('4567')
      expect(result.startsWith('INV')).toBe(true)
    })

    it('should correctly mask with custom params', () => {
      const result = maskInviteCode('INV12345678', 4, 3)
      expect(result.slice(0, 4)).toBe('INV1')
      expect(result.slice(-3)).toBe('678')
      const middle = result.slice(4, -3)
      expect(middle).toMatch(/^\*+$/)
    })
  })

  describe('formatInviteCode', () => {
    it('should return original for invalid code', () => {
      expect(formatInviteCode('bad')).toBe('bad')
    })

    it('should format with default separator and every 4', () => {
      expect(formatInviteCode('INV12345678')).toBe('INV1-2345-678')
    })

    it('should format with custom separator', () => {
      expect(formatInviteCode('INV12345678', ' ')).toBe('INV1 2345 678')
    })

    it('should format with custom every value', () => {
      expect(formatInviteCode('INV12345678', '-', 3)).toBe('INV-123-456-78')
    })
  })
})
