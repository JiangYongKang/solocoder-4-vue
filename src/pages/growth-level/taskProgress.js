import { TASK_STATUS, TASK_TYPES } from './constants.js'

export function getTaskProgress(task) {
  if (!task) {
    return { progress: 0, percentage: 0, isCompleted: false }
  }

  const { currentValue = 0, targetValue = 1 } = task

  if (targetValue <= 0) {
    return { progress: 0, percentage: 0, isCompleted: false }
  }

  const clampedCurrent = Math.max(0, Math.min(currentValue, targetValue))
  const percentage = Math.round((clampedCurrent / targetValue) * 100)
  const isCompleted = clampedCurrent >= targetValue

  return {
    progress: clampedCurrent,
    target: targetValue,
    percentage,
    isCompleted,
    remaining: Math.max(0, targetValue - clampedCurrent)
  }
}

export function getTaskStatus(task, claimedAt = null) {
  if (!task) {
    return TASK_STATUS.NOT_STARTED
  }

  if (claimedAt) {
    return TASK_STATUS.CLAIMED
  }

  const { isCompleted } = getTaskProgress(task)

  if (isCompleted) {
    return TASK_STATUS.COMPLETED
  }

  const { currentValue = 0 } = task
  if (currentValue > 0) {
    return TASK_STATUS.IN_PROGRESS
  }

  return TASK_STATUS.NOT_STARTED
}

export function canClaimTask(task, claimedAt = null) {
  if (!task) {
    return false
  }

  if (claimedAt) {
    return false
  }

  const status = getTaskStatus(task, claimedAt)
  return status === TASK_STATUS.COMPLETED
}

export function updateTaskProgress(task, increment = 1) {
  if (!task) {
    return null
  }

  const { currentValue = 0, targetValue = 1 } = task
  const newCurrentValue = Math.min(currentValue + increment, targetValue)

  return {
    ...task,
    currentValue: newCurrentValue
  }
}

export function calculateTaskRewards(tasks, includeUnclaimed = true) {
  if (!tasks || tasks.length === 0) {
    return {
      totalExp: 0,
      claimedExp: 0,
      unclaimedExp: 0,
      completedCount: 0,
      totalCount: 0,
      completionRate: 0
    }
  }

  let totalExp = 0
  let claimedExp = 0
  let unclaimedExp = 0
  let completedCount = 0

  tasks.forEach(task => {
    const status = getTaskStatus(task, task.claimedAt)
    const rewardExp = task.rewardExp || 0

    totalExp += rewardExp

    if (status === TASK_STATUS.CLAIMED) {
      claimedExp += rewardExp
      completedCount++
    } else if (status === TASK_STATUS.COMPLETED) {
      if (includeUnclaimed) {
        unclaimedExp += rewardExp
      }
      completedCount++
    } else if (getTaskProgress(task).isCompleted) {
      completedCount++
      if (includeUnclaimed) {
        unclaimedExp += rewardExp
      }
    }
  })

  return {
    totalExp,
    claimedExp,
    unclaimedExp,
    completedCount,
    totalCount: tasks.length,
    completionRate: tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0
  }
}

export function filterTasksByType(tasks, type) {
  if (!tasks) return []
  return tasks.filter(task => task.type === type)
}

export function filterTasksByStatus(tasks, status) {
  if (!tasks) return []
  return tasks.filter(task => getTaskStatus(task, task.claimedAt) === status)
}

export function sortTasksByPriority(tasks) {
  if (!tasks) return []

  const statusPriority = {
    [TASK_STATUS.COMPLETED]: 0,
    [TASK_STATUS.IN_PROGRESS]: 1,
    [TASK_STATUS.NOT_STARTED]: 2,
    [TASK_STATUS.CLAIMED]: 3
  }

  const typePriority = {
    [TASK_TYPES.DAILY]: 0,
    [TASK_TYPES.WEEKLY]: 1,
    [TASK_TYPES.SPECIAL]: 2,
    [TASK_TYPES.ACHIEVEMENT]: 3
  }

  return [...tasks].sort((a, b) => {
    const statusA = getTaskStatus(a, a.claimedAt)
    const statusB = getTaskStatus(b, b.claimedAt)

    const statusDiff = statusPriority[statusA] - statusPriority[statusB]
    if (statusDiff !== 0) return statusDiff

    const typeDiff = typePriority[a.type] - typePriority[b.type]
    if (typeDiff !== 0) return typeDiff

    return (b.rewardExp || 0) - (a.rewardExp || 0)
  })
}

export function checkTaskExpiration(task, now = new Date()) {
  if (!task || !task.expiresAt) {
    return { isExpired: false, expiresAt: null, timeRemaining: null }
  }

  const expiresAt = new Date(task.expiresAt)
  const isExpired = now > expiresAt
  const timeRemaining = isExpired ? 0 : expiresAt.getTime() - now.getTime()

  return {
    isExpired,
    expiresAt,
    timeRemaining
  }
}

export function formatTimeRemaining(ms) {
  if (ms <= 0) {
    return '已过期'
  }

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `剩余 ${days} 天`
  }

  if (hours > 0) {
    return `剩余 ${hours} 小时`
  }

  if (minutes > 0) {
    return `剩余 ${minutes} 分钟`
  }

  return `剩余 ${seconds} 秒`
}

export function getTaskAction(task, claimedAt = null) {
  const status = getTaskStatus(task, claimedAt)
  const { isExpired } = checkTaskExpiration(task)

  if (isExpired) {
    return { action: 'expired', label: '已过期', disabled: true }
  }

  switch (status) {
    case TASK_STATUS.CLAIMED:
      return { action: 'claimed', label: '已领取', disabled: true }
    case TASK_STATUS.COMPLETED:
      return { action: 'claim', label: '领取奖励', disabled: false }
    case TASK_STATUS.IN_PROGRESS:
      return { action: 'continue', label: '继续', disabled: false }
    case TASK_STATUS.NOT_STARTED:
    default:
      return { action: 'start', label: '去完成', disabled: false }
  }
}
