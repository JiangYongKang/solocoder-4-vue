import { CANCELLATION_STATUS, COOLING_PERIOD_DAYS } from './constants.js'

export function calculateCoolingPeriodEnd(submittedAt, coolingDays = COOLING_PERIOD_DAYS) {
  const submitDate = new Date(submittedAt)
  if (isNaN(submitDate.getTime())) {
    return null
  }
  const endDate = new Date(submitDate.getTime())
  endDate.setDate(endDate.getDate() + coolingDays)
  return endDate.toISOString()
}

export function getRemainingTime(targetTime, currentTime = new Date().toISOString()) {
  const target = new Date(targetTime)
  const now = new Date(currentTime)

  if (isNaN(target.getTime()) || isNaN(now.getTime())) {
    return null
  }

  const diffMs = target.getTime() - now.getTime()

  if (diffMs <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0
    }
  }

  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds
  }
}

export function formatRemainingTime(remainingTime) {
  if (!remainingTime) return '--天 --时 --分 --秒'

  if (remainingTime.expired) {
    return '已结束'
  }

  const { days, hours, minutes, seconds } = remainingTime
  const pad = (n) => n.toString().padStart(2, '0')

  const parts = []
  if (days > 0) parts.push(`${days}天`)
  parts.push(`${pad(hours)}时`)
  parts.push(`${pad(minutes)}分`)
  parts.push(`${pad(seconds)}秒`)

  return parts.join(' ')
}

export function getProgressPercentage(submittedAt, currentTime = new Date().toISOString(), coolingDays = COOLING_PERIOD_DAYS) {
  const submit = new Date(submittedAt)
  const now = new Date(currentTime)

  if (isNaN(submit.getTime()) || isNaN(now.getTime())) {
    return 0
  }

  const totalMs = coolingDays * 24 * 60 * 60 * 1000
  const elapsedMs = now.getTime() - submit.getTime()

  if (elapsedMs <= 0) return 0
  if (elapsedMs >= totalMs) return 100

  return Math.floor((elapsedMs / totalMs) * 100)
}

export function getProgressStage(progressPercentage) {
  if (progressPercentage <= 0) {
    return { stage: 0, label: '待处理' }
  }
  if (progressPercentage < 34) {
    return { stage: 1, label: '冷静期初期' }
  }
  if (progressPercentage < 67) {
    return { stage: 2, label: '冷静期中期' }
  }
  if (progressPercentage < 100) {
    return { stage: 3, label: '冷静期后期' }
  }
  return { stage: 4, label: '即将完成' }
}

export function isInCoolingPeriod(submittedAt, currentTime = new Date().toISOString(), coolingDays = COOLING_PERIOD_DAYS) {
  const submit = new Date(submittedAt)
  const now = new Date(currentTime)
  const endDate = new Date(submit.getTime())
  endDate.setDate(endDate.getDate() + coolingDays)

  if (isNaN(submit.getTime()) || isNaN(now.getTime())) {
    return false
  }

  return now.getTime() >= submit.getTime() && now.getTime() < endDate.getTime()
}

export function shouldAutoComplete(submittedAt, currentTime = new Date().toISOString(), coolingDays = COOLING_PERIOD_DAYS) {
  const submit = new Date(submittedAt)
  const now = new Date(currentTime)
  const endDate = new Date(submit.getTime())
  endDate.setDate(endDate.getDate() + coolingDays)

  if (isNaN(submit.getTime()) || isNaN(now.getTime())) {
    return false
  }

  return now.getTime() >= endDate.getTime()
}

export function formatDateString(isoString) {
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return '--'

  const year = date.getUTCFullYear()
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const day = date.getUTCDate().toString().padStart(2, '0')
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function getMilestoneEvents(submittedAt, coolingDays = COOLING_PERIOD_DAYS) {
  const submitDate = new Date(submittedAt)
  if (isNaN(submitDate.getTime())) return []

  const milestones = []

  milestones.push({
    id: 'submitted',
    label: '申请提交',
    date: submittedAt,
    offset: 0,
    description: '您已提交账号注销申请'
  })

  const day3 = new Date(submitDate.getTime())
  day3.setDate(day3.getDate() + Math.floor(coolingDays * 0.4))
  milestones.push({
    id: 'mid_cooling',
    label: '冷静期提醒',
    date: day3.toISOString(),
    offset: 40,
    description: '冷静期过半，您仍可撤销申请'
  })

  const day6 = new Date(submitDate.getTime())
  day6.setDate(day6.getDate() + coolingDays - 1)
  milestones.push({
    id: 'near_end',
    label: '即将完成',
    date: day6.toISOString(),
    offset: 90,
    description: '冷静期即将结束，撤销通道即将关闭'
  })

  const endDate = new Date(submitDate.getTime())
  endDate.setDate(endDate.getDate() + coolingDays)
  milestones.push({
    id: 'completed',
    label: '注销完成',
    date: endDate.toISOString(),
    offset: 100,
    description: '账号注销完成，数据已清除'
  })

  return milestones
}

export function checkStatusFromTime(submittedAt, revokedAt, currentTime = new Date().toISOString(), coolingDays = COOLING_PERIOD_DAYS) {
  if (revokedAt) {
    return CANCELLATION_STATUS.REVOKED
  }

  if (!submittedAt) {
    return CANCELLATION_STATUS.NOT_APPLIED
  }

  if (shouldAutoComplete(submittedAt, currentTime, coolingDays)) {
    return CANCELLATION_STATUS.COMPLETED
  }

  if (isInCoolingPeriod(submittedAt, currentTime, coolingDays)) {
    return CANCELLATION_STATUS.COOLING_PERIOD
  }

  return CANCELLATION_STATUS.NOT_APPLIED
}
