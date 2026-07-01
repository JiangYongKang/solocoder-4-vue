import { describe, it, expect } from 'vitest'
import {
  AUTH_ROUTES,
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  TOKEN_EXPIRE_KEY,
  TOKEN_DURATION_MS,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  ROUTE_TITLES
} from '../../auth/constants.js'

describe('auth constants', () => {
  describe('AUTH_ROUTES', () => {
    it('should have all required route values', () => {
      expect(AUTH_ROUTES.LOGIN).toBe('login')
      expect(AUTH_ROUTES.REGISTER).toBe('register')
      expect(AUTH_ROUTES.FORGOT_PASSWORD).toBe('forgot_password')
      expect(AUTH_ROUTES.RESET_PASSWORD).toBe('reset_password')
      expect(AUTH_ROUTES.CHANGE_PASSWORD).toBe('change_password')
      expect(AUTH_ROUTES.PROFILE).toBe('profile')
    })

    it('should have exactly 6 route values', () => {
      expect(Object.keys(AUTH_ROUTES)).toHaveLength(6)
    })
  })

  describe('PUBLIC_ROUTES', () => {
    it('should contain public routes', () => {
      expect(PUBLIC_ROUTES).toContain(AUTH_ROUTES.LOGIN)
      expect(PUBLIC_ROUTES).toContain(AUTH_ROUTES.REGISTER)
      expect(PUBLIC_ROUTES).toContain(AUTH_ROUTES.FORGOT_PASSWORD)
      expect(PUBLIC_ROUTES).toContain(AUTH_ROUTES.RESET_PASSWORD)
    })

    it('should not contain protected routes', () => {
      expect(PUBLIC_ROUTES).not.toContain(AUTH_ROUTES.CHANGE_PASSWORD)
      expect(PUBLIC_ROUTES).not.toContain(AUTH_ROUTES.PROFILE)
    })

    it('should have exactly 4 routes', () => {
      expect(PUBLIC_ROUTES).toHaveLength(4)
    })
  })

  describe('PROTECTED_ROUTES', () => {
    it('should contain protected routes', () => {
      expect(PROTECTED_ROUTES).toContain(AUTH_ROUTES.CHANGE_PASSWORD)
      expect(PROTECTED_ROUTES).toContain(AUTH_ROUTES.PROFILE)
    })

    it('should not contain public routes', () => {
      expect(PROTECTED_ROUTES).not.toContain(AUTH_ROUTES.LOGIN)
      expect(PROTECTED_ROUTES).not.toContain(AUTH_ROUTES.REGISTER)
    })

    it('should have exactly 2 routes', () => {
      expect(PROTECTED_ROUTES).toHaveLength(2)
    })
  })

  describe('STORAGE_KEYS', () => {
    it('should have correct token storage key', () => {
      expect(TOKEN_STORAGE_KEY).toBe('auth_token')
    })

    it('should have correct user storage key', () => {
      expect(USER_STORAGE_KEY).toBe('auth_user')
    })

    it('should have correct expire key', () => {
      expect(TOKEN_EXPIRE_KEY).toBe('auth_token_expire')
    })
  })

  describe('TOKEN_DURATION_MS', () => {
    it('should equal 24 hours in milliseconds', () => {
      expect(TOKEN_DURATION_MS).toBe(24 * 60 * 60 * 1000)
      expect(TOKEN_DURATION_MS).toBe(86400000)
    })
  })

  describe('VALIDATION_RULES', () => {
    it('should have correct username min length', () => {
      expect(VALIDATION_RULES.USERNAME_MIN_LENGTH).toBe(3)
    })

    it('should have correct username max length', () => {
      expect(VALIDATION_RULES.USERNAME_MAX_LENGTH).toBe(20)
    })

    it('should have correct password min length', () => {
      expect(VALIDATION_RULES.PASSWORD_MIN_LENGTH).toBe(8)
    })

    it('should have correct password max length', () => {
      expect(VALIDATION_RULES.PASSWORD_MAX_LENGTH).toBe(50)
    })
  })

  describe('ERROR_MESSAGES', () => {
    it('should contain required user validation messages', () => {
      expect(typeof ERROR_MESSAGES.USERNAME_REQUIRED).toBe('string')
      expect(ERROR_MESSAGES.USERNAME_REQUIRED.length).toBeGreaterThan(0)

      expect(typeof ERROR_MESSAGES.USERNAME_TOO_SHORT).toBe('string')
      expect(typeof ERROR_MESSAGES.USERNAME_TOO_LONG).toBe('string')
      expect(typeof ERROR_MESSAGES.USERNAME_INVALID).toBe('string')
    })

    it('should contain required email validation messages', () => {
      expect(typeof ERROR_MESSAGES.EMAIL_REQUIRED).toBe('string')
      expect(ERROR_MESSAGES.EMAIL_REQUIRED.length).toBeGreaterThan(0)
      expect(typeof ERROR_MESSAGES.EMAIL_INVALID).toBe('string')
    })

    it('should contain required password validation messages', () => {
      expect(typeof ERROR_MESSAGES.PASSWORD_REQUIRED).toBe('string')
      expect(ERROR_MESSAGES.PASSWORD_REQUIRED.length).toBeGreaterThan(0)
      expect(typeof ERROR_MESSAGES.PASSWORD_TOO_SHORT).toBe('string')
      expect(typeof ERROR_MESSAGES.PASSWORD_TOO_LONG).toBe('string')
      expect(typeof ERROR_MESSAGES.PASSWORD_WEAK).toBe('string')
      expect(typeof ERROR_MESSAGES.PASSWORD_MISMATCH).toBe('string')
    })

    it('should contain auth flow messages', () => {
      expect(typeof ERROR_MESSAGES.LOGIN_FAILED).toBe('string')
      expect(ERROR_MESSAGES.LOGIN_FAILED.length).toBeGreaterThan(0)
      expect(typeof ERROR_MESSAGES.REGISTER_DUPLICATE).toBe('string')
      expect(typeof ERROR_MESSAGES.INVALID_TOKEN).toBe('string')
      expect(typeof ERROR_MESSAGES.WRONG_CURRENT_PASSWORD).toBe('string')
    })
  })

  describe('ROUTE_TITLES', () => {
    it('should have titles for all routes', () => {
      for (const route of Object.values(AUTH_ROUTES)) {
        expect(ROUTE_TITLES[route]).toBeDefined()
        expect(typeof ROUTE_TITLES[route]).toBe('string')
        expect(ROUTE_TITLES[route].length).toBeGreaterThan(0)
      }
    })
  })
})
