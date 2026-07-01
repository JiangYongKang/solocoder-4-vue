export const VERIFICATION_BENEFITS = [
  {
    id: 'unlock_transaction',
    icon: '💰',
    title: '解锁交易功能',
    description: '完成认证后可进行充值、提现、转账等资金操作',
    unlocked: true
  },
  {
    id: 'increase_limit',
    icon: '📈',
    title: '提升交易限额',
    description: '单笔和单日交易限额大幅提升，满足大额需求',
    unlocked: true
  },
  {
    id: 'security_protection',
    icon: '🛡️',
    title: '账户安全保障',
    description: '实名认证用户享受更高等级的账户安全保护',
    unlocked: true
  },
  {
    id: 'priority_service',
    icon: '🎯',
    title: '优先客服服务',
    description: '问题反馈优先处理，享受专属客服通道',
    unlocked: true
  },
  {
    id: 'feature_access',
    icon: '🔓',
    title: '完整功能使用',
    description: '解锁平台所有功能，包括高风险操作权限',
    unlocked: true
  },
  {
    id: 'activity_participation',
    icon: '🎁',
    title: '专属活动参与',
    description: '可参与实名认证用户专属的优惠活动',
    unlocked: true
  }
]

export const UNVERIFIED_RESTRICTIONS = [
  {
    id: 'no_transaction',
    icon: '🚫',
    title: '无法进行交易',
    description: '未认证用户无法使用充值、提现、转账功能'
  },
  {
    id: 'limited_features',
    icon: '🔒',
    title: '功能受限',
    description: '部分高风险功能将无法使用'
  },
  {
    id: 'low_limit',
    icon: '📉',
    title: '交易限额低',
    description: '即使开放部分功能，交易限额也会非常低'
  }
]

export function getBenefitsByStatus(status) {
  const isApproved = status === 'approved'

  return VERIFICATION_BENEFITS.map(benefit => ({
    ...benefit,
    unlocked: isApproved || benefit.unlocked
  }))
}

export function getRestrictionsByStatus(status) {
  if (status === 'approved') {
    return []
  }
  return UNVERIFIED_RESTRICTIONS
}

export function formatBenefitList(status) {
  const benefits = getBenefitsByStatus(status)
  const unlockedBenefits = benefits.filter(b => b.unlocked)
  const lockedBenefits = benefits.filter(b => !b.unlocked)

  return {
    unlocked: unlockedBenefits,
    locked: lockedBenefits,
    total: benefits.length,
    unlockedCount: unlockedBenefits.length
  }
}
