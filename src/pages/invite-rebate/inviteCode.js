import { INVITE_CODE, DEFAULT_BASE_URL } from './constants.js'

export function generateInviteCode(length = 8) {
  const safeLength = Math.max(
    INVITE_CODE.MIN_LENGTH,
    Math.min(INVITE_CODE.MAX_LENGTH, length)
  )
  const prefix = INVITE_CODE.PREFIX
  const remainingLength = Math.max(0, safeLength - prefix.length)
  const charset = INVITE_CODE.CHARSET
  let result = ''

  for (let i = 0; i < remainingLength; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    result += charset[randomIndex]
  }

  return prefix + result
}

export function validateInviteCode(code) {
  if (!code || typeof code !== 'string') {
    return {
      valid: false,
      reason: 'empty'
    }
  }

  const trimmedCode = code.trim().toUpperCase()

  if (trimmedCode.length < INVITE_CODE.MIN_LENGTH) {
    return {
      valid: false,
      reason: 'too_short'
    }
  }

  if (trimmedCode.length > INVITE_CODE.MAX_LENGTH) {
    return {
      valid: false,
      reason: 'too_long'
    }
  }

  if (!INVITE_CODE.PATTERN.test(trimmedCode)) {
    return {
      valid: false,
      reason: 'invalid_chars'
    }
  }

  if (!trimmedCode.startsWith(INVITE_CODE.PREFIX)) {
    return {
      valid: false,
      reason: 'invalid_prefix'
    }
  }

  return {
    valid: true,
    reason: null,
    normalizedCode: trimmedCode
  }
}

export function normalizeInviteCode(code) {
  if (!code || typeof code !== 'string') {
    return ''
  }
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function generateInviteLink(code, baseUrl = DEFAULT_BASE_URL, params = {}) {
  const validation = validateInviteCode(code)
  if (!validation.valid) {
    return null
  }

  const normalizedCode = validation.normalizedCode
  const url = new URL(baseUrl)
  url.searchParams.set('invite_code', normalizedCode)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

export function parseInviteLink(link) {
  if (!link || typeof link !== 'string') {
    return null
  }

  try {
    const url = new URL(link)
    const code = url.searchParams.get('invite_code')

    if (!code) {
      return null
    }

    const validation = validateInviteCode(code)
    if (!validation.valid) {
      return null
    }

    const params = {}
    url.searchParams.forEach((value, key) => {
      if (key !== 'invite_code') {
        params[key] = value
      }
    })

    return {
      code: validation.normalizedCode,
      baseUrl: `${url.protocol}//${url.host}${url.pathname}`,
      params
    }
  } catch {
    return null
  }
}

export function maskInviteCode(code, visibleStart = 3, visibleEnd = 2) {
  const validation = validateInviteCode(code)
  if (!validation.valid) {
    return code || ''
  }

  const normalizedCode = validation.normalizedCode
  const totalLength = normalizedCode.length
  const maskLength = totalLength - visibleStart - visibleEnd

  if (maskLength <= 1) {
    return normalizedCode
  }

  const start = normalizedCode.slice(0, visibleStart)
  const end = normalizedCode.slice(-visibleEnd)
  const mask = '*'.repeat(maskLength)

  return start + mask + end
}

export function formatInviteCode(code, separator = '-', every = 4) {
  const validation = validateInviteCode(code)
  if (!validation.valid) {
    return code || ''
  }

  const normalizedCode = validation.normalizedCode
  const chunks = []

  for (let i = 0; i < normalizedCode.length; i += every) {
    chunks.push(normalizedCode.slice(i, i + every))
  }

  return chunks.join(separator)
}
