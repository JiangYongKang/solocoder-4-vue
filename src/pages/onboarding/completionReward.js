import { COMPLETION_REWARDS, RECOMMENDED_TASKS } from './constants.js'

export function getCompletionRewards() {
  return COMPLETION_REWARDS.map(reward => ({
    ...reward,
    unlocked: true
  }))
}

export function getRewardById(rewardId) {
  return COMPLETION_REWARDS.find(r => r.id === rewardId) || null
}

export function getTotalRewardsValue() {
  return COMPLETION_REWARDS.reduce((total, reward) => {
    return total + (reward.value || 0)
  }, 0)
}

export function createCompletionState(completedAt = new Date().toISOString()) {
  return {
    completed: true,
    completedAt,
    rewards: getCompletionRewards(),
    totalValue: getTotalRewardsValue(),
    recommendedTasks: getRecommendedTasksWithStatus()
  }
}

export function getRecommendedTasksWithStatus() {
  return RECOMMENDED_TASKS.map(task => ({
    ...task,
    status: 'pending',
    startedAt: null,
    completedAt: null
  }))
}

export function getRecommendedTaskById(taskId) {
  return RECOMMENDED_TASKS.find(t => t.id === taskId) || null
}

export function getPriorityLabel(priority) {
  const labels = {
    high: '推荐优先',
    medium: '建议完成',
    low: '可选'
  }
  return labels[priority] || '可选'
}

export function getPriorityColor(priority) {
  const colors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#6b7280'
  }
  return colors[priority] || '#6b7280'
}

export function sortTasksByPriority(tasks) {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return [...tasks].sort((a, b) => {
    const orderA = priorityOrder[a.priority] ?? 3
    const orderB = priorityOrder[b.priority] ?? 3
    return orderA - orderB
  })
}

export function getCompletionSummary() {
  const rewards = getCompletionRewards()
  const tasks = getRecommendedTasksWithStatus()
  const highPriorityCount = tasks.filter(t => t.priority === 'high').length
  const totalValue = getTotalRewardsValue()

  return {
    rewardsCount: rewards.length,
    tasksCount: tasks.length,
    highPriorityCount,
    totalValue,
    quickStats: [
      { label: '获得奖励', value: rewards.length + ' 项', icon: '🎁' },
      { label: '累计积分', value: totalValue + ' 积分', icon: '💎' },
      { label: '推荐任务', value: tasks.length + ' 个', icon: '📋' },
      { label: '优先完成', value: highPriorityCount + ' 个', icon: '⭐' }
    ]
  }
}

export function startTask(tasks, taskId) {
  const taskIndex = tasks.findIndex(t => t.id === taskId)
  if (taskIndex === -1) {
    return { success: false, tasks, error: '任务不存在' }
  }
  const newTasks = [...tasks]
  newTasks[taskIndex] = {
    ...newTasks[taskIndex],
    status: 'in_progress',
    startedAt: new Date().toISOString()
  }
  return { success: true, tasks: newTasks, task: newTasks[taskIndex] }
}

export function completeTask(tasks, taskId) {
  const taskIndex = tasks.findIndex(t => t.id === taskId)
  if (taskIndex === -1) {
    return { success: false, tasks, error: '任务不存在' }
  }
  const newTasks = [...tasks]
  newTasks[taskIndex] = {
    ...newTasks[taskIndex],
    status: 'completed',
    completedAt: new Date().toISOString()
  }
  return { success: true, tasks: newTasks, task: newTasks[taskIndex] }
}

export function getTaskProgress(tasks) {
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const pending = tasks.filter(t => t.status === 'pending').length
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    total,
    completed,
    inProgress,
    pending,
    progressPercent
  }
}
