import { VERIFICATION_STATUS } from './constants.js'

const VALID_TRANSITIONS = {
  [VERIFICATION_STATUS.NOT_SUBMITTED]: [VERIFICATION_STATUS.PENDING],
  [VERIFICATION_STATUS.PENDING]: [VERIFICATION_STATUS.APPROVED, VERIFICATION_STATUS.REJECTED],
  [VERIFICATION_STATUS.APPROVED]: [],
  [VERIFICATION_STATUS.REJECTED]: [VERIFICATION_STATUS.PENDING]
}

const REJECT_REASONS = [
  '证件照片模糊，请重新上传清晰的照片',
  '证件信息填写有误，请核对后重新提交',
  '证件类型与上传照片不匹配',
  '证件已过期，请使用有效期内的证件',
  '人脸照片与证件照片不符，请重新拍摄',
  '提交材料不完整，请补充完整后重新提交'
]

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

export function submitForReview(currentStatus) {
  return transitionStatus(currentStatus, VERIFICATION_STATUS.PENDING, {
    submittedAt: new Date().toISOString()
  })
}

export function approveVerification(currentStatus) {
  return transitionStatus(currentStatus, VERIFICATION_STATUS.APPROVED, {
    approvedAt: new Date().toISOString()
  })
}

export function rejectVerification(currentStatus, reason) {
  const rejectReason = reason || generateRandomRejectReason()
  return transitionStatus(currentStatus, VERIFICATION_STATUS.REJECTED, {
    rejectedAt: new Date().toISOString(),
    rejectReason
  })
}

export function resubmitForReview(currentStatus, currentResubmitCount = 0) {
  if (currentStatus !== VERIFICATION_STATUS.REJECTED) {
    return {
      success: false,
      newStatus: currentStatus,
      error: '只有已失败状态才能重新提交'
    }
  }

  return transitionStatus(currentStatus, VERIFICATION_STATUS.PENDING, {
    resubmittedAt: new Date().toISOString(),
    resubmitCount: currentResubmitCount + 1
  })
}

export function generateRandomRejectReason() {
  const randomIndex = Math.floor(Math.random() * REJECT_REASONS.length)
  return REJECT_REASONS[randomIndex]
}

export function isEditable(status) {
  return status === VERIFICATION_STATUS.NOT_SUBMITTED || status === VERIFICATION_STATUS.REJECTED
}

export function isViewOnly(status) {
  return status === VERIFICATION_STATUS.PENDING || status === VERIFICATION_STATUS.APPROVED
}

export function canResubmit(status) {
  return status === VERIFICATION_STATUS.REJECTED
}

export function canSubmit(status) {
  return status === VERIFICATION_STATUS.NOT_SUBMITTED || status === VERIFICATION_STATUS.REJECTED
}

export function getStatusDescription(status) {
  const descriptions = {
    [VERIFICATION_STATUS.NOT_SUBMITTED]: '请上传并填写您的证件信息完成实名认证',
    [VERIFICATION_STATUS.PENDING]: '您的认证申请正在审核中，请耐心等待',
    [VERIFICATION_STATUS.APPROVED]: '恭喜您，实名认证已通过',
    [VERIFICATION_STATUS.REJECTED]: '实名认证未通过，请根据失败原因修正后重新提交'
  }
  return descriptions[status] || ''
}

export function getStatusIcon(status) {
  const icons = {
    [VERIFICATION_STATUS.NOT_SUBMITTED]: '📝',
    [VERIFICATION_STATUS.PENDING]: '⏳',
    [VERIFICATION_STATUS.APPROVED]: '✅',
    [VERIFICATION_STATUS.REJECTED]: '❌'
  }
  return icons[status] || '📄'
}

export function getStatusColor(status) {
  const colors = {
    [VERIFICATION_STATUS.NOT_SUBMITTED]: '#6b7280',
    [VERIFICATION_STATUS.PENDING]: '#f59e0b',
    [VERIFICATION_STATUS.APPROVED]: '#10b981',
    [VERIFICATION_STATUS.REJECTED]: '#ef4444'
  }
  return colors[status] || '#6b7280'
}
