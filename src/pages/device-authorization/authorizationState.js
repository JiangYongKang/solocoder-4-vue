import {
  DEVICE_AUTH_STATUS,
  STATUS_DESCRIPTIONS,
  STATUS_ICONS,
  STATUS_COLORS,
  RISK_LEVELS,
  DEFAULT_QR_TIMEOUT
} from './constants.js'

const PENDING_SCAN = DEVICE_AUTH_STATUS.PENDING_SCAN
const SCANNED_PENDING = DEVICE_AUTH_STATUS.SCANNED_PENDING
const AUTHORIZED = DEVICE_AUTH_STATUS.AUTHORIZED
const REJECTED = DEVICE_AUTH_STATUS.REJECTED
const TIMEOUT = DEVICE_AUTH_STATUS.TIMEOUT
const RISK = DEVICE_AUTH_STATUS.RISK

const VALID_TRANSITIONS = {
  [PENDING_SCAN]: [SCANNED_PENDING, TIMEOUT, RISK],
  [SCANNED_PENDING]: [AUTHORIZED, REJECTED, TIMEOUT, RISK],
  [RISK]: [AUTHORIZED, REJECTED, TIMEOUT],
  [AUTHORIZED]: [],
  [REJECTED]: [],
  [TIMEOUT]: [PENDING_SCAN]
}

const TERMINAL_STATUSES = [AUTHORIZED, REJECTED, TIMEOUT]

export function canTransition(currentStatus, targetStatus) {
  const validTargets = VALID_TRANSITIONS[currentStatus]
  return validTargets ? validTargets.includes(targetStatus) : false
}

export function getNextPossibleTransitions(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || []
}

export function transitionStatus(currentStatus, targetStatus, payload = {}) {
  if (!canTransition(currentStatus, targetStatus)) {
    return {
      success: false,
      newStatus: currentStatus,
      error: `无法从状态 ${currentStatus} 转换到 ${targetStatus}`
    }
  }

  return {
    success: true,
    newStatus: targetStatus,
    error: null,
    transitionedAt: new Date().toISOString(),
    ...payload
  }
}

export function isTerminalStatus(status) {
  return TERMINAL_STATUSES.includes(status)
}

export function canConfirm(status) {
  return status === SCANNED_PENDING || status === RISK
}

export function canReject(status) {
  return status === SCANNED_PENDING || status === RISK
}

export function canRefresh(status) {
  return status === TIMEOUT || status === PENDING_SCAN
}

export function markAsScanned(currentStatus, deviceInfo = {}) {
  if (currentStatus === RISK) {
    return {
      success: true,
      newStatus: RISK,
      error: null,
      transitionedAt: new Date().toISOString(),
      deviceInfo
    }
  }
  return transitionStatus(currentStatus, SCANNED_PENDING, { deviceInfo })
}

export function confirmAuthorization(currentStatus, options = {}) {
  const { hasConfirmed = false } = options

  if (hasConfirmed) {
    return {
      success: false,
      newStatus: currentStatus,
      error: '请勿重复提交，操作已执行'
    }
  }

  const result = transitionStatus(currentStatus, AUTHORIZED)
  if (result.success) {
    return {
      ...result,
      confirmedAt: result.transitionedAt
    }
  }
  return result
}

export function rejectAuthorization(currentStatus, options = {}) {
  const { hasConfirmed = false, rejectReason = '用户拒绝授权' } = options

  if (hasConfirmed) {
    return {
      success: false,
      newStatus: currentStatus,
      error: '请勿重复提交，操作已执行'
    }
  }

  const result = transitionStatus(currentStatus, REJECTED)
  if (result.success) {
    return {
      ...result,
      rejectedAt: result.transitionedAt,
      rejectReason
    }
  }
  return result
}

export function markAsTimeout(currentStatus) {
  if (isTerminalStatus(currentStatus)) {
    return {
      success: false,
      newStatus: currentStatus,
      error: '当前状态已结束，无需标记超时'
    }
  }
  return transitionStatus(currentStatus, TIMEOUT)
}

export function markAsRisk(currentStatus, riskData = {}) {
  return transitionStatus(currentStatus, RISK, { riskData, markedAsRiskAt: new Date().toISOString() })
}

export function refreshAuthorization(currentStatus) {
  if (currentStatus === PENDING_SCAN) {
    return {
      success: true,
      newStatus: PENDING_SCAN,
      error: null,
      transitionedAt: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      newRequestId: generateRequestId()
    }
  }
  const result = transitionStatus(currentStatus, PENDING_SCAN)
  if (result.success) {
    return {
      ...result,
      refreshedAt: result.transitionedAt,
      newRequestId: generateRequestId()
    }
  }
  return result
}

export function generateRequestId() {
  return 'AUTH_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function createCountdownManager(initialSeconds = DEFAULT_QR_TIMEOUT, onTimeout = null) {
  let remaining = initialSeconds
  let intervalId = null
  let isRunning = false
  let timeoutCallback = onTimeout

  return {
    getRemaining() {
      return remaining
    },

    isRunning() {
      return isRunning
    },

    isExpired() {
      return remaining <= 0
    },

    getFormattedTime() {
      const mins = Math.floor(Math.max(0, remaining) / 60)
      const secs = Math.max(0, remaining) % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },

    setCallback(cb) {
      timeoutCallback = cb
    },

    start(tickCallback) {
      if (isRunning) return
      if (remaining <= 0) remaining = initialSeconds

      isRunning = true
      intervalId = setInterval(() => {
        remaining -= 1
        if (tickCallback) tickCallback(remaining)

        if (remaining <= 0) {
          this.stop()
          if (timeoutCallback) timeoutCallback()
        }
      }, 1000)
    },

    stop() {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
      isRunning = false
    },

    reset(newInitialSeconds) {
      this.stop()
      remaining = newInitialSeconds != null ? newInitialSeconds : initialSeconds
    },

    extend(seconds) {
      remaining += seconds
    }
  }
}

export function getRiskLevelColor(level) {
  const colors = {
    [RISK_LEVELS.LOW]: '#10b981',
    [RISK_LEVELS.MEDIUM]: '#f59e0b',
    [RISK_LEVELS.HIGH]: '#dc2626'
  }
  return colors[level] || '#6b7280'
}

export function shouldShowRiskWarning(status) {
  return status === RISK
}

export function getHighRiskAdvice(riskLevel) {
  const advices = {
    [RISK_LEVELS.LOW]: [
      '请确认是否是您本人或您信任的设备发起的登录请求'
    ],
    [RISK_LEVELS.MEDIUM]: [
      '登录地点与常用地点有差异，请确认是否您本人操作',
      '如非本人操作，请立即拒绝并修改密码'
    ],
    [RISK_LEVELS.HIGH]: [
      '⚠️ 高风险：检测到该设备存在多项异常特征',
      '强烈建议您直接拒绝此登录请求',
      '如怀疑账号被盗，请立即修改密码并联系客服',
      '请勿在任何情况下向他人透露验证码'
    ]
  }
  return advices[riskLevel] || advices[RISK_LEVELS.MEDIUM]
}

export function getStatusDescription(status) {
  return STATUS_DESCRIPTIONS[status] || ''
}

export function getStatusIcon(status) {
  return STATUS_ICONS[status] || '📄'
}

export function getStatusColor(status) {
  return STATUS_COLORS[status] || '#6b7280'
}

export function hasDeviceInfo(status) {
  return status === SCANNED_PENDING || status === RISK || status === AUTHORIZED || status === REJECTED
}
