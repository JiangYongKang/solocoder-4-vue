import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  AUTH_ROUTES,
  ERROR_MESSAGES,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  TOKEN_EXPIRE_KEY
} from '../../auth/constants.js'
import {
  initAuthState,
  clearAuthState,
  isAuthenticated,
  getToken,
  getUser,
  registerUser,
  loginUser,
  logoutUser,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  changePassword,
  isPublicRoute,
  isProtectedRoute,
  canAccessRoute,
  getDefaultRoute,
  _clearRegisteredUsers,
  _clearResetCodes,
  _getRegisteredUsers,
  _getResetCodes,
  _clearMemoryStorage,
  _storage
} from '../../auth/authState.js'

describe('authState', () => {
  beforeEach(() => {
    _storage.clear()
    _clearRegisteredUsers()
    _clearResetCodes()
    clearAuthState()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('registerUser', () => {
    it('should register a new user successfully', () => {
      const result = registerUser('testuser', 'test@example.com', 'Password123')
      expect(result.success).toBe(true)
      expect(result.data.username).toBe('testuser')
      expect(result.data.email).toBe('test@example.com')
    })

    it('should store user in registeredUsers', () => {
      registerUser('testuser', 'test@example.com', 'Password123')
      const users = _getRegisteredUsers()
      expect(users.has('testuser')).toBe(true)
      const user = users.get('testuser')
      expect(user.email).toBe('test@example.com')
      expect(user.password).toBeDefined()
      expect(typeof user.password).toBe('string')
      expect(user.password).not.toBe('Password123')
    })

    it('should fail for duplicate username', () => {
      registerUser('testuser', 'test1@example.com', 'Password123')
      const result = registerUser('testuser', 'test2@example.com', 'Password456')
      expect(result.success).toBe(false)
      expect(result.error).toBe(ERROR_MESSAGES.REGISTER_DUPLICATE)
    })

    it('should hash passwords consistently', () => {
      registerUser('user1', 'u1@ex.com', 'SamePass123')
      registerUser('user2', 'u2@ex.com', 'SamePass123')
      const users = _getRegisteredUsers()
      expect(users.get('user1').password).toBe(users.get('user2').password)
    })
  })

  describe('loginUser', () => {
    beforeEach(() => {
      registerUser('testuser', 'test@example.com', 'Password123')
    })

    it('should login with correct credentials', () => {
      const result = loginUser('testuser', 'Password123')
      expect(result.success).toBe(true)
      expect(result.data.token).toBeDefined()
      expect(result.data.token.startsWith('tk_')).toBe(true)
      expect(result.data.user.username).toBe('testuser')
      expect(result.data.user.email).toBe('test@example.com')
      expect(result.data.expireAt).toBeDefined()
      expect(result.data.expireAt).toBeGreaterThan(Date.now())
    })

    it('should persist token in localStorage', () => {
      loginUser('testuser', 'Password123')
      expect(_storage.getItem(TOKEN_STORAGE_KEY)).toBeDefined()
      expect(_storage.getItem(USER_STORAGE_KEY)).toBeDefined()
      expect(_storage.getItem(TOKEN_EXPIRE_KEY)).toBeDefined()
    })

    it('should store user info in localStorage as JSON', () => {
      loginUser('testuser', 'Password123')
      const storedUser = JSON.parse(_storage.getItem(USER_STORAGE_KEY))
      expect(storedUser.username).toBe('testuser')
      expect(storedUser.email).toBe('test@example.com')
    })

    it('should fail for non-existent user', () => {
      const result = loginUser('nobody', 'Password123')
      expect(result.success).toBe(false)
      expect(result.error).toBe(ERROR_MESSAGES.LOGIN_FAILED)
    })

    it('should fail for wrong password', () => {
      const result = loginUser('testuser', 'WrongPass123')
      expect(result.success).toBe(false)
      expect(result.error).toBe(ERROR_MESSAGES.LOGIN_FAILED)
    })

    it('should set authenticated state', () => {
      expect(isAuthenticated()).toBe(false)
      loginUser('testuser', 'Password123')
      expect(isAuthenticated()).toBe(true)
    })

    it('should generate different tokens for different logins', async () => {
      const r1 = loginUser('testuser', 'Password123')
      await new Promise(r => setTimeout(r, 5))
      clearAuthState()
      const r2 = loginUser('testuser', 'Password123')
      expect(r1.data.token).not.toBe(r2.data.token)
    })
  })

  describe('isAuthenticated', () => {
    beforeEach(() => {
      registerUser('testuser', 'test@example.com', 'Password123')
    })

    it('should return false initially', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('should return true after login', () => {
      loginUser('testuser', 'Password123')
      expect(isAuthenticated()).toBe(true)
    })

    it('should return false after logout', () => {
      loginUser('testuser', 'Password123')
      logoutUser()
      expect(isAuthenticated()).toBe(false)
    })

    it('should return false when token expires', () => {
      loginUser('testuser', 'Password123')
      const pastTime = Date.now() - 1000
      _storage.setItem(TOKEN_EXPIRE_KEY, String(pastTime))
      expect(isAuthenticated()).toBe(false)
    })

    it('should clear storage when token expires', () => {
      loginUser('testuser', 'Password123')
      const pastTime = Date.now() - 1000
      _storage.setItem(TOKEN_EXPIRE_KEY, String(pastTime))
      isAuthenticated()
      expect(_storage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
      expect(_storage.getItem(USER_STORAGE_KEY)).toBeNull()
    })
  })

  describe('getToken and getUser', () => {
    beforeEach(() => {
      registerUser('testuser', 'test@example.com', 'Password123')
    })

    it('should return null when not authenticated', () => {
      expect(getToken()).toBeNull()
      expect(getUser()).toBeNull()
    })

    it('should return values when authenticated', () => {
      const loginResult = loginUser('testuser', 'Password123')
      expect(getToken()).toBe(loginResult.data.token)
      expect(getUser()).toEqual(loginResult.data.user)
    })

    it('should return null when expired', () => {
      loginUser('testuser', 'Password123')
      _storage.setItem(TOKEN_EXPIRE_KEY, String(Date.now() - 1000))
      expect(getToken()).toBeNull()
      expect(getUser()).toBeNull()
    })
  })

  describe('logoutUser', () => {
    beforeEach(() => {
      registerUser('testuser', 'test@example.com', 'Password123')
      loginUser('testuser', 'Password123')
    })

    it('should clear all auth state', () => {
      expect(isAuthenticated()).toBe(true)
      logoutUser()
      expect(isAuthenticated()).toBe(false)
      expect(getToken()).toBeNull()
      expect(getUser()).toBeNull()
    })

    it('should clear localStorage', () => {
      expect(_storage.getItem(TOKEN_STORAGE_KEY)).toBeTruthy()
      logoutUser()
      expect(_storage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
      expect(_storage.getItem(USER_STORAGE_KEY)).toBeNull()
      expect(_storage.getItem(TOKEN_EXPIRE_KEY)).toBeNull()
    })

    it('should return success', () => {
      const result = logoutUser()
      expect(result.success).toBe(true)
    })
  })

  describe('initAuthState', () => {
    beforeEach(() => {
      registerUser('testuser', 'test@example.com', 'Password123')
    })

    it('should restore session from valid localStorage', () => {
      loginUser('testuser', 'Password123')
      const token = _storage.getItem(TOKEN_STORAGE_KEY)
      clearAuthState()
      _storage.setItem(TOKEN_STORAGE_KEY, token)
      _storage.setItem(USER_STORAGE_KEY, JSON.stringify({ username: 'testuser', email: 'test@example.com' }))
      _storage.setItem(TOKEN_EXPIRE_KEY, String(Date.now() + 3600000))

      initAuthState()
      expect(isAuthenticated()).toBe(true)
      expect(getUser()?.username).toBe('testuser')
    })

    it('should not restore expired session', () => {
      _storage.setItem(TOKEN_STORAGE_KEY, 'old_token')
      _storage.setItem(TOKEN_EXPIRE_KEY, String(Date.now() - 1000))

      initAuthState()
      expect(isAuthenticated()).toBe(false)
    })

    it('should not restore if token is missing', () => {
      _storage.setItem(TOKEN_EXPIRE_KEY, String(Date.now() + 3600000))
      initAuthState()
      expect(isAuthenticated()).toBe(false)
    })

    it('should handle invalid JSON user data gracefully', () => {
      _storage.setItem(TOKEN_STORAGE_KEY, 'some_token')
      _storage.setItem(TOKEN_EXPIRE_KEY, String(Date.now() + 3600000))
      _storage.setItem(USER_STORAGE_KEY, 'not-valid-json')

      initAuthState()
      expect(isAuthenticated()).toBe(true)
      expect(getUser()).toBeNull()
    })
  })

  describe('requestPasswordReset', () => {
    it('should return a reset code', () => {
      const result = requestPasswordReset('test@example.com')
      expect(result.success).toBe(true)
      expect(result.data.code).toBeDefined()
      expect(result.data.code.length).toBe(6)
      expect(result.data.email).toBe('test@example.com')
      expect(result.data.expireAt).toBeGreaterThan(Date.now())
    })

    it('should store the reset code', () => {
      requestPasswordReset('test@example.com')
      const codes = _getResetCodes()
      expect(codes.has('test@example.com')).toBe(true)
      const record = codes.get('test@example.com')
      expect(record.code).toBeDefined()
      expect(record.used).toBe(false)
      expect(record.expireAt).toBeGreaterThan(Date.now())
    })

    it('should generate uppercase alphanumeric codes', () => {
      for (let i = 0; i < 10; i++) {
        const result = requestPasswordReset(`user${i}@ex.com`)
        expect(/^[A-Z0-9]{6}$/.test(result.data.code)).toBe(true)
      }
    })
  })

  describe('verifyResetCode', () => {
    let code = ''
    const email = 'test@example.com'

    beforeEach(() => {
      const result = requestPasswordReset(email)
      code = result.data.code
    })

    it('should verify correct code', () => {
      const result = verifyResetCode(email, code)
      expect(result.success).toBe(true)
    })

    it('should fail for wrong code', () => {
      const result = verifyResetCode(email, 'WRONG1')
      expect(result.success).toBe(false)
    })

    it('should fail for non-existent email', () => {
      const result = verifyResetCode('nobody@ex.com', code)
      expect(result.success).toBe(false)
    })

    it('should fail for expired code', () => {
      const codes = _getResetCodes()
      const record = codes.get(email)
      record.expireAt = Date.now() - 1000
      const result = verifyResetCode(email, code)
      expect(result.success).toBe(false)
      expect(result.error).toBe('验证码无效或已过期')
    })
  })

  describe('resetPassword', () => {
    const email = 'test@example.com'
    let code = ''

    beforeEach(() => {
      registerUser('testuser', email, 'OldPassword123')
      const reqResult = requestPasswordReset(email)
      code = reqResult.data.code
    })

    it('should reset password with valid code', () => {
      const result = resetPassword(email, code, 'NewPassword456')
      expect(result.success).toBe(true)
      expect(result.data.username).toBe('testuser')
    })

    it('should clear session after reset', () => {
      loginUser('testuser', 'OldPassword123')
      expect(isAuthenticated()).toBe(true)
      resetPassword(email, code, 'NewPassword456')
      expect(isAuthenticated()).toBe(false)
    })

    it('should mark code as used', () => {
      resetPassword(email, code, 'NewPassword456')
      const codes = _getResetCodes()
      expect(codes.get(email).used).toBe(true)
    })

    it('should fail to reuse code', () => {
      resetPassword(email, code, 'Password1')
      const result = resetPassword(email, code, 'Password2')
      expect(result.success).toBe(false)
      expect(result.error).toBe('验证码无效或已过期')
    })

    it('should fail for non-registered email', () => {
      const anotherEmail = 'other@example.com'
      const req = requestPasswordReset(anotherEmail)
      const result = resetPassword(anotherEmail, req.data.code, 'SomePass123')
      expect(result.success).toBe(false)
      expect(result.error).toBe('该邮箱未注册')
    })

    it('should allow login with new password after reset', () => {
      resetPassword(email, code, 'BrandNew789')
      const loginResult = loginUser('testuser', 'BrandNew789')
      expect(loginResult.success).toBe(true)
    })

    it('should reject old password after reset', () => {
      resetPassword(email, code, 'NewPass123')
      const loginResult = loginUser('testuser', 'OldPassword123')
      expect(loginResult.success).toBe(false)
    })
  })

  describe('changePassword', () => {
    beforeEach(() => {
      registerUser('testuser', 'test@example.com', 'OldPass123')
      loginUser('testuser', 'OldPass123')
    })

    it('should change password with correct current password', () => {
      const result = changePassword('OldPass123', 'NewPass456')
      expect(result.success).toBe(true)
    })

    it('should clear session after password change', () => {
      expect(isAuthenticated()).toBe(true)
      changePassword('OldPass123', 'NewPass456')
      expect(isAuthenticated()).toBe(false)
      expect(_storage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
    })

    it('should fail with wrong current password', () => {
      const result = changePassword('WrongPass', 'NewPass456')
      expect(result.success).toBe(false)
      expect(result.error).toBe(ERROR_MESSAGES.WRONG_CURRENT_PASSWORD)
    })

    it('should fail when not authenticated', () => {
      logoutUser()
      const result = changePassword('OldPass123', 'NewPass456')
      expect(result.success).toBe(false)
      expect(result.error).toBe(ERROR_MESSAGES.PASSWORD_CHANGE_REQUIRE_LOGIN)
    })

    it('should allow login with new password after change', () => {
      changePassword('OldPass123', 'BrandNew789')
      const loginResult = loginUser('testuser', 'BrandNew789')
      expect(loginResult.success).toBe(true)
    })

    it('should reject old password after change', () => {
      changePassword('OldPass123', 'NewPass456')
      const loginResult = loginUser('testuser', 'OldPass123')
      expect(loginResult.success).toBe(false)
    })
  })

  describe('isPublicRoute and isProtectedRoute', () => {
    it('should identify public routes', () => {
      expect(isPublicRoute(AUTH_ROUTES.LOGIN)).toBe(true)
      expect(isPublicRoute(AUTH_ROUTES.REGISTER)).toBe(true)
      expect(isPublicRoute(AUTH_ROUTES.FORGOT_PASSWORD)).toBe(true)
      expect(isPublicRoute(AUTH_ROUTES.RESET_PASSWORD)).toBe(true)
    })

    it('should identify protected routes', () => {
      expect(isProtectedRoute(AUTH_ROUTES.CHANGE_PASSWORD)).toBe(true)
      expect(isProtectedRoute(AUTH_ROUTES.PROFILE)).toBe(true)
    })

    it('should not mark protected as public', () => {
      expect(isPublicRoute(AUTH_ROUTES.CHANGE_PASSWORD)).toBe(false)
      expect(isPublicRoute(AUTH_ROUTES.PROFILE)).toBe(false)
    })

    it('should not mark public as protected', () => {
      expect(isProtectedRoute(AUTH_ROUTES.LOGIN)).toBe(false)
      expect(isProtectedRoute(AUTH_ROUTES.REGISTER)).toBe(false)
    })
  })

  describe('canAccessRoute', () => {
    it('should allow public routes for unauthenticated users', () => {
      for (const route of [AUTH_ROUTES.LOGIN, AUTH_ROUTES.REGISTER, AUTH_ROUTES.FORGOT_PASSWORD]) {
        const result = canAccessRoute(route, false)
        expect(result.allowed).toBe(true)
        expect(result.redirectTo).toBeNull()
      }
    })

    it('should block protected routes for unauthenticated users', () => {
      for (const route of [AUTH_ROUTES.CHANGE_PASSWORD, AUTH_ROUTES.PROFILE]) {
        const result = canAccessRoute(route, false)
        expect(result.allowed).toBe(false)
        expect(result.redirectTo).toBe(AUTH_ROUTES.LOGIN)
        expect(result.reason).toBe(ERROR_MESSAGES.INVALID_TOKEN)
      }
    })

    it('should block login/register for authenticated users', () => {
      const loginResult = canAccessRoute(AUTH_ROUTES.LOGIN, true)
      expect(loginResult.allowed).toBe(false)
      expect(loginResult.redirectTo).toBe(AUTH_ROUTES.PROFILE)

      const registerResult = canAccessRoute(AUTH_ROUTES.REGISTER, true)
      expect(registerResult.allowed).toBe(false)
      expect(registerResult.redirectTo).toBe(AUTH_ROUTES.PROFILE)
    })

    it('should allow protected routes for authenticated users', () => {
      for (const route of [AUTH_ROUTES.CHANGE_PASSWORD, AUTH_ROUTES.PROFILE]) {
        const result = canAccessRoute(route, true)
        expect(result.allowed).toBe(true)
        expect(result.redirectTo).toBeNull()
      }
    })

    it('should allow forgot password for authenticated users', () => {
      const result = canAccessRoute(AUTH_ROUTES.FORGOT_PASSWORD, true)
      expect(result.allowed).toBe(true)
    })
  })

  describe('getDefaultRoute', () => {
    it('should return login for unauthenticated', () => {
      expect(getDefaultRoute(false)).toBe(AUTH_ROUTES.LOGIN)
    })

    it('should return profile for authenticated', () => {
      expect(getDefaultRoute(true)).toBe(AUTH_ROUTES.PROFILE)
    })
  })
})
