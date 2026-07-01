import { REWARD_RULES, SETTLEMENT_RULES } from './constants.js'

export function calculateNewUserBonus() {
  return REWARD_RULES.NEW_USER_BONUS
}

export function calculateFirstPurchaseReward(purchaseAmount) {
  if (!purchaseAmount || purchaseAmount <= 0) {
    return 0
  }

  const reward = purchaseAmount * REWARD_RULES.FIRST_PURCHASE_PERCENT
  return Math.min(reward, REWARD_RULES.FIRST_PURCHASE_MAX)
}

export function calculateRecurringPurchaseReward(purchaseAmount, monthIndex = 0) {
  if (!purchaseAmount || purchaseAmount <= 0) {
    return 0
  }

  if (monthIndex < 0 || monthIndex >= REWARD_RULES.RECURRING_MONTHS) {
    return 0
  }

  const reward = purchaseAmount * REWARD_RULES.RECURRING_PERCENT
  return Math.min(reward, REWARD_RULES.RECURRING_MAX)
}

export function calculateTierBonus(totalConvertedInvites) {
  if (!totalConvertedInvites || totalConvertedInvites <= 0) {
    return 0
  }

  let totalBonus = 0
  const tierBonus = REWARD_RULES.TIER_BONUS

  for (let i = 0; i < tierBonus.length; i++) {
    const tier = tierBonus[i]
    if (totalConvertedInvites >= tier.invites) {
      const prevTierInvites = i > 0 ? tierBonus[i - 1].invites : 0
      totalBonus = tier.bonus
      void prevTierInvites
    } else {
      break
    }
  }

  return totalBonus
}

export function calculateNextTierBonus(totalConvertedInvites) {
  if (!totalConvertedInvites || totalConvertedInvites < 0) {
    totalConvertedInvites = 0
  }

  const tierBonus = REWARD_RULES.TIER_BONUS

  for (let i = 0; i < tierBonus.length; i++) {
    const tier = tierBonus[i]
    if (totalConvertedInvites < tier.invites) {
      return {
        reached: false,
        nextTier: tier.invites,
        nextBonus: tier.bonus,
        invitesNeeded: tier.invites - totalConvertedInvites,
        progress: Math.min(100, Math.round((totalConvertedInvites / tier.invites) * 100))
      }
    }
  }

  const lastTier = tierBonus[tierBonus.length - 1]
  return {
    reached: true,
    nextTier: lastTier.invites,
    nextBonus: 0,
    invitesNeeded: 0,
    progress: 100
  }
}

export function calculateSingleInviteReward(inviteRecord) {
  if (!inviteRecord) {
    return 0
  }

  let total = 0

  total += calculateNewUserBonus()

  if (inviteRecord.firstPurchaseAmount && inviteRecord.firstPurchaseAmount > 0) {
    total += calculateFirstPurchaseReward(inviteRecord.firstPurchaseAmount)
  }

  if (inviteRecord.recurringPurchases && Array.isArray(inviteRecord.recurringPurchases)) {
    inviteRecord.recurringPurchases.forEach((purchase, index) => {
      const monthIndex = purchase.month !== undefined ? purchase.month : index
      total += calculateRecurringPurchaseReward(purchase.amount, monthIndex)
    })
  }

  return Math.round(total * 100) / 100
}

export function calculateTotalRewards(inviteRecords) {
  if (!inviteRecords || !Array.isArray(inviteRecords)) {
    return {
      totalRewards: 0,
      settledRewards: 0,
      pendingRewards: 0,
      frozenRewards: 0,
      convertedCount: 0
    }
  }

  let totalRewards = 0
  let settledRewards = 0
  let pendingRewards = 0
  let frozenRewards = 0
  let convertedCount = 0

  inviteRecords.forEach(record => {
    const reward = calculateSingleInviteReward(record)
    totalRewards += reward

    if (record.rewardStatus === 'settled') {
      settledRewards += reward
    } else if (record.rewardStatus === 'pending' || record.rewardStatus === 'processing') {
      pendingRewards += reward
    } else if (record.rewardStatus === 'frozen') {
      frozenRewards += reward
    }

    if (record.status === 'converted') {
      convertedCount++
    }
  })

  const tierBonus = calculateTierBonus(convertedCount)
  totalRewards += tierBonus

  return {
    totalRewards: Math.round(totalRewards * 100) / 100,
    settledRewards: Math.round(settledRewards * 100) / 100,
    pendingRewards: Math.round(pendingRewards * 100) / 100,
    frozenRewards: Math.round(frozenRewards * 100) / 100,
    convertedCount,
    tierBonus
  }
}

export function calculateFreezeReleaseDate(conversionDate, freezeDays = SETTLEMENT_RULES.FREEZE_DAYS) {
  if (!conversionDate) {
    return null
  }

  const date = new Date(conversionDate)
  if (isNaN(date.getTime())) {
    return null
  }

  date.setDate(date.getDate() + freezeDays)
  return date.toISOString()
}

export function calculateFreezeDaysRemaining(conversionDate, now = new Date(), freezeDays = SETTLEMENT_RULES.FREEZE_DAYS) {
  if (!conversionDate) {
    return 0
  }

  const conversion = new Date(conversionDate)
  const current = new Date(now)

  if (isNaN(conversion.getTime()) || isNaN(current.getTime())) {
    return 0
  }

  const releaseDate = new Date(conversion)
  releaseDate.setDate(releaseDate.getDate() + freezeDays)

  const diffMs = releaseDate.getTime() - current.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

export function formatCurrency(amount, currency = 'CNY') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '¥0.00'
  }

  const formatted = Number(amount).toFixed(2)
  const symbols = {
    CNY: '¥',
    USD: '$',
    EUR: '€'
  }

  return (symbols[currency] || '¥') + formatted
}
