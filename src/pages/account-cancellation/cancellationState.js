import { CANCELLATION_STATUS, COOLING_PERIOD_DAYS } from './constants.js'
import {
  checkStatusFromTime,
  calculateCoolingPeriodEnd
} from './coolingPeriod.js'

const VALID_TRANSITIONS = {
  [CANCELLATION_STATUS.NOT_APPLIED]: [CANCELLATION_STATUS.COOLING_PERIOD],
  [CANCELLATION_STATUS.COOLING_PERIOD]: [CANCELLATION_STATUS.REVOKED, CANCELLATION_STATUS.COMPLETED],
  [CANCELLATION_STATUS.REVOKED]: [CANCELLATION_STATUS.COOLING_PERIOD],
  [CANCELLATION_STATUS.COMPLETED]: []
}

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
    ...payload
  }
}

export function submitCancellation(currentStatus, identityVerified = false, submittedAt = new Date().toISOString()) {
  if (currentStatus !== CANCELLATION_STATUS.NOT_APPLIED && currentStatus !== CANCELLATION_STATUS.REVOKED) {
    return {
      success: false,
      newStatus: currentStatus,
      error: '当前状态无法提交注销申请'
    }
  }

  if (!identityVerified) {
    return {
      success: false,
      newStatus: currentStatus,
      error: '请先完成身份验证'
    }
  }

  const coolingEndAt = calculateCoolingPeriodEnd(submittedAt, COOLING_PERIOD_DAYS)

  return transitionStatus(currentStatus, CANCELLATION_STATUS.COOLING_PERIOD, {
    submittedAt,
    coolingEndAt,
    identityVerified: true
  })
}

export function revokeCancellation(currentStatus, submittedAt, revokedAt = new Date().toISOString()) {
  if (currentStatus !== CANCELLATION_STATUS.COOLING_PERIOD) {
    return {
      success: false,
      newStatus: currentStatus,
      error: '仅冷静期中的申请可以撤销'
    }
  }

  return transitionStatus(currentStatus, CANCELLATION_STATUS.REVOKED, {
    revokedAt,
    originalSubmittedAt: submittedAt
  })
}

export function completeCancellation(currentStatus, submittedAt, completedAt = new Date().toISOString(), coolingDays = COOLING_PERIOD_DAYS) {
  if (currentStatus !== CANCELLATION_STATUS.COOLING_PERIOD) {
    return {
      success: false,
      newStatus: currentStatus,
      error: '仅冷静期中的申请可以完成注销'
    }
  }

  const coolingEndAt = calculateCoolingPeriodEnd(submittedAt, coolingDays)
  if (new Date(completedAt).getTime() < new Date(coolingEndAt).getTime()) {
    return {
      success: false,
      newStatus: currentStatus,
      error: '冷静期尚未结束，无法完成注销'
    }
  }

  return transitionStatus(currentStatus, CANCELLATION_STATUS.COMPLETED, {
    completedAt,
    originalSubmittedAt: submittedAt
  })
}

export function canSubmitCancellation(status) {
  return status === CANCELLATION_STATUS.NOT_APPLIED || status === CANCELLATION_STATUS.REVOKED
}

export function canRevokeCancellation(status) {
  return status === CANCELLATION_STATUS.COOLING_PERIOD
}

export function canViewProgress(status) {
  return status === CANCELLATION_STATUS.COOLING_PERIOD ||
    status === CANCELLATION_STATUS.REVOKED ||
    status === CANCELLATION_STATUS.COMPLETED
}

export function isTerminalStatus(status) {
  return status === CANCELLATION_STATUS.COMPLETED
}

export function getStatusDescription(status, payload = {}) {
  const descriptions = {
    [CANCELLATION_STATUS.NOT_APPLIED]: '注销账号将导致数据永久清除，请仔细阅读影响说明后再操作',
    [CANCELLATION_STATUS.COOLING_PERIOD]: `注销申请已提交，冷静期为 ${COOLING_PERIOD_DAYS} 天，期间可随时撤销申请`,
    [CANCELLATION_STATUS.REVOKED]: '您已撤销注销申请，账号已恢复正常使用',
    [CANCELLATION_STATUS.COMPLETED]: '账号已注销完成，相关数据已按规则清除'
  }

  return descriptions[status] || ''
}

export function getStatusIcon(status) {
  const icons = {
    [CANCELLATION_STATUS.NOT_APPLIED]: '⚠️',
    [CANCELLATION_STATUS.COOLING_PERIOD]: '⏳',
    [CANCELLATION_STATUS.REVOKED]: '↩️',
    [CANCELLATION_STATUS.COMPLETED]: '✅'
  }
  return icons[status] || '📄'
}

export function getStatusColor(status) {
  const colors = {
    [CANCELLATION_STATUS.NOT_APPLIED]: '#ef4444',
    [CANCELLATION_STATUS.COOLING_PERIOD]: '#f59e0b',
    [CANCELLATION_STATUS.REVOKED]: '#3b82f6',
    [CANCELLATION_STATUS.COMPLETED]: '#10b981'
  }
  return colors[status] || '#6b7280'
}

export function computeActualStatus(submittedAt, revokedAt, currentTime = new Date().toISOString(), coolingDays = COOLING_PERIOD_DAYS) {
  return checkStatusFromTime(submittedAt, revokedAt, currentTime, coolingDays)
}

export function getCancellationSummary(submittedAt, revokedAt, completedAt, coolingDays = COOLING_PERIOD_DAYS) {
  const status = computeActualStatus(submittedAt, revokedAt, new Date().toISOString(), coolingDays)

  const events = []

  if (submittedAt) {
    events.push({ type: 'submit', time: submittedAt, label: '提交注销申请' })
  }

  if (revokedAt) {
    events.push({ type: 'revoke', time: revokedAt, label: '撤销注销申请' })
  }

  if (status === CANCELLATION_STATUS.COMPLETED) {
    const actualCompletedAt = completedAt || calculateCoolingPeriodEnd(submittedAt, coolingDays)
    events.push({ type: 'complete', time: actualCompletedAt, label: '注销完成' })
  }

  return {
    status,
    events,
    coolingEndAt: submittedAt ? calculateCoolingPeriodEnd(submittedAt, coolingDays) : null
  }
}

export function getRevokeReasons() {
  return [
    { id: 'change_mind', label: '改变主意，不想注销了' },
    { id: 'data_concern', label: '担心数据丢失' },
    { id: 'asset_unused', label: '账户还有资产未处理' },
    { id: 'need_account', label: '仍需使用账号功能' },
    { id: 'other', label: '其他原因' }
  ]
}

export function canReapplyAfterRevoke(revokedAt, cooldownHours = 0, currentTime = new Date().toISOString()) {
  if (!revokedAt) return { allowed: true, remainingSeconds: 0 }

  const revokeTime = new Date(revokedAt)
  const now = new Date(currentTime)

  if (isNaN(revokeTime.getTime()) || isNaN(now.getTime())) {
    return { allowed: true, remainingSeconds: 0 }
  }

  const availableTime = new Date(revokeTime.getTime() + cooldownHours * 60 * 60 * 1000)
  const remainingMs = availableTime.getTime() - now.getTime()

  if (remainingMs <= 0) {
    return { allowed: true, remainingSeconds: 0 }
  }

  return {
    allowed: false,
    remainingSeconds: Math.ceil(remainingMs / 1000)
  }
}
