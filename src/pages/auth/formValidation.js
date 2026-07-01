import { ERROR_MESSAGES, VALIDATION_RULES } from './constants.js'

export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, message: ERROR_MESSAGES.USERNAME_REQUIRED }
  }

  const trimmed = username.trim()
  if (!trimmed) {
    return { valid: false, message: ERROR_MESSAGES.USERNAME_REQUIRED }
  }

  if (trimmed.length < VALIDATION_RULES.USERNAME_MIN_LENGTH) {
    return { valid: false, message: ERROR_MESSAGES.USERNAME_TOO_SHORT }
  }

  if (trimmed.length > VALIDATION_RULES.USERNAME_MAX_LENGTH) {
    return { valid: false, message: ERROR_MESSAGES.USERNAME_TOO_LONG }
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(trimmed)) {
    return { valid: false, message: ERROR_MESSAGES.USERNAME_INVALID }
  }

  return { valid: true, message: null }
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: ERROR_MESSAGES.EMAIL_REQUIRED }
  }

  const trimmed = email.trim()
  if (!trimmed) {
    return { valid: false, message: ERROR_MESSAGES.EMAIL_REQUIRED }
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: ERROR_MESSAGES.EMAIL_INVALID }
  }

  return { valid: true, message: null }
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: ERROR_MESSAGES.PASSWORD_REQUIRED }
  }

  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    return { valid: false, message: ERROR_MESSAGES.PASSWORD_TOO_SHORT }
  }

  if (password.length > VALIDATION_RULES.PASSWORD_MAX_LENGTH) {
    return { valid: false, message: ERROR_MESSAGES.PASSWORD_TOO_LONG }
  }

  return { valid: true, message: null }
}

export function validateStrongPassword(password) {
  const basicCheck = validatePassword(password)
  if (!basicCheck.valid) {
    return basicCheck
  }

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return { valid: false, message: ERROR_MESSAGES.PASSWORD_WEAK }
  }

  return { valid: true, message: null }
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword || typeof confirmPassword !== 'string') {
    return { valid: false, message: ERROR_MESSAGES.CONFIRM_PASSWORD_REQUIRED }
  }

  if (!confirmPassword) {
    return { valid: false, message: ERROR_MESSAGES.CONFIRM_PASSWORD_REQUIRED }
  }

  if (password !== confirmPassword) {
    return { valid: false, message: ERROR_MESSAGES.PASSWORD_MISMATCH }
  }

  return { valid: true, message: null }
}

export function validateCurrentPassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: ERROR_MESSAGES.CURRENT_PASSWORD_REQUIRED }
  }

  return { valid: true, message: null }
}

export function validateNewPassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: ERROR_MESSAGES.NEW_PASSWORD_REQUIRED }
  }

  return validateStrongPassword(password)
}

export function validateLoginForm(formData) {
  const errors = {}
  let isValid = true

  const usernameResult = validateUsername(formData?.username)
  if (!usernameResult.valid) {
    errors.username = usernameResult.message
    isValid = false
  }

  const passwordResult = validatePassword(formData?.password)
  if (!passwordResult.valid) {
    errors.password = passwordResult.message
    isValid = false
  }

  return { isValid, errors }
}

export function validateRegisterForm(formData) {
  const errors = {}
  let isValid = true

  const usernameResult = validateUsername(formData?.username)
  if (!usernameResult.valid) {
    errors.username = usernameResult.message
    isValid = false
  }

  const emailResult = validateEmail(formData?.email)
  if (!emailResult.valid) {
    errors.email = emailResult.message
    isValid = false
  }

  const passwordResult = validateStrongPassword(formData?.password)
  if (!passwordResult.valid) {
    errors.password = passwordResult.message
    isValid = false
  }

  const confirmResult = validateConfirmPassword(formData?.password, formData?.confirmPassword)
  if (!confirmResult.valid) {
    errors.confirmPassword = confirmResult.message
    isValid = false
  }

  return { isValid, errors }
}

export function validateForgotPasswordForm(formData) {
  const errors = {}
  let isValid = true

  const emailResult = validateEmail(formData?.email)
  if (!emailResult.valid) {
    errors.email = emailResult.message
    isValid = false
  }

  return { isValid, errors }
}

export function validateResetPasswordForm(formData) {
  const errors = {}
  let isValid = true

  const emailResult = validateEmail(formData?.email)
  if (!emailResult.valid) {
    errors.email = emailResult.message
    isValid = false
  }

  if (!formData?.code || typeof formData.code !== 'string' || !formData.code.trim()) {
    errors.code = '请输入验证码'
    isValid = false
  }

  const passwordResult = validateStrongPassword(formData?.password)
  if (!passwordResult.valid) {
    errors.password = passwordResult.message
    isValid = false
  }

  const confirmResult = validateConfirmPassword(formData?.password, formData?.confirmPassword)
  if (!confirmResult.valid) {
    errors.confirmPassword = confirmResult.message
    isValid = false
  }

  return { isValid, errors }
}

export function validateChangePasswordForm(formData) {
  const errors = {}
  let isValid = true

  const currentResult = validateCurrentPassword(formData?.currentPassword)
  if (!currentResult.valid) {
    errors.currentPassword = currentResult.message
    isValid = false
  }

  const newResult = validateNewPassword(formData?.newPassword)
  if (!newResult.valid) {
    errors.newPassword = newResult.message
    isValid = false
  }

  const confirmResult = validateConfirmPassword(formData?.newPassword, formData?.confirmPassword)
  if (!confirmResult.valid) {
    errors.confirmPassword = confirmResult.message
    isValid = false
  }

  return { isValid, errors }
}
