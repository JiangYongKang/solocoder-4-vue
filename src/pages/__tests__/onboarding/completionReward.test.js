import { describe, it, expect } from 'vitest'
import {
  getCompletionRewards,
  getRewardById,
  getTotalRewardsValue,
  createCompletionState,
  getRecommendedTasksWithStatus,
  getRecommendedTaskById,
  getPriorityLabel,
  getPriorityColor,
  sortTasksByPriority,
  getCompletionSummary,
  startTask,
  completeTask,
  getTaskProgress
} from '../../onboarding/completionReward.js'
import { COMPLETION_REWARDS, RECOMMENDED_TASKS } from '../../onboarding/constants.js'

describe('completionReward', () => {
  describe('getCompletionRewards', () => {
    it('should return all rewards with unlocked flag', () => {
      const rewards = getCompletionRewards()
      expect(rewards).toHaveLength(COMPLETION_REWARDS.length)
      rewards.forEach(reward => {
        expect(reward.unlocked).toBe(true)
        expect(reward.id).toBeDefined()
        expect(reward.name).toBeDefined()
        expect(reward.icon).toBeDefined()
        expect(reward.description).toBeDefined()
      })
    })

    it('should include welcome_credits with 500 value', () => {
      const rewards = getCompletionRewards()
      const credits = rewards.find(r => r.id === 'welcome_credits')
      expect(credits).toBeDefined()
      expect(credits.value).toBe(500)
    })
  })

  describe('getRewardById', () => {
    it('should return reward for valid id', () => {
      const reward = getRewardById('welcome_credits')
      expect(reward).toBeDefined()
      expect(reward.id).toBe('welcome_credits')
    })

    it('should return null for invalid id', () => {
      const reward = getRewardById('invalid')
      expect(reward).toBeNull()
    })
  })

  describe('getTotalRewardsValue', () => {
    it('should calculate total value correctly', () => {
      const total = getTotalRewardsValue()
      const expectedTotal = COMPLETION_REWARDS.reduce((sum, r) => sum + (r.value || 0), 0)
      expect(total).toBe(expectedTotal)
      expect(total).toBe(500)
    })
  })

  describe('createCompletionState', () => {
    it('should create valid completion state', () => {
      const state = createCompletionState()
      expect(state.completed).toBe(true)
      expect(state.completedAt).toBeDefined()
      expect(state.rewards).toHaveLength(COMPLETION_REWARDS.length)
      expect(state.totalValue).toBe(getTotalRewardsValue())
    })

    it('should include recommended tasks with pending status', () => {
      const state = createCompletionState()
      expect(state.recommendedTasks).toBeDefined()
      expect(state.recommendedTasks).toHaveLength(RECOMMENDED_TASKS.length)
      state.recommendedTasks.forEach(task => {
        expect(task.status).toBe('pending')
        expect(task.startedAt).toBeNull()
        expect(task.completedAt).toBeNull()
      })
    })

    it('should use provided completedAt timestamp', () => {
      const customTime = '2024-01-01T00:00:00.000Z'
      const state = createCompletionState(customTime)
      expect(state.completedAt).toBe(customTime)
    })
  })

  describe('getRecommendedTasksWithStatus', () => {
    it('should return tasks with default pending status', () => {
      const tasks = getRecommendedTasksWithStatus()
      expect(tasks).toHaveLength(RECOMMENDED_TASKS.length)
      tasks.forEach(task => {
        expect(task.status).toBe('pending')
        expect(task.startedAt).toBeNull()
        expect(task.completedAt).toBeNull()
      })
    })

    it('should preserve all original task properties', () => {
      const tasks = getRecommendedTasksWithStatus()
      tasks.forEach((task, index) => {
        expect(task.id).toBe(RECOMMENDED_TASKS[index].id)
        expect(task.title).toBe(RECOMMENDED_TASKS[index].title)
        expect(task.description).toBe(RECOMMENDED_TASKS[index].description)
        expect(task.priority).toBe(RECOMMENDED_TASKS[index].priority)
        expect(task.estimate).toBe(RECOMMENDED_TASKS[index].estimate)
      })
    })
  })

  describe('getRecommendedTaskById', () => {
    it('should return task for valid id', () => {
      const taskId = RECOMMENDED_TASKS[0].id
      const task = getRecommendedTaskById(taskId)
      expect(task).toBeDefined()
      expect(task.id).toBe(taskId)
    })

    it('should return null for invalid id', () => {
      const task = getRecommendedTaskById('invalid_task')
      expect(task).toBeNull()
    })
  })

  describe('getPriorityLabel', () => {
    it('should return correct labels for all priorities', () => {
      expect(getPriorityLabel('high')).toBe('推荐优先')
      expect(getPriorityLabel('medium')).toBe('建议完成')
      expect(getPriorityLabel('low')).toBe('可选')
    })

    it('should return fallback for unknown priority', () => {
      expect(getPriorityLabel('unknown')).toBe('可选')
    })
  })

  describe('getPriorityColor', () => {
    it('should return correct colors for all priorities', () => {
      expect(getPriorityColor('high')).toBe('#ef4444')
      expect(getPriorityColor('medium')).toBe('#f59e0b')
      expect(getPriorityColor('low')).toBe('#6b7280')
    })

    it('should return fallback for unknown priority', () => {
      expect(getPriorityColor('unknown')).toBe('#6b7280')
    })
  })

  describe('sortTasksByPriority', () => {
    it('should sort high priority first', () => {
      const tasks = getRecommendedTasksWithStatus()
      const sorted = sortTasksByPriority(tasks)
      const priorities = sorted.map(t => t.priority)
      const highIndex = priorities.indexOf('high')
      const mediumIndex = priorities.indexOf('medium')
      const lowIndex = priorities.indexOf('low')
      if (highIndex !== -1 && mediumIndex !== -1) {
        expect(highIndex).toBeLessThan(mediumIndex)
      }
      if (mediumIndex !== -1 && lowIndex !== -1) {
        expect(mediumIndex).toBeLessThan(lowIndex)
      }
    })

    it('should not mutate original array', () => {
      const tasks = getRecommendedTasksWithStatus()
      const originalCopy = [...tasks]
      sortTasksByPriority(tasks)
      expect(tasks).toEqual(originalCopy)
    })
  })

  describe('getCompletionSummary', () => {
    it('should return summary with correct structure', () => {
      const summary = getCompletionSummary()
      expect(summary.rewardsCount).toBe(COMPLETION_REWARDS.length)
      expect(summary.tasksCount).toBe(RECOMMENDED_TASKS.length)
      expect(summary.highPriorityCount).toBeGreaterThan(0)
      expect(summary.totalValue).toBe(500)
    })

    it('should include quickStats with 4 items', () => {
      const summary = getCompletionSummary()
      expect(summary.quickStats).toHaveLength(4)
      summary.quickStats.forEach(stat => {
        expect(stat).toHaveProperty('label')
        expect(stat).toHaveProperty('value')
        expect(stat).toHaveProperty('icon')
      })
    })

    it('should count high priority tasks correctly', () => {
      const summary = getCompletionSummary()
      const expectedHighPriority = RECOMMENDED_TASKS.filter(t => t.priority === 'high').length
      expect(summary.highPriorityCount).toBe(expectedHighPriority)
    })
  })

  describe('startTask', () => {
    it('should start a pending task successfully', () => {
      const tasks = getRecommendedTasksWithStatus()
      const taskId = tasks[0].id
      const result = startTask(tasks, taskId)
      expect(result.success).toBe(true)
      expect(result.task.status).toBe('in_progress')
      expect(result.task.startedAt).toBeDefined()
      expect(result.task.startedAt).not.toBeNull()
    })

    it('should not mutate original tasks array', () => {
      const tasks = getRecommendedTasksWithStatus()
      const taskId = tasks[0].id
      startTask(tasks, taskId)
      expect(tasks[0].status).toBe('pending')
    })

    it('should fail for invalid task id', () => {
      const tasks = getRecommendedTasksWithStatus()
      const result = startTask(tasks, 'invalid')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('completeTask', () => {
    it('should complete an in_progress task successfully', () => {
      const tasks = getRecommendedTasksWithStatus()
      const taskId = tasks[0].id
      const startResult = startTask(tasks, taskId)
      const result = completeTask(startResult.tasks, taskId)
      expect(result.success).toBe(true)
      expect(result.task.status).toBe('completed')
      expect(result.task.completedAt).toBeDefined()
      expect(result.task.completedAt).not.toBeNull()
    })

    it('should complete a pending task directly', () => {
      const tasks = getRecommendedTasksWithStatus()
      const taskId = tasks[0].id
      const result = completeTask(tasks, taskId)
      expect(result.success).toBe(true)
      expect(result.task.status).toBe('completed')
    })

    it('should not mutate original tasks array', () => {
      const tasks = getRecommendedTasksWithStatus()
      const taskId = tasks[0].id
      completeTask(tasks, taskId)
      expect(tasks[0].status).toBe('pending')
    })

    it('should fail for invalid task id', () => {
      const tasks = getRecommendedTasksWithStatus()
      const result = completeTask(tasks, 'invalid')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('getTaskProgress', () => {
    it('should return 0% progress for all pending tasks', () => {
      const tasks = getRecommendedTasksWithStatus()
      const progress = getTaskProgress(tasks)
      expect(progress.total).toBe(tasks.length)
      expect(progress.completed).toBe(0)
      expect(progress.pending).toBe(tasks.length)
      expect(progress.inProgress).toBe(0)
      expect(progress.progressPercent).toBe(0)
    })

    it('should calculate progress correctly after completing tasks', () => {
      let tasks = getRecommendedTasksWithStatus()
      const taskId1 = tasks[0].id
      const taskId2 = tasks[1].id
      const result1 = completeTask(tasks, taskId1)
      const result2 = startTask(result1.tasks, taskId2)
      const progress = getTaskProgress(result2.tasks)
      expect(progress.total).toBe(tasks.length)
      expect(progress.completed).toBe(1)
      expect(progress.inProgress).toBe(1)
      expect(progress.pending).toBe(tasks.length - 2)
      const expectedPercent = Math.round((1 / tasks.length) * 100)
      expect(progress.progressPercent).toBe(expectedPercent)
    })

    it('should return 100% progress when all tasks completed', () => {
      let tasks = getRecommendedTasksWithStatus()
      let resultTasks = tasks
      tasks.forEach(task => {
        const result = completeTask(resultTasks, task.id)
        resultTasks = result.tasks
      })
      const progress = getTaskProgress(resultTasks)
      expect(progress.progressPercent).toBe(100)
      expect(progress.completed).toBe(tasks.length)
      expect(progress.pending).toBe(0)
    })
  })
})
