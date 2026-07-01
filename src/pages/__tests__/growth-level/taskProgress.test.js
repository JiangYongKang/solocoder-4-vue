import { describe, it, expect } from 'vitest'
import {
  getTaskProgress,
  getTaskStatus,
  canClaimTask,
  updateTaskProgress,
  calculateTaskRewards,
  filterTasksByType,
  filterTasksByStatus,
  sortTasksByPriority,
  checkTaskExpiration,
  formatTimeRemaining,
  getTaskAction
} from '../../growth-level/taskProgress.js'
import { TASK_STATUS, TASK_TYPES } from '../../growth-level/constants.js'

describe('taskProgress', () => {
  describe('getTaskProgress', () => {
    it('should return 0 progress for null task', () => {
      const result = getTaskProgress(null)
      expect(result.progress).toBe(0)
      expect(result.percentage).toBe(0)
      expect(result.isCompleted).toBe(false)
    })

    it('should handle targetValue of 0 gracefully', () => {
      const task = { currentValue: 5, targetValue: 0 }
      const result = getTaskProgress(task)
      expect(result.percentage).toBe(0)
      expect(result.isCompleted).toBe(false)
    })

    it('should calculate progress correctly', () => {
      const task = { currentValue: 3, targetValue: 10 }
      const result = getTaskProgress(task)
      expect(result.progress).toBe(3)
      expect(result.target).toBe(10)
      expect(result.percentage).toBe(30)
      expect(result.isCompleted).toBe(false)
      expect(result.remaining).toBe(7)
    })

    it('should clamp progress at 100%', () => {
      const task = { currentValue: 15, targetValue: 10 }
      const result = getTaskProgress(task)
      expect(result.progress).toBe(10)
      expect(result.percentage).toBe(100)
      expect(result.isCompleted).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('should handle negative currentValue', () => {
      const task = { currentValue: -5, targetValue: 10 }
      const result = getTaskProgress(task)
      expect(result.progress).toBe(0)
      expect(result.percentage).toBe(0)
    })
  })

  describe('getTaskStatus', () => {
    it('should return NOT_STARTED for new task', () => {
      const task = { currentValue: 0, targetValue: 10 }
      expect(getTaskStatus(task)).toBe(TASK_STATUS.NOT_STARTED)
    })

    it('should return IN_PROGRESS for partially completed task', () => {
      const task = { currentValue: 5, targetValue: 10 }
      expect(getTaskStatus(task)).toBe(TASK_STATUS.IN_PROGRESS)
    })

    it('should return COMPLETED for finished but unclaimed task', () => {
      const task = { currentValue: 10, targetValue: 10 }
      expect(getTaskStatus(task)).toBe(TASK_STATUS.COMPLETED)
    })

    it('should return CLAIMED for claimed task', () => {
      const task = { currentValue: 10, targetValue: 10 }
      const claimedAt = new Date().toISOString()
      expect(getTaskStatus(task, claimedAt)).toBe(TASK_STATUS.CLAIMED)
    })
  })

  describe('canClaimTask', () => {
    it('should return false for null task', () => {
      expect(canClaimTask(null)).toBe(false)
    })

    it('should return false for already claimed task', () => {
      const task = { currentValue: 10, targetValue: 10 }
      expect(canClaimTask(task, new Date().toISOString())).toBe(false)
    })

    it('should return false for incomplete task', () => {
      const task = { currentValue: 5, targetValue: 10 }
      expect(canClaimTask(task)).toBe(false)
    })

    it('should return true for completed unclaimed task', () => {
      const task = { currentValue: 10, targetValue: 10 }
      expect(canClaimTask(task)).toBe(true)
    })
  })

  describe('updateTaskProgress', () => {
    it('should return null for null task', () => {
      expect(updateTaskProgress(null)).toBeNull()
    })

    it('should increment progress', () => {
      const task = { currentValue: 3, targetValue: 10 }
      const updated = updateTaskProgress(task, 2)
      expect(updated.currentValue).toBe(5)
    })

    it('should not exceed target value', () => {
      const task = { currentValue: 8, targetValue: 10 }
      const updated = updateTaskProgress(task, 5)
      expect(updated.currentValue).toBe(10)
    })

    it('should use default increment of 1', () => {
      const task = { currentValue: 3, targetValue: 10 }
      const updated = updateTaskProgress(task)
      expect(updated.currentValue).toBe(4)
    })
  })

  describe('calculateTaskRewards', () => {
    it('should handle empty tasks array', () => {
      const result = calculateTaskRewards([])
      expect(result.totalExp).toBe(0)
      expect(result.claimedExp).toBe(0)
      expect(result.completedCount).toBe(0)
      expect(result.completionRate).toBe(0)
    })

    it('should calculate correct rewards', () => {
      const tasks = [
        { id: 1, currentValue: 10, targetValue: 10, rewardExp: 50, claimedAt: null },
        { id: 2, currentValue: 10, targetValue: 10, rewardExp: 100, claimedAt: new Date().toISOString() },
        { id: 3, currentValue: 5, targetValue: 10, rewardExp: 75, claimedAt: null },
        { id: 4, currentValue: 0, targetValue: 10, rewardExp: 25, claimedAt: null }
      ]

      const result = calculateTaskRewards(tasks)
      expect(result.totalExp).toBe(250)
      expect(result.claimedExp).toBe(100)
      expect(result.unclaimedExp).toBe(50)
      expect(result.completedCount).toBe(2)
      expect(result.totalCount).toBe(4)
      expect(result.completionRate).toBe(50)
    })
  })

  describe('filterTasksByType', () => {
    it('should filter tasks by type', () => {
      const tasks = [
        { id: 1, type: TASK_TYPES.DAILY },
        { id: 2, type: TASK_TYPES.WEEKLY },
        { id: 3, type: TASK_TYPES.DAILY }
      ]

      const dailyTasks = filterTasksByType(tasks, TASK_TYPES.DAILY)
      expect(dailyTasks).toHaveLength(2)
      expect(dailyTasks.every(t => t.type === TASK_TYPES.DAILY)).toBe(true)
    })

    it('should return empty array for null tasks', () => {
      expect(filterTasksByType(null, TASK_TYPES.DAILY)).toEqual([])
    })
  })

  describe('filterTasksByStatus', () => {
    it('should filter tasks by status', () => {
      const tasks = [
        { id: 1, currentValue: 0, targetValue: 10 },
        { id: 2, currentValue: 5, targetValue: 10 },
        { id: 3, currentValue: 10, targetValue: 10 },
        { id: 4, currentValue: 10, targetValue: 10, claimedAt: new Date().toISOString() }
      ]

      const inProgress = filterTasksByStatus(tasks, TASK_STATUS.IN_PROGRESS)
      expect(inProgress).toHaveLength(1)
      expect(inProgress[0].id).toBe(2)
    })
  })

  describe('sortTasksByPriority', () => {
    it('should sort completed tasks first', () => {
      const tasks = [
        { id: 1, type: TASK_TYPES.DAILY, currentValue: 0, targetValue: 10, rewardExp: 50 },
        { id: 2, type: TASK_TYPES.DAILY, currentValue: 10, targetValue: 10, rewardExp: 50 }
      ]

      const sorted = sortTasksByPriority(tasks)
      expect(sorted[0].id).toBe(2)
      expect(sorted[1].id).toBe(1)
    })

    it('should sort by type within same status', () => {
      const tasks = [
        { id: 1, type: TASK_TYPES.WEEKLY, currentValue: 0, targetValue: 10, rewardExp: 50 },
        { id: 2, type: TASK_TYPES.DAILY, currentValue: 0, targetValue: 10, rewardExp: 50 }
      ]

      const sorted = sortTasksByPriority(tasks)
      expect(sorted[0].id).toBe(2)
      expect(sorted[1].id).toBe(1)
    })

    it('should sort by reward exp within same status and type', () => {
      const tasks = [
        { id: 1, type: TASK_TYPES.DAILY, currentValue: 0, targetValue: 10, rewardExp: 30 },
        { id: 2, type: TASK_TYPES.DAILY, currentValue: 0, targetValue: 10, rewardExp: 50 }
      ]

      const sorted = sortTasksByPriority(tasks)
      expect(sorted[0].id).toBe(2)
      expect(sorted[1].id).toBe(1)
    })
  })

  describe('checkTaskExpiration', () => {
    it('should return not expired when no expiration date', () => {
      const task = { currentValue: 5, targetValue: 10 }
      const result = checkTaskExpiration(task)
      expect(result.isExpired).toBe(false)
      expect(result.expiresAt).toBeNull()
    })

    it('should detect expired task', () => {
      const task = {
        currentValue: 5,
        targetValue: 10,
        expiresAt: new Date(Date.now() - 1000).toISOString()
      }
      const result = checkTaskExpiration(task)
      expect(result.isExpired).toBe(true)
    })

    it('should detect non-expired task', () => {
      const task = {
        currentValue: 5,
        targetValue: 10,
        expiresAt: new Date(Date.now() + 10000).toISOString()
      }
      const result = checkTaskExpiration(task)
      expect(result.isExpired).toBe(false)
      expect(result.timeRemaining).toBeGreaterThan(0)
    })
  })

  describe('formatTimeRemaining', () => {
    it('should format expired', () => {
      expect(formatTimeRemaining(0)).toBe('已过期')
      expect(formatTimeRemaining(-1000)).toBe('已过期')
    })

    it('should format seconds', () => {
      expect(formatTimeRemaining(5000)).toBe('剩余 5 秒')
    })

    it('should format minutes', () => {
      expect(formatTimeRemaining(120000)).toBe('剩余 2 分钟')
    })

    it('should format hours', () => {
      expect(formatTimeRemaining(7200000)).toBe('剩余 2 小时')
    })

    it('should format days', () => {
      expect(formatTimeRemaining(172800000)).toBe('剩余 2 天')
    })
  })

  describe('getTaskAction', () => {
    it('should return expired action for expired task', () => {
      const task = {
        currentValue: 5,
        targetValue: 10,
        expiresAt: new Date(Date.now() - 1000).toISOString()
      }
      const action = getTaskAction(task)
      expect(action.action).toBe('expired')
      expect(action.disabled).toBe(true)
    })

    it('should return claim action for completed task', () => {
      const task = { currentValue: 10, targetValue: 10 }
      const action = getTaskAction(task)
      expect(action.action).toBe('claim')
      expect(action.label).toBe('领取奖励')
      expect(action.disabled).toBe(false)
    })

    it('should return continue action for in progress task', () => {
      const task = { currentValue: 5, targetValue: 10 }
      const action = getTaskAction(task)
      expect(action.action).toBe('continue')
      expect(action.label).toBe('继续')
      expect(action.disabled).toBe(false)
    })

    it('should return start action for new task', () => {
      const task = { currentValue: 0, targetValue: 10 }
      const action = getTaskAction(task)
      expect(action.action).toBe('start')
      expect(action.label).toBe('去完成')
      expect(action.disabled).toBe(false)
    })

    it('should return claimed action for claimed task', () => {
      const task = { currentValue: 10, targetValue: 10 }
      const action = getTaskAction(task, new Date().toISOString())
      expect(action.action).toBe('claimed')
      expect(action.label).toBe('已领取')
      expect(action.disabled).toBe(true)
    })
  })
})
