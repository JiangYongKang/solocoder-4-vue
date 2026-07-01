import {
    MAX_VERIFICATION_ATTEMPTS,
    PASSWORD_MIN_LENGTH,
    SMS_CODE_LENGTH,
    VERIFICATION_ERRORS,
    VERIFICATION_METHOD
} from './constants.js'

const VALID_SMS_CODE = /^\d{6}$/
const VALID_EMAIL_CODE = /^\d{6}$/
const VALID_PASSWORD = /^.{6,}$/

const MOCK_CORRECT_PASSWORD = 'password123'
const MOCK_CORRECT_CODE = '123456'

export function validatePasswordFormat(password) {
  if (!password || password.trim() === '') {
    return {
      valid: false,
      error: VERIFICATION_ERRORS.EMPTY_PASSWORD
    }
  }

  if (!VALID_PASSWORD.test(password)) {
    return {
      valid: false,
      error: `密码长度不能少于${PASSWORD_MIN_LENGTH}位`
    }
  }

  return { valid: true, error: null }
}

export function validateSmsCodeFormat(code) {
  if (!code || code.trim() === '') {
    return {
      valid: false,
      error: VERIFICATION_ERRORS.EMPTY_CODE
    }
  }

  if (!VALID_SMS_CODE.test(code)) {
    return {
      valid: false,
      error: VERIFICATION_ERRORS.INVALID_CODE
    }
  }

  return { valid: true, error: null }
}

export function validateEmailCodeFormat(code) {
  if (!code || code.trim() === '') {
    return {
      valid: false,
      error: VERIFICATION_ERRORS.EMPTY_CODE
    }
  }

  if (!VALID_EMAIL_CODE.test(code)) {
    return {
      valid: false,
      error: VERIFICATION_ERRORS.INVALID_CODE
    }
  }

  return { valid: true, error: null }
}

export function validateFormat(method, value) {
  switch (method) {
    case VERIFICATION_METHOD.PASSWORD:
      return validatePasswordFormat(value)
    case VERIFICATION_METHOD.SMS_CODE:
      return validateSmsCodeFormat(value)
    case VERIFICATION_METHOD.EMAIL_CODE:
      return validateEmailCodeFormat(value)
    default:
      return { valid: false, error: '未知的验证方式' }
  }
}

export function checkAttempts(attempts) {
  if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
    return {
      allowed: false,
      error: VERIFICATION_ERRORS.TOO_MANY_ATTEMPTS
    }
  }
  return { allowed: true, error: null }
}

export function verifyPassword(password) {
  const formatResult = validatePasswordFormat(password)
  if (!formatResult.valid) {
    return formatResult
  }

  if (password !== MOCK_CORRECT_PASSWORD) {
    return {
      valid: false,
      error: VERIFICATION_ERRORS.WRONG_PASSWORD
    }
  }

  return { valid: true, error: null }
}

export function verifySmsCode(code, expectedCode = MOCK_CORRECT_CODE) {
  const formatResult = validateSmsCodeFormat(code)
  if (!formatResult.valid) {
    return formatResult
  }

  if (code !== expectedCode) {
    return {
      valid: false,
      error: VERIFICATION_ERRORS.WRONG_CODE
    }
  }

  return { valid: true, error: null }
}

export function verifyEmailCode(code, expectedCode = MOCK_CORRECT_CODE) {
  const formatResult = validateEmailCodeFormat(code)
  if (!formatResult.valid) {
    return formatResult
  }

  if (code !== expectedCode) {
    return {
      valid: false,
      error: VERIFICATION_ERRORS.WRONG_CODE
    }
  }

  return { valid: true, error: null }
}

export function verifyIdentity(method, value, expectedCode) {
  switch (method) {
    case VERIFICATION_METHOD.PASSWORD:
      return verifyPassword(value)
    case VERIFICATION_METHOD.SMS_CODE:
      return verifySmsCode(value, expectedCode)
    case VERIFICATION_METHOD.EMAIL_CODE:
      return verifyEmailCode(value, expectedCode)
    default:
      return { valid: false, error: '未知的验证方式' }
  }
}

export function performVerificationWithAttempts(method, value, currentAttempts, expectedCode) {
  const attemptCheck = checkAttempts(currentAttempts)
  if (!attemptCheck.allowed) {
    return {
      valid: false,
      error: attemptCheck.error,
      attempts: currentAttempts,
      locked: true
    }
  }

  const result = verifyIdentity(method, value, expectedCode)
  const newAttempts = result.valid ? 0 : currentAttempts + 1
  const isLocked = newAttempts >= MAX_VERIFICATION_ATTEMPTS

  return {
    valid: result.valid,
    error: result.error,
    attempts: newAttempts,
    locked: isLocked
  }
}

export function generateVerificationCode(length = SMS_CODE_LENGTH) {
  const digits = '0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length))
  }
  return code
}

export async function sendVerificationCodeAsync(method, phoneOrEmail) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  if (Math.random() < 0.1) {
    throw new Error(VERIFICATION_ERRORS.NETWORK_ERROR)
  }
  return generateVerificationCode(SMS_CODE_LENGTH)
}

export async function verifyIdentityAsync(method, value, currentAttempts, expectedCode) {
  await new Promise(resolve => setTimeout(resolve, 800))
  if (Math.random() < 0.1) {
    throw new Error(VERIFICATION_ERRORS.NETWORK_ERROR)
  }
  return performVerificationWithAttempts(method, value, currentAttempts, expectedCode)
}

export function getCodeExpirationTime(minutes = 5) {
  const now = new Date()
  now.setMinutes(now.getMinutes() + minutes)
  return now.toISOString()
}

export function isCodeExpired(expirationTime, currentTime = new Date().toISOString()) {
  const expire = new Date(expirationTime)
  const now = new Date(currentTime)

  if (isNaN(expire.getTime()) || isNaN(now.getTime())) {
    return true
  }

  return now.getTime() >= expire.getTime()
}

export function getMaskedPhone(phone) {
  if (!phone || phone.length < 7) return phone || ''
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

export function getMaskedEmail(email) {
  if (!email || !email.includes('@')) return email || ''
  const [username, domain] = email.split('@')
  if (username.length <= 2) {
    return username + '***@' + domain
  }
  return username.slice(0, 1) + '***' + username.slice(-1) + '@' + domain
}
