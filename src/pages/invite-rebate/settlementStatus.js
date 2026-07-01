import { SETTLEMENT_STATUS, SETTLEMENT_STATUS_LABELS, SETTLEMENT_STATUS_ICONS, SETTLEMENT_STATUS_COLORS, SETTLEMENT_RULES } from './constants.js'

export function getSettlementStatusLabel(status) {
  return SETTLEMENT_STATUS_LABELS[status] || '未知状态'
}

export function getSettlementStatusIcon(status) {
  return SETTLEMENT_STATUS_ICONS[status] || '❓'
}

export function getSettlementStatusColor(status) {
  return SETTLEMENT_STATUS_COLORS[status] || '#6b7280'
}

export function determineSettlementStatus(inviteRecord, now = new Date()) {
  if (!inviteRecord) {
    return SETTLEMENT_STATUS.PENDING
  }

  if (inviteRecord.freezeReason) {
    return SETTLEMENT_STATUS.FROZEN
  }

  if (inviteRecord.rejected) {
    return SETTLEMENT_STATUS.REJECTED
  }

  if (inviteRecord.status !== 'converted') {
    return SETTLEMENT_STATUS.PENDING
  }

  const conversionDate = inviteRecord.conversionDate || inviteRecord.updatedAt
  if (!conversionDate) {
    return SETTLEMENT_STATUS.PENDING
  }

  const conversion = new Date(conversionDate)
  const current = new Date(now)

  if (isNaN(conversion.getTime())) {
    return SETTLEMENT_STATUS.PENDING
  }

  const freezeEnd = new Date(conversion)
  freezeEnd.setDate(freezeEnd.getDate() + SETTLEMENT_RULES.FREEZE_DAYS)

  if (current < freezeEnd) {
    return SETTLEMENT_STATUS.PENDING
  }

  const cycleEnd = new Date(conversion)
  cycleEnd.setDate(cycleEnd.getDate() + SETTLEMENT_RULES.SETTLEMENT_CYCLE_DAYS)

  if (current >= freezeEnd && current < cycleEnd) {
    return SETTLEMENT_STATUS.PROCESSING
  }

  if (current >= cycleEnd) {
    return SETTLEMENT_STATUS.SETTLED
  }

  return SETTLEMENT_STATUS.PENDING
}

export function canSettleNow(status) {
  return status === SETTLEMENT_STATUS.SETTLED
}

export function isInFreezePeriod(status) {
  return status === SETTLEMENT_STATUS.PENDING
}

export function isProcessing(status) {
  return status === SETTLEMENT_STATUS.PROCESSING
}

export function hasProblem(status) {
  return status === SETTLEMENT_STATUS.FROZEN || status === SETTLEMENT_STATUS.REJECTED
}

export function calculateSettlementTimeline(inviteRecord, now = new Date()) {
  if (!inviteRecord || !inviteRecord.conversionDate) {
    return []
  }

  const conversionDate = new Date(inviteRecord.conversionDate)
  if (isNaN(conversionDate.getTime())) {
    return []
  }

  const current = new Date(now)
  const freezeEnd = new Date(conversionDate)
  freezeEnd.setDate(freezeEnd.getDate() + SETTLEMENT_RULES.FREEZE_DAYS)

  const cycleEnd = new Date(conversionDate)
  cycleEnd.setDate(cycleEnd.getDate() + SETTLEMENT_RULES.SETTLEMENT_CYCLE_DAYS)

  const timeline = [
    {
      status: SETTLEMENT_STATUS.PENDING,
      label: '转化完成',
      description: '邀请已生效，进入冻结观察期',
      date: conversionDate,
      completed: true
    },
    {
      status: SETTLEMENT_STATUS.PENDING,
      label: '冻结期结束',
      description: `${SETTLEMENT_RULES.FREEZE_DAYS}天无退款/异常，奖励可进入结算`,
      date: freezeEnd,
      completed: current >= freezeEnd
    },
    {
      status: SETTLEMENT_STATUS.PROCESSING,
      label: '结算处理中',
      description: '系统统一结算，每月处理一次',
      date: cycleEnd,
      completed: current >= cycleEnd
    },
    {
      status: SETTLEMENT_STATUS.SETTLED,
      label: '奖励到账',
      description: '奖励已发放至可提现余额',
      date: cycleEnd,
      completed: current >= cycleEnd
    }
  ]

  if (inviteRecord.freezeReason) {
    timeline.push({
      status: SETTLEMENT_STATUS.FROZEN,
      label: '奖励冻结',
      description: '存在异常，需处理后恢复',
      date: current,
      completed: true,
      isProblem: true
    })
  }

  if (inviteRecord.rejected) {
    timeline.push({
      status: SETTLEMENT_STATUS.REJECTED,
      label: '奖励驳回',
      description: inviteRecord.rejectReason || '不符合奖励条件',
      date: current,
      completed: true,
      isProblem: true
    })
  }

  return timeline
}

export function getDaysUntilSettlement(inviteRecord, now = new Date()) {
  if (!inviteRecord || !inviteRecord.conversionDate) {
    return null
  }

  const conversionDate = new Date(inviteRecord.conversionDate)
  if (isNaN(conversionDate.getTime())) {
    return null
  }

  const current = new Date(now)
  const cycleEnd = new Date(conversionDate)
  cycleEnd.setDate(cycleEnd.getDate() + SETTLEMENT_RULES.SETTLEMENT_CYCLE_DAYS)

  const diffMs = cycleEnd.getTime() - current.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

export function getSettlementStatusBadgeClass(status) {
  const baseClass = 'settlement-badge'
  const statusClasses = {
    [SETTLEMENT_STATUS.PENDING]: 'pending',
    [SETTLEMENT_STATUS.PROCESSING]: 'processing',
    [SETTLEMENT_STATUS.SETTLED]: 'settled',
    [SETTLEMENT_STATUS.FROZEN]: 'frozen',
    [SETTLEMENT_STATUS.REJECTED]: 'rejected'
  }
  return `${baseClass} ${statusClasses[status] || 'unknown'}`
}
