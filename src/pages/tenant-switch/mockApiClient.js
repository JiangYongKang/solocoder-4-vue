import { generateMockSpaces } from './mockData.js'

export function createMockApiClient(options = {}) {
  const {
    simulateErrors = false,
    errorRate = 0.1,
    fetchDelay = 1200,
    actionDelay = { min: 600, max: 1000 }
  } = options

  const randomDelay = (min, max) => min + Math.random() * (max - min)
  const shouldSimulateError = () => simulateErrors && Math.random() < errorRate

  return {
    fetchSpaces: async () => {
      await new Promise(resolve => setTimeout(resolve, fetchDelay))
      return generateMockSpaces()
    },

    switchSpace: async (space) => {
      await new Promise(resolve => setTimeout(resolve, randomDelay(actionDelay.min, actionDelay.max)))
      if (shouldSimulateError()) {
        throw new Error('切换空间失败')
      }
      return { success: true, space }
    },

    setDefaultSpace: async (space) => {
      await new Promise(resolve => setTimeout(resolve, randomDelay(actionDelay.min, actionDelay.max)))
      if (shouldSimulateError()) {
        throw new Error('设置默认空间失败')
      }
      return { success: true, space }
    },

    sendInvite: async (inviteData) => {
      await new Promise(resolve => setTimeout(resolve, randomDelay(1000, 1500)))
      if (shouldSimulateError()) {
        throw new Error('发送邀请失败')
      }
      return { success: true, sentCount: inviteData.emails.length, inviteData }
    }
  }
}

export const defaultMockApiClient = createMockApiClient()
