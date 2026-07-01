import { MAX_LEVEL, LEVEL_EXP_REQUIREMENTS } from './constants.js'
import { getExpToNextLevel, getLevelByExp, getExpForLevel as getLevelExp } from './levelCalculator.js'

export function calculateDailyExpRate(expRecords, days = 7) {
  if (!expRecords || expRecords.length === 0) {
    return 0
  }

  const now = Date.now()
  const cutoffTime = now - days * 24 * 60 * 60 * 1000

  const recentRecords = expRecords.filter(record => {
    const recordTime = record.timestamp || record.createdAt || 0
    return recordTime >= cutoffTime && record.exp > 0
  })

  if (recentRecords.length === 0) {
    return 0
  }

  const totalExp = recentRecords.reduce((sum, r) => sum + r.exp, 0)
  return Math.round(totalExp / days)
}

export function estimateDaysToUpgrade(currentExp, dailyExpRate) {
  const expToNext = getExpToNextLevel(currentExp)
  const currentLevel = getLevelByExp(currentExp)

  if (currentLevel >= MAX_LEVEL) {
    return { days: 0, isMaxLevel: true, canEstimate: false }
  }

  if (expToNext <= 0) {
    return { days: 0, isMaxLevel: false, canEstimate: true }
  }

  if (dailyExpRate <= 0) {
    return { days: Infinity, isMaxLevel: false, canEstimate: false }
  }

  if (dailyExpRate >= expToNext) {
    return { days: 0, isMaxLevel: false, canEstimate: true }
  }

  const days = Math.ceil(expToNext / dailyExpRate)
  return { days, isMaxLevel: false, canEstimate: true }
}

export function estimateUpgradeDate(currentExp, dailyExpRate, fromDate = new Date()) {
  const { days, canEstimate, isMaxLevel } = estimateDaysToUpgrade(currentExp, dailyExpRate)

  if (!canEstimate || isMaxLevel) {
    return { date: null, canEstimate, isMaxLevel }
  }

  const targetDate = new Date(fromDate)
  targetDate.setDate(targetDate.getDate() + days)

  return { date: targetDate, canEstimate, isMaxLevel }
}

export function calculateUpgradeEstimate(currentExp, expRecords, dailyCap = null) {
  const dailyExpRate = calculateDailyExpRate(expRecords)
  const daysEstimate = estimateDaysToUpgrade(currentExp, dailyExpRate)
  const dateEstimate = estimateUpgradeDate(currentExp, dailyExpRate)
  const expToNext = getExpToNextLevel(currentExp)
  const currentLevel = getLevelByExp(currentExp)

  let adjustedDailyRate = dailyExpRate
  if (dailyCap !== null && dailyCap > 0 && dailyExpRate > dailyCap) {
    adjustedDailyRate = dailyCap
  }

  const milestones = calculateUpgradeMilestones(currentExp, adjustedDailyRate)

  return {
    currentLevel,
    currentExp,
    expToNext,
    dailyExpRate,
    adjustedDailyRate,
    daysToUpgrade: daysEstimate,
    estimatedDate: dateEstimate,
    milestones,
    isMaxLevel: currentLevel >= MAX_LEVEL
  }
}

export function calculateUpgradeMilestones(currentExp, dailyExpRate, fromDate = new Date()) {
  if (dailyExpRate <= 0) {
    return []
  }

  const milestones = []
  const currentLevel = getLevelByExp(currentExp)

  for (let level = currentLevel + 1; level <= MAX_LEVEL; level++) {
    const levelExpRequirement = getExpForLevel(level)
    const expNeeded = levelExpRequirement - currentExp

    if (expNeeded <= 0) {
      continue
    }

    const daysToReach = Math.ceil(expNeeded / dailyExpRate)
    const targetDate = new Date(fromDate)
    targetDate.setDate(targetDate.getDate() + daysToReach)

    milestones.push({
      level,
      expNeeded,
      daysToReach,
      estimatedDate: targetDate
    })
  }

  return milestones
}

export function formatUpgradeEstimate(estimate) {
  if (estimate.isMaxLevel) {
    return '已达最高等级'
  }

  if (!estimate.daysToUpgrade.canEstimate) {
    return '暂无足够数据预估升级时间'
  }

  const days = estimate.daysToUpgrade.days

  if (days === 0) {
    return '即将升级'
  }

  if (days === 1) {
    return '预计 1 天后升级'
  }

  if (days < 30) {
    return `预计 ${days} 天后升级`
  }

  if (days < 365) {
    const months = Math.round(days / 30)
    return `预计约 ${months} 个月后升级`
  }

  const years = (days / 365).toFixed(1)
  return `预计约 ${years} 年后升级`
}

export function getExpEfficiencyTip(currentExp, dailyExpRate, dailyCap) {
  const tips = []

  if (dailyExpRate <= 0) {
    tips.push({
      type: 'warning',
      message: '最近没有获得经验，快去完成任务吧！'
    })
    return tips
  }

  const expToNext = getExpToNextLevel(currentExp)
  const currentLevel = getLevelByExp(currentExp)

  if (currentLevel >= MAX_LEVEL) {
    tips.push({
      type: 'success',
      message: '恭喜达到最高等级！'
    })
    return tips
  }

  if (dailyCap !== null && dailyCap > 0) {
    const capUsage = (dailyExpRate / dailyCap) * 100
    if (capUsage >= 90) {
      tips.push({
        type: 'success',
        message: '每日经验获取效率很高，继续保持！'
      })
    } else if (capUsage >= 50) {
      tips.push({
        type: 'info',
        message: `每日经验已达上限的 ${Math.round(capUsage)}%，还可以更快哦！`
      })
    } else {
      tips.push({
        type: 'warning',
        message: `每日经验仅达上限的 ${Math.round(capUsage)}%，建议完成更多任务。`
      })
    }
  }

  if (dailyExpRate >= expToNext) {
    tips.push({
      type: 'success',
      message: '按当前进度，今天就能升级！'
    })
  }

  return tips
}

function getExpForLevel(level) {
  return getLevelExp(level)
}
