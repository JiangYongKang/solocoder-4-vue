import { BENEFIT_STATUS, MAX_LEVEL, CLAIM_COOLDOWN_HOURS } from './constants.js'

export function getBenefitStatus(benefit, currentLevel, now = new Date()) {
  if (!benefit) {
    return BENEFIT_STATUS.LOCKED
  }

  const requiredLevel = benefit.requiredLevel || 1

  if (currentLevel < requiredLevel) {
    return BENEFIT_STATUS.LOCKED
  }

  if (benefit.expiresAt && new Date(benefit.expiresAt) < now) {
    return BENEFIT_STATUS.EXPIRED
  }

  if (benefit.claimedAt) {
    return BENEFIT_STATUS.CLAIMED
  }

  const claimableFrom = benefit.claimableFrom ? new Date(benefit.claimableFrom) : null
  if (claimableFrom && claimableFrom > now) {
    return BENEFIT_STATUS.UNLOCKED
  }

  return BENEFIT_STATUS.CLAIMABLE
}

export function canClaimBenefit(benefit, currentLevel, lastClaimTime = null, now = new Date()) {
  if (benefit?.isOneTime && benefit?.claimedAt) {
    return { canClaim: false, reason: '该权益只能领取一次' }
  }

  const status = getBenefitStatus(benefit, currentLevel, now)

  if (status !== BENEFIT_STATUS.CLAIMABLE) {
    return { canClaim: false, reason: getCannotClaimReason(status, benefit, currentLevel, now) }
  }

  if (lastClaimTime && benefit.cooldownHours) {
    const cooldownMs = benefit.cooldownHours * 60 * 60 * 1000
    const timeSinceLastClaim = now.getTime() - new Date(lastClaimTime).getTime()

    if (timeSinceLastClaim < cooldownMs) {
      const remainingMs = cooldownMs - timeSinceLastClaim
      return {
        canClaim: false,
        reason: '领取冷却中',
        remainingCooldown: remainingMs
      }
    }
  }

  return { canClaim: true, reason: null }
}

export function getCannotClaimReason(status, benefit, currentLevel, now = new Date()) {
  switch (status) {
    case BENEFIT_STATUS.LOCKED:
      const requiredLevel = benefit?.requiredLevel || 1
      return `等级 ${requiredLevel} 解锁`
    case BENEFIT_STATUS.EXPIRED:
      return '已过期'
    case BENEFIT_STATUS.CLAIMED:
      return '已领取'
    case BENEFIT_STATUS.UNLOCKED:
      if (benefit?.claimableFrom) {
        const claimableFrom = new Date(benefit.claimableFrom)
        const diff = claimableFrom - now
        const hours = Math.ceil(diff / (1000 * 60 * 60))
        return `${hours}小时后可领取`
      }
      return '暂不可领取'
    default:
      return '无法领取'
  }
}

export function getBenefitStatusColor(status) {
  const colors = {
    [BENEFIT_STATUS.UNLOCKED]: '#10b981',
    [BENEFIT_STATUS.LOCKED]: '#9ca3af',
    [BENEFIT_STATUS.CLAIMABLE]: '#3b82f6',
    [BENEFIT_STATUS.CLAIMED]: '#6b7280',
    [BENEFIT_STATUS.EXPIRED]: '#ef4444'
  }
  return colors[status] || '#9ca3af'
}

export function getBenefitStatusIcon(status) {
  const icons = {
    [BENEFIT_STATUS.UNLOCKED]: '🔓',
    [BENEFIT_STATUS.LOCKED]: '🔒',
    [BENEFIT_STATUS.CLAIMABLE]: '🎁',
    [BENEFIT_STATUS.CLAIMED]: '✅',
    [BENEFIT_STATUS.EXPIRED]: '⏰'
  }
  return icons[status] || '❓'
}

export function filterBenefitsByStatus(benefits, status, currentLevel, now = new Date()) {
  if (!benefits) return []
  return benefits.filter(benefit => getBenefitStatus(benefit, currentLevel, now) === status)
}

export function getBenefitsByLevel(benefits, currentLevel, now = new Date()) {
  if (!benefits) {
    return {
      unlocked: [],
      locked: [],
      claimable: [],
      claimed: [],
      expired: []
    }
  }

  const result = {
    unlocked: [],
    locked: [],
    claimable: [],
    claimed: [],
    expired: []
  }

  benefits.forEach(benefit => {
    const status = getBenefitStatus(benefit, currentLevel, now)

    switch (status) {
      case BENEFIT_STATUS.CLAIMABLE:
        result.claimable.push(benefit)
        result.unlocked.push(benefit)
        break
      case BENEFIT_STATUS.CLAIMED:
        result.claimed.push(benefit)
        result.unlocked.push(benefit)
        break
      case BENEFIT_STATUS.EXPIRED:
        result.expired.push(benefit)
        result.unlocked.push(benefit)
        break
      case BENEFIT_STATUS.UNLOCKED:
        result.unlocked.push(benefit)
        break
      case BENEFIT_STATUS.LOCKED:
      default:
        result.locked.push(benefit)
        break
    }
  })

  return result
}

export function sortBenefitsByPriority(benefits, currentLevel, now = new Date()) {
  if (!benefits) return []

  const statusPriority = {
    [BENEFIT_STATUS.CLAIMABLE]: 0,
    [BENEFIT_STATUS.UNLOCKED]: 1,
    [BENEFIT_STATUS.CLAIMED]: 2,
    [BENEFIT_STATUS.EXPIRED]: 3,
    [BENEFIT_STATUS.LOCKED]: 4
  }

  return [...benefits].sort((a, b) => {
    const statusA = getBenefitStatus(a, currentLevel, now)
    const statusB = getBenefitStatus(b, currentLevel, now)

    const statusDiff = statusPriority[statusA] - statusPriority[statusB]
    if (statusDiff !== 0) return statusDiff

    if (a.expiresAt && b.expiresAt) {
      return new Date(a.expiresAt) - new Date(b.expiresAt)
    }
    if (a.expiresAt) return -1
    if (b.expiresAt) return 1

    return (a.requiredLevel || 1) - (b.requiredLevel || 1)
  })
}

export function checkExpiringBenefits(benefits, currentLevel, hours = 24, now = new Date()) {
  if (!benefits) return []

  const threshold = now.getTime() + hours * 60 * 60 * 1000

  return benefits.filter(benefit => {
    const status = getBenefitStatus(benefit, currentLevel, now)
    if (status !== BENEFIT_STATUS.CLAIMABLE && status !== BENEFIT_STATUS.UNLOCKED) {
      return false
    }
    if (!benefit.expiresAt) return false

    const expiresAt = new Date(benefit.expiresAt).getTime()
    return expiresAt > now.getTime() && expiresAt <= threshold
  })
}

export function claimBenefit(benefit, currentLevel, lastClaimTime = null, now = new Date()) {
  const { canClaim, reason, remainingCooldown } = canClaimBenefit(benefit, currentLevel, lastClaimTime, now)

  if (!canClaim) {
    return {
      success: false,
      reason,
      remainingCooldown,
      benefit
    }
  }

  const claimedBenefit = {
    ...benefit,
    claimedAt: now.toISOString(),
    lastClaimedAt: now.toISOString()
  }

  return {
    success: true,
    reason: null,
    benefit: claimedBenefit,
    claimedAt: now
  }
}

export function calculateBenefitStats(benefits, currentLevel, now = new Date()) {
  const categorized = getBenefitsByLevel(benefits, currentLevel, now)

  return {
    total: benefits?.length || 0,
    unlocked: categorized.unlocked.length,
    locked: categorized.locked.length,
    claimable: categorized.claimable.length,
    claimed: categorized.claimed.length,
    expired: categorized.expired.length,
    unlockProgress: benefits?.length > 0
      ? Math.round((categorized.unlocked.length / benefits.length) * 100)
      : 0
  }
}

export function formatCooldownRemaining(ms) {
  if (ms <= 0) return '可领取'

  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}小时${minutes}分钟后可领取`
  }

  return `${minutes}分钟后可领取`
}
