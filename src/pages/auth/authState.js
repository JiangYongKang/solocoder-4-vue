import {
    AUTH_ROUTES,
    ERROR_MESSAGES,
    PROTECTED_ROUTES,
    PUBLIC_ROUTES,
    TOKEN_DURATION_MS,
    TOKEN_EXPIRE_KEY,
    TOKEN_STORAGE_KEY,
    USER_STORAGE_KEY
} from './constants.js'

let token = null
let user = null
let tokenExpireAt = null

const registeredUsers = new Map()
const resetCodes = new Map()
const memoryStorage = new Map()

const storage = {
  getItem(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key)
      }
    } catch (e) {}
    const v = memoryStorage.get(key)
    return v === undefined ? null : v
  },
  setItem(key, value) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value)
        return
      }
    } catch (e) {}
    memoryStorage.set(key, value)
  },
  removeItem(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key)
      }
    } catch (e) {}
    memoryStorage.delete(key)
  },
  clear() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear()
      }
    } catch (e) {}
    memoryStorage.clear()
  }
}

export function _clearMemoryStorage() {
  memoryStorage.clear()
}

export const _storage = storage

export function initAuthState() {
  const storedToken = storage.getItem(TOKEN_STORAGE_KEY)
  const storedUser = storage.getItem(USER_STORAGE_KEY)
  const storedExpire = storage.getItem(TOKEN_EXPIRE_KEY)

  if (storedToken && storedExpire) {
    const expireTime = parseInt(storedExpire, 10)
    if (Date.now() < expireTime) {
      token = storedToken
      tokenExpireAt = expireTime
      if (storedUser) {
        try {
          user = JSON.parse(storedUser)
        } catch (e) {
          user = null
        }
      }
    } else {
      clearAuthState()
    }
  }
}

function secureRandomString(length, customChars) {
  const chars = customChars || 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const charsLen = chars.length

  const globalCrypto = globalThis.crypto
  if (globalCrypto && typeof globalCrypto.getRandomValues === 'function') {
    try {
      const values = new Uint32Array(length)
      globalCrypto.getRandomValues(values)
      for (let i = 0; i < length; i++) {
        result += chars[values[i] % charsLen]
      }
      return result
    } catch (e) {}
  }

  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * charsLen)]
  }
  return result
}

const RESET_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateResetCode() {
  return secureRandomString(6, RESET_CODE_CHARS)
}

function generateToken() {
  return 'tk_' + Date.now().toString(36) + '_' + secureRandomString(12)
}

function hashPassword(password) {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'h_' + Math.abs(hash).toString(16)
}

function saveToStorage() {
  if (token) {
    storage.setItem(TOKEN_STORAGE_KEY, token)
    storage.setItem(TOKEN_EXPIRE_KEY, String(tokenExpireAt))
    if (user) {
      storage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    }
  }
}

export function clearAuthState() {
  token = null
  user = null
  tokenExpireAt = null
  storage.removeItem(TOKEN_STORAGE_KEY)
  storage.removeItem(USER_STORAGE_KEY)
  storage.removeItem(TOKEN_EXPIRE_KEY)
}

export function isAuthenticated() {
  if (!token || !tokenExpireAt) {
    return false
  }
  const storedExpire = storage.getItem(TOKEN_EXPIRE_KEY)
  const expireCheck = storedExpire ? Math.min(tokenExpireAt, parseInt(storedExpire, 10)) : tokenExpireAt
  if (Date.now() >= expireCheck) {
    clearAuthState()
    return false
  }
  return true
}

export function getToken() {
  if (isAuthenticated()) {
    return token
  }
  return null
}

export function getUser() {
  if (isAuthenticated()) {
    return user
  }
  return null
}

export function registerUser(username, email, password) {
  if (registeredUsers.has(username)) {
    return {
      success: false,
      error: ERROR_MESSAGES.REGISTER_DUPLICATE
    }
  }

  const hashedPassword = hashPassword(password)
  registeredUsers.set(username, {
    username,
    email,
    password: hashedPassword,
    createdAt: Date.now()
  })

  return {
    success: true,
    data: { username, email }
  }
}

export function loginUser(username, password) {
  const storedUser = registeredUsers.get(username)
  if (!storedUser) {
    return {
      success: false,
      error: ERROR_MESSAGES.LOGIN_FAILED
    }
  }

  const hashedPassword = hashPassword(password)
  if (storedUser.password !== hashedPassword) {
    return {
      success: false,
      error: ERROR_MESSAGES.LOGIN_FAILED
    }
  }

  token = generateToken()
  tokenExpireAt = Date.now() + TOKEN_DURATION_MS
  user = {
    username: storedUser.username,
    email: storedUser.email
  }
  saveToStorage()

  return {
    success: true,
    data: {
      token,
      user,
      expireAt: tokenExpireAt
    }
  }
}

export function logoutUser() {
  clearAuthState()
  return {
    success: true
  }
}

export function requestPasswordReset(email) {
  const code = generateResetCode()
  resetCodes.set(email, {
    code,
    expireAt: Date.now() + 10 * 60 * 1000,
    used: false
  })

  return {
    success: true,
    data: {
      email,
      code,
      expireAt: resetCodes.get(email).expireAt
    }
  }
}

export function verifyResetCode(email, code) {
  const record = resetCodes.get(email)
  if (!record || record.used || Date.now() >= record.expireAt) {
    return {
      success: false,
      error: '验证码无效或已过期'
    }
  }
  if (record.code !== code) {
    return {
      success: false,
      error: '验证码不正确'
    }
  }
  return {
    success: true
  }
}

export function resetPassword(email, code, newPassword) {
  const verifyResult = verifyResetCode(email, code)
  if (!verifyResult.success) {
    return verifyResult
  }

  let targetUsername = null
  for (const [username, data] of registeredUsers.entries()) {
    if (data.email === email) {
      targetUsername = username
      break
    }
  }

  if (!targetUsername) {
    return {
      success: false,
      error: '该邮箱未注册'
    }
  }

  const userData = registeredUsers.get(targetUsername)
  userData.password = hashPassword(newPassword)
  registeredUsers.set(targetUsername, userData)

  const record = resetCodes.get(email)
  record.used = true

  clearAuthState()

  return {
    success: true,
    data: { username: targetUsername }
  }
}

export function changePassword(currentPassword, newPassword) {
  if (!isAuthenticated()) {
    return {
      success: false,
      error: ERROR_MESSAGES.PASSWORD_CHANGE_REQUIRE_LOGIN
    }
  }

  const storedUser = registeredUsers.get(user.username)
  if (!storedUser) {
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_TOKEN
    }
  }

  const hashedCurrent = hashPassword(currentPassword)
  if (storedUser.password !== hashedCurrent) {
    return {
      success: false,
      error: ERROR_MESSAGES.WRONG_CURRENT_PASSWORD
    }
  }

  storedUser.password = hashPassword(newPassword)
  registeredUsers.set(user.username, storedUser)

  clearAuthState()

  return {
    success: true
  }
}

export function isPublicRoute(route) {
  return PUBLIC_ROUTES.includes(route)
}

export function isProtectedRoute(route) {
  return PROTECTED_ROUTES.includes(route)
}

export function canAccessRoute(route, authenticated) {
  if (isProtectedRoute(route) && !authenticated) {
    return {
      allowed: false,
      redirectTo: AUTH_ROUTES.LOGIN,
      reason: ERROR_MESSAGES.INVALID_TOKEN
    }
  }

  if (authenticated && (route === AUTH_ROUTES.LOGIN || route === AUTH_ROUTES.REGISTER)) {
    return {
      allowed: false,
      redirectTo: AUTH_ROUTES.PROFILE,
      reason: '已登录用户不能访问登录或注册页面'
    }
  }

  return {
    allowed: true,
    redirectTo: null,
    reason: null
  }
}

export function getDefaultRoute(authenticated) {
  return authenticated ? AUTH_ROUTES.PROFILE : AUTH_ROUTES.LOGIN
}

export function getTokenExpireAt() {
  const stored = storage.getItem(TOKEN_EXPIRE_KEY)
  return stored ? parseInt(stored, 10) : null
}

export function _getRegisteredUsers() {
  return new Map(registeredUsers)
}

export function _clearRegisteredUsers() {
  registeredUsers.clear()
}

export function _clearResetCodes() {
  resetCodes.clear()
}

export function _getResetCodes() {
  return new Map(resetCodes)
}
