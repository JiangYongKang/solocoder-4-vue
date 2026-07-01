import {
    FREEZE_REASON,
    FREEZE_REASON_DESCRIPTIONS,
    FREEZE_REASON_LABELS,
    FREEZE_REASON_SEVERITY,
    FREEZE_REASON_SUGGESTIONS,
    FREEZE_SEVERITY
} from './constants.js'

export function getFreezeReasonLabel(reason) {
  return FREEZE_REASON_LABELS[reason] || '未知原因'
}

export function getFreezeReasonDescription(reason) {
  return FREEZE_REASON_DESCRIPTIONS[reason] || '该奖励因未明原因被冻结，请联系客服了解详情。'
}

export function getFreezeReasonSuggestion(reason) {
  return FREEZE_REASON_SUGGESTIONS[reason] || '请联系客服进行咨询和申诉处理。'
}

export function getFreezeSeverity(reason) {
  return FREEZE_REASON_SEVERITY[reason] || FREEZE_SEVERITY.MEDIUM
}

export function getSeverityLabel(severity) {
  const labels = {
    [FREEZE_SEVERITY.LOW]: '低风险',
    [FREEZE_SEVERITY.MEDIUM]: '中风险',
    [FREEZE_SEVERITY.HIGH]: '高风险',
    [FREEZE_SEVERITY.CRITICAL]: '严重违规'
  }
  return labels[severity] || '未知风险'
}

export function getSeverityColor(severity) {
  const colors = {
    [FREEZE_SEVERITY.LOW]: '#3b82f6',
    [FREEZE_SEVERITY.MEDIUM]: '#f59e0b',
    [FREEZE_SEVERITY.HIGH]: '#ef4444',
    [FREEZE_SEVERITY.CRITICAL]: '#dc2626'
  }
  return colors[severity] || '#6b7280'
}

export function canAppeal(reason) {
  const nonAppealable = [FREEZE_REASON.SELF_INVITE, FREEZE_REASON.POLICY_VIOLATION]
  return !nonAppealable.includes(reason)
}

export function getAppealInstructions(reason) {
  if (!canAppeal(reason)) {
    return null
  }

  const instructions = {
    [FREEZE_REASON.SUSPICIOUS_ACTIVITY]: [
      '准备被邀请人的正常使用记录截图',
      '提供邀请人与被邀请人的关系证明（可选）',
      '通过客服通道提交申诉，说明情况',
      '等待3-5个工作日审核结果'
    ],
    [FREEZE_REASON.BOT_ACCOUNT]: [
      '让被邀请人完成实名认证',
      '提供被邀请人的正常消费或使用记录',
      '联系客服提交账号正常使用证明',
      '审核通过后自动解冻'
    ],
    [FREEZE_REASON.DUPLICATE_INVITE]: [
      '确认被邀请人是否确实首次使用平台',
      '如系统误判，可提供被邀请人首次注册证明',
      '联系客服核实首次邀请归属'
    ],
    [FREEZE_REASON.INVALID_CONVERSION]: [
      '准备被邀请人的有效订单截图',
      '确认订单状态非退款、非试用',
      '提供订单号和消费凭证',
      '客服核实后2-3个工作日处理'
    ],
    [FREEZE_REASON.RISK_REVIEW]: [
      '审核一般在7个工作日内自动完成',
      '如需加急，可联系客服补充说明',
      '审核结果将通过站内信通知'
    ],
    [FREEZE_REASON.REFUNDED_ORDER]: [
      '如订单未实际退款，提供订单正常完成凭证',
      '等待被邀请人产生新的有效消费',
      '新消费达标后重新计算奖励'
    ]
  }

  return instructions[reason] || [
    '请联系客服获取申诉指引',
    '准备相关证明材料',
    '按客服提示提交申诉'
  ]
}

export function getFreezeRecordDetails(record) {
  if (!record || !record.freezeReason) {
    return null
  }

  const reason = record.freezeReason
  const severity = getFreezeSeverity(reason)

  return {
    reason,
    label: getFreezeReasonLabel(reason),
    description: getFreezeReasonDescription(reason),
    suggestion: getFreezeReasonSuggestion(reason),
    severity,
    severityLabel: getSeverityLabel(severity),
    severityColor: getSeverityColor(severity),
    canAppeal: canAppeal(reason),
    appealInstructions: getAppealInstructions(reason),
    frozenAt: record.frozenAt || record.updatedAt,
    frozenAmount: record.rewardAmount || 0,
    invitee: record.inviteeName || record.inviteePhone || '未知用户'
  }
}

export function groupFreezeRecordsBySeverity(records) {
  if (!records || !Array.isArray(records)) {
    return {
      [FREEZE_SEVERITY.LOW]: [],
      [FREEZE_SEVERITY.MEDIUM]: [],
      [FREEZE_SEVERITY.HIGH]: [],
      [FREEZE_SEVERITY.CRITICAL]: []
    }
  }

  const grouped = {
    [FREEZE_SEVERITY.LOW]: [],
    [FREEZE_SEVERITY.MEDIUM]: [],
    [FREEZE_SEVERITY.HIGH]: [],
    [FREEZE_SEVERITY.CRITICAL]: []
  }

  records.forEach(record => {
    if (record.freezeReason) {
      const severity = getFreezeSeverity(record.freezeReason)
      grouped[severity].push(record)
    }
  })

  return grouped
}

export function calculateFreezeSummary(records) {
  if (!records || !Array.isArray(records)) {
    return {
      totalCount: 0,
      totalAmount: 0,
      bySeverity: {
        low: { count: 0, amount: 0 },
        medium: { count: 0, amount: 0 },
        high: { count: 0, amount: 0 },
        critical: { count: 0, amount: 0 }
      },
      appealableCount: 0,
      appealableAmount: 0
    }
  }

  const summary = {
    totalCount: 0,
    totalAmount: 0,
    bySeverity: {
      low: { count: 0, amount: 0 },
      medium: { count: 0, amount: 0 },
      high: { count: 0, amount: 0 },
      critical: { count: 0, amount: 0 }
    },
    appealableCount: 0,
    appealableAmount: 0
  }

  records.forEach(record => {
    if (record.freezeReason) {
      const severity = getFreezeSeverity(record.freezeReason)
      const amount = record.rewardAmount || 0

      summary.totalCount++
      summary.totalAmount += amount
      summary.bySeverity[severity].count++
      summary.bySeverity[severity].amount += amount

      if (canAppeal(record.freezeReason)) {
        summary.appealableCount++
        summary.appealableAmount += amount
      }
    }
  })

  summary.totalAmount = Math.round(summary.totalAmount * 100) / 100
  summary.appealableAmount = Math.round(summary.appealableAmount * 100) / 100
  Object.keys(summary.bySeverity).forEach(key => {
    summary.bySeverity[key].amount = Math.round(summary.bySeverity[key].amount * 100) / 100
  })

  return summary
}

export const FREEZE_REASON_LIST = Object.values(FREEZE_REASON)
