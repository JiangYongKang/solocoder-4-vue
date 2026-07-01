import { LEVEL_EXP_REQUIREMENTS, MAX_LEVEL, LEVELS } from './constants.js'

export function getLevelByExp(exp) {
  if (exp < 0) {
    return LEVELS.L1
  }

  let currentLevel = LEVELS.L1
  for (let level = MAX_LEVEL; level >= LEVELS.L1; level--) {
    if (exp >= LEVEL_EXP_REQUIREMENTS[level]) {
      currentLevel = level
      break
    }
  }
  return currentLevel
}

export function getExpForLevel(level) {
  if (level < LEVELS.L1 || level > MAX_LEVEL) {
    return 0
  }
  return LEVEL_EXP_REQUIREMENTS[level]
}

export function getExpForNextLevel(currentLevel) {
  if (currentLevel >= MAX_LEVEL) {
    return 0
  }
  const nextLevel = currentLevel + 1
  return LEVEL_EXP_REQUIREMENTS[nextLevel]
}

export function getCurrentLevelExp(exp) {
  const currentLevel = getLevelByExp(exp)
  return getExpForLevel(currentLevel)
}

export function getExpToNextLevel(exp) {
  const currentLevel = getLevelByExp(exp)
  if (currentLevel >= MAX_LEVEL) {
    return 0
  }
  const nextLevelExp = getExpForNextLevel(currentLevel)
  return nextLevelExp - exp
}

export function getLevelProgress(exp) {
  const currentLevel = getLevelByExp(exp)
  if (currentLevel >= MAX_LEVEL) {
    return 100
  }

  const currentLevelExp = getExpForLevel(currentLevel)
  const nextLevelExp = getExpForNextLevel(currentLevel)
  const levelRange = nextLevelExp - currentLevelExp
  const progress = exp - currentLevelExp

  if (levelRange <= 0) {
    return 0
  }

  return Math.min(100, Math.max(0, Math.round((progress / levelRange) * 100)))
}

export function getTotalExpToMaxLevel() {
  return LEVEL_EXP_REQUIREMENTS[MAX_LEVEL]
}

export function getOverallProgress(exp) {
  const maxExp = getTotalExpToMaxLevel()
  if (maxExp <= 0) {
    return 0
  }
  return Math.min(100, Math.max(0, Math.round((exp / maxExp) * 100)))
}

export function calculateLevelInfo(exp) {
  const level = getLevelByExp(exp)
  const currentLevelExp = getExpForLevel(level)
  const nextLevelExp = getExpForNextLevel(level)
  const expToNext = getExpToNextLevel(exp)
  const levelProgress = getLevelProgress(exp)
  const overallProgress = getOverallProgress(exp)
  const isMaxLevel = level >= MAX_LEVEL

  return {
    level,
    currentExp: exp,
    currentLevelExp,
    nextLevelExp,
    expToNext,
    levelProgress,
    overallProgress,
    isMaxLevel
  }
}

export function addExp(currentExp, expToAdd, dailyCap = null, currentDailyExp = 0) {
  if (expToAdd <= 0) {
    return {
      newExp: currentExp,
      addedExp: 0,
      cappedExp: 0,
      newLevel: getLevelByExp(currentExp),
      leveledUp: false
    }
  }

  let actualExpToAdd = expToAdd
  let cappedExp = 0

  if (dailyCap !== null && dailyCap > 0) {
    const remainingDailyCap = Math.max(0, dailyCap - currentDailyExp)
    if (actualExpToAdd > remainingDailyCap) {
      cappedExp = actualExpToAdd - remainingDailyCap
      actualExpToAdd = remainingDailyCap
    }
  }

  const oldLevel = getLevelByExp(currentExp)
  const newExp = currentExp + actualExpToAdd
  const newLevel = getLevelByExp(newExp)

  return {
    newExp,
    addedExp: actualExpToAdd,
    cappedExp,
    newLevel,
    oldLevel,
    leveledUp: newLevel > oldLevel
  }
}

export function subtractExp(currentExp, expToSubtract) {
  if (expToSubtract <= 0) {
    return {
      newExp: currentExp,
      subtractedExp: 0,
      newLevel: getLevelByExp(currentExp),
      leveledDown: false
    }
  }

  const oldLevel = getLevelByExp(currentExp)
  const newExp = Math.max(0, currentExp - expToSubtract)
  const newLevel = getLevelByExp(newExp)

  return {
    newExp,
    subtractedExp: currentExp - newExp,
    newLevel,
    oldLevel,
    leveledDown: newLevel < oldLevel
  }
}

export function groupExpRecordsBySource(records) {
  const grouped = {}

  records.forEach(record => {
    const source = record.source
    if (!grouped[source]) {
      grouped[source] = {
        source,
        totalExp: 0,
        count: 0,
        records: []
      }
    }
    grouped[source].totalExp += record.exp
    grouped[source].count += 1
    grouped[source].records.push(record)
  })

  return Object.values(grouped).sort((a, b) => Math.abs(b.totalExp) - Math.abs(a.totalExp))
}

export function calculateExpSummary(records) {
  const totalGained = records
    .filter(r => r.exp > 0)
    .reduce((sum, r) => sum + r.exp, 0)

  const totalLost = records
    .filter(r => r.exp < 0)
    .reduce((sum, r) => sum + Math.abs(r.exp), 0)

  const netExp = totalGained - totalLost

  return {
    totalGained,
    totalLost,
    netExp,
    recordCount: records.length
  }
}
