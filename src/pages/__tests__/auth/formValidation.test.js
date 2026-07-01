import { describe, it, expect } from 'vitest'
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateStrongPassword,
  validateConfirmPassword,
  validateCurrentPassword,
  validateNewPassword,
  validateLoginForm,
  validateRegisterForm,
  validateForgotPasswordForm,
  validateResetPasswordForm,
  validateChangePasswordForm
} from '../../auth/formValidation.js'
import { ERROR_MESSAGES } from '../../auth/constants.js'

describe('formValidation', () => {
  describe('validateUsername', () => {
    it('should return valid for correct username', () => {
      const result = validateUsername('test_user123')
      expect(result.valid).toBe(true)
      expect(result.message).toBeNull()
    })

    it('should trim whitespace before validating', () => {
      const result = validateUsername('  user_123  ')
      expect(result.valid).toBe(true)
    })

    it('should fail for empty string', () => {
      const result = validateUsername('')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.USERNAME_REQUIRED)
    })

    it('should fail for whitespace only', () => {
      const result = validateUsername('   ')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.USERNAME_REQUIRED)
    })

    it('should fail for null/undefined', () => {
      expect(validateUsername(null).valid).toBe(false)
      expect(validateUsername(undefined).valid).toBe(false)
    })

    it('should fail for too short username', () => {
      const result = validateUsername('ab')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.USERNAME_TOO_SHORT)
    })

    it('should fail for too long username', () => {
      const longName = 'a'.repeat(21)
      const result = validateUsername(longName)
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.USERNAME_TOO_LONG)
    })

    it('should pass for exactly 3 characters', () => {
      const result = validateUsername('abc')
      expect(result.valid).toBe(true)
    })

    it('should pass for exactly 20 characters', () => {
      const name = 'a'.repeat(20)
      const result = validateUsername(name)
      expect(result.valid).toBe(true)
    })

    it('should fail for invalid characters (spaces)', () => {
      const result = validateUsername('test user')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.USERNAME_INVALID)
    })

    it('should fail for invalid characters (special)', () => {
      const result = validateUsername('test@user')
      expect(result.valid).toBe(false)
    })

    it('should fail for Chinese characters', () => {
      const result = validateUsername('测试用户')
      expect(result.valid).toBe(false)
    })
  })

  describe('validateEmail', () => {
    it('should return valid for correct email', () => {
      const result = validateEmail('test@example.com')
      expect(result.valid).toBe(true)
      expect(result.message).toBeNull()
    })

    it('should trim whitespace before validating', () => {
      const result = validateEmail('  test@example.com  ')
      expect(result.valid).toBe(true)
    })

    it('should support subdomains', () => {
      expect(validateEmail('user@mail.example.co.uk').valid).toBe(true)
    })

    it('should support plus addressing', () => {
      expect(validateEmail('user+tag@example.com').valid).toBe(true)
    })

    it('should fail for empty string', () => {
      const result = validateEmail('')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.EMAIL_REQUIRED)
    })

    it('should fail for null/undefined', () => {
      expect(validateEmail(null).valid).toBe(false)
      expect(validateEmail(undefined).valid).toBe(false)
    })

    it('should fail for missing @', () => {
      const result = validateEmail('testexample.com')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.EMAIL_INVALID)
    })

    it('should fail for missing domain', () => {
      const result = validateEmail('test@')
      expect(result.valid).toBe(false)
    })

    it('should fail for missing username', () => {
      const result = validateEmail('@example.com')
      expect(result.valid).toBe(false)
    })

    it('should fail for missing TLD', () => {
      const result = validateEmail('test@example')
      expect(result.valid).toBe(false)
    })

    it('should fail for single char TLD', () => {
      const result = validateEmail('test@example.c')
      expect(result.valid).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should pass for valid 8+ char password', () => {
      const result = validatePassword('password123')
      expect(result.valid).toBe(true)
      expect(result.message).toBeNull()
    })

    it('should fail for empty string', () => {
      const result = validatePassword('')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.PASSWORD_REQUIRED)
    })

    it('should fail for null/undefined', () => {
      expect(validatePassword(null).valid).toBe(false)
      expect(validatePassword(undefined).valid).toBe(false)
    })

    it('should fail for too short password', () => {
      const result = validatePassword('pass123')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.PASSWORD_TOO_SHORT)
    })

    it('should fail for too long password', () => {
      const longPwd = 'a'.repeat(51)
      const result = validatePassword(longPwd)
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.PASSWORD_TOO_LONG)
    })

    it('should pass for exactly 8 characters', () => {
      const result = validatePassword('12345678')
      expect(result.valid).toBe(true)
    })

    it('should pass for exactly 50 characters', () => {
      const pwd = 'a'.repeat(50)
      const result = validatePassword(pwd)
      expect(result.valid).toBe(true)
    })
  })

  describe('validateStrongPassword', () => {
    it('should pass for strong password', () => {
      const result = validateStrongPassword('Password123')
      expect(result.valid).toBe(true)
    })

    it('should fail for basic check first', () => {
      expect(validateStrongPassword('').valid).toBe(false)
      expect(validateStrongPassword('short').valid).toBe(false)
    })

    it('should fail without uppercase', () => {
      const result = validateStrongPassword('password123')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.PASSWORD_WEAK)
    })

    it('should fail without lowercase', () => {
      const result = validateStrongPassword('PASSWORD123')
      expect(result.valid).toBe(false)
    })

    it('should fail without numbers', () => {
      const result = validateStrongPassword('PasswordABC')
      expect(result.valid).toBe(false)
    })

    it('should fail with only uppercase and numbers', () => {
      const result = validateStrongPassword('PASSWORD123')
      expect(result.valid).toBe(false)
    })

    it('should fail with only lowercase and numbers', () => {
      const result = validateStrongPassword('password123')
      expect(result.valid).toBe(false)
    })
  })

  describe('validateConfirmPassword', () => {
    it('should pass when passwords match', () => {
      const result = validateConfirmPassword('Password123', 'Password123')
      expect(result.valid).toBe(true)
      expect(result.message).toBeNull()
    })

    it('should fail for empty confirm', () => {
      const result = validateConfirmPassword('Password123', '')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.CONFIRM_PASSWORD_REQUIRED)
    })

    it('should fail for null/undefined', () => {
      expect(validateConfirmPassword('pwd', null).valid).toBe(false)
      expect(validateConfirmPassword('pwd', undefined).valid).toBe(false)
    })

    it('should fail when passwords differ', () => {
      const result = validateConfirmPassword('Password123', 'Password456')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.PASSWORD_MISMATCH)
    })

    it('should fail on case difference', () => {
      const result = validateConfirmPassword('Password123', 'password123')
      expect(result.valid).toBe(false)
    })
  })

  describe('validateCurrentPassword', () => {
    it('should pass for non-empty password', () => {
      const result = validateCurrentPassword('anyPassword')
      expect(result.valid).toBe(true)
    })

    it('should fail for empty', () => {
      const result = validateCurrentPassword('')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.CURRENT_PASSWORD_REQUIRED)
    })

    it('should fail for null/undefined', () => {
      expect(validateCurrentPassword(null).valid).toBe(false)
      expect(validateCurrentPassword(undefined).valid).toBe(false)
    })
  })

  describe('validateNewPassword', () => {
    it('should pass for strong password', () => {
      const result = validateNewPassword('Password123')
      expect(result.valid).toBe(true)
    })

    it('should fail for empty', () => {
      const result = validateNewPassword('')
      expect(result.valid).toBe(false)
      expect(result.message).toBe(ERROR_MESSAGES.NEW_PASSWORD_REQUIRED)
    })

    it('should apply strong password rules', () => {
      const result = validateNewPassword('weakpass')
      expect(result.valid).toBe(false)
    })
  })

  describe('validateLoginForm', () => {
    it('should pass with valid data', () => {
      const result = validateLoginForm({
        username: 'testuser',
        password: 'Password123'
      })
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should fail with both invalid', () => {
      const result = validateLoginForm({
        username: '',
        password: ''
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.username).toBeDefined()
      expect(result.errors.password).toBeDefined()
    })

    it('should fail with invalid username only', () => {
      const result = validateLoginForm({
        username: 'ab',
        password: 'Password123'
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.username).toBeDefined()
      expect(result.errors.password).toBeUndefined()
    })

    it('should handle null form data', () => {
      const result = validateLoginForm(null)
      expect(result.isValid).toBe(false)
    })

    it('should handle undefined form data', () => {
      const result = validateLoginForm(undefined)
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateRegisterForm', () => {
    const validData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123'
    }

    it('should pass with valid data', () => {
      const result = validateRegisterForm(validData)
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should fail with empty fields', () => {
      const result = validateRegisterForm({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.username).toBeDefined()
      expect(result.errors.email).toBeDefined()
      expect(result.errors.password).toBeDefined()
      expect(result.errors.confirmPassword).toBeDefined()
    })

    it('should fail with mismatched passwords', () => {
      const data = { ...validData, confirmPassword: 'Different123' }
      const result = validateRegisterForm(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.confirmPassword).toBeDefined()
    })

    it('should fail with weak password', () => {
      const data = { ...validData, password: 'weak', confirmPassword: 'weak' }
      const result = validateRegisterForm(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.password).toBeDefined()
    })

    it('should validate email format', () => {
      const data = { ...validData, email: 'invalid-email' }
      const result = validateRegisterForm(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.email).toBeDefined()
    })
  })

  describe('validateForgotPasswordForm', () => {
    it('should pass with valid email', () => {
      const result = validateForgotPasswordForm({ email: 'test@example.com' })
      expect(result.isValid).toBe(true)
    })

    it('should fail with empty email', () => {
      const result = validateForgotPasswordForm({ email: '' })
      expect(result.isValid).toBe(false)
      expect(result.errors.email).toBeDefined()
    })

    it('should fail with invalid email', () => {
      const result = validateForgotPasswordForm({ email: 'not-an-email' })
      expect(result.isValid).toBe(false)
    })

    it('should handle null form data', () => {
      const result = validateForgotPasswordForm(null)
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateResetPasswordForm', () => {
    const validData = {
      email: 'test@example.com',
      code: 'ABC123',
      password: 'Password123',
      confirmPassword: 'Password123'
    }

    it('should pass with valid data', () => {
      const result = validateResetPasswordForm(validData)
      expect(result.isValid).toBe(true)
    })

    it('should fail with empty code', () => {
      const data = { ...validData, code: '' }
      const result = validateResetPasswordForm(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.code).toBeDefined()
    })

    it('should fail with whitespace-only code', () => {
      const data = { ...validData, code: '   ' }
      const result = validateResetPasswordForm(data)
      expect(result.isValid).toBe(false)
    })

    it('should fail with mismatched passwords', () => {
      const data = { ...validData, confirmPassword: 'Mismatch123' }
      const result = validateResetPasswordForm(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.confirmPassword).toBeDefined()
    })

    it('should fail with weak password', () => {
      const data = { ...validData, password: 'weakpass', confirmPassword: 'weakpass' }
      const result = validateResetPasswordForm(data)
      expect(result.isValid).toBe(false)
    })

    it('should report all errors at once', () => {
      const result = validateResetPasswordForm({
        email: '',
        code: '',
        password: '',
        confirmPassword: ''
      })
      expect(result.isValid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('validateChangePasswordForm', () => {
    const validData = {
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword456',
      confirmPassword: 'NewPassword456'
    }

    it('should pass with valid data', () => {
      const result = validateChangePasswordForm(validData)
      expect(result.isValid).toBe(true)
    })

    it('should fail with empty current password', () => {
      const data = { ...validData, currentPassword: '' }
      const result = validateChangePasswordForm(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.currentPassword).toBeDefined()
    })

    it('should fail with weak new password', () => {
      const data = { ...validData, newPassword: 'weak', confirmPassword: 'weak' }
      const result = validateChangePasswordForm(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.newPassword).toBeDefined()
    })

    it('should fail with mismatched confirm', () => {
      const data = { ...validData, confirmPassword: 'Mismatch789' }
      const result = validateChangePasswordForm(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.confirmPassword).toBeDefined()
    })

    it('should fail with all empty fields', () => {
      const result = validateChangePasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      expect(result.isValid).toBe(false)
      expect(Object.keys(result.errors)).toHaveLength(3)
    })
  })
})
