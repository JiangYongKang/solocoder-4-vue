import { describe, expect, it } from 'vitest'
import {
    formatDate,
    getDefaultSpace,
    getExpireStatus,
    getRecentAccessRecords,
    isSpaceActive,
    isSpaceExpired,
    MEMBER_ROLES,
    ROLE_LABELS,
    setDefaultSpace,
    sortSpaces,
    updateLastAccessed
} from '../../tenant-switch/utils.js'

const createMockSpace = (overrides = {}) => ({
  id: 'space-1',
  name: '测试空间',
  role: MEMBER_ROLES.MEMBER,
  isDefault: false,
  expireAt: null,
  lastAccessedAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides
})

describe('MEMBER_ROLES', () => {
  it('should define all expected roles', () => {
    expect(MEMBER_ROLES).toEqual({
      OWNER: 'owner',
      ADMIN: 'admin',
      MEMBER: 'member',
      GUEST: 'guest'
    })
  })
})

describe('ROLE_LABELS', () => {
  it('should have correct Chinese labels for all roles', () => {
    expect(ROLE_LABELS.owner).toBe('所有者')
    expect(ROLE_LABELS.admin).toBe('管理员')
    expect(ROLE_LABELS.member).toBe('成员')
    expect(ROLE_LABELS.guest).toBe('访客')
  })
})

describe('isSpaceExpired', () => {
  it('should return false for space without expireAt', () => {
    const space = createMockSpace({ expireAt: null })
    expect(isSpaceExpired(space)).toBe(false)
  })

  it('should return false for null or undefined space', () => {
    expect(isSpaceExpired(null)).toBe(false)
    expect(isSpaceExpired(undefined)).toBe(false)
  })

  it('should return true when space is expired', () => {
    const now = new Date('2024-06-01T00:00:00.000Z')
    const space = createMockSpace({ expireAt: '2024-05-01T00:00:00.000Z' })
    expect(isSpaceExpired(space, now)).toBe(true)
  })

  it('should return false when space is not expired', () => {
    const now = new Date('2024-06-01T00:00:00.000Z')
    const space = createMockSpace({ expireAt: '2024-07-01T00:00:00.000Z' })
    expect(isSpaceExpired(space, now)).toBe(false)
  })

  it('should return false when expireAt equals current time', () => {
    const now = new Date('2024-06-01T00:00:00.000Z')
    const space = createMockSpace({ expireAt: '2024-06-01T00:00:00.000Z' })
    expect(isSpaceExpired(space, now)).toBe(false)
  })
})

describe('isSpaceActive', () => {
  it('should return true when space is not expired', () => {
    const now = new Date('2024-06-01T00:00:00.000Z')
    const space = createMockSpace({ expireAt: '2024-07-01T00:00:00.000Z' })
    expect(isSpaceActive(space, now)).toBe(true)
  })

  it('should return false when space is expired', () => {
    const now = new Date('2024-06-01T00:00:00.000Z')
    const space = createMockSpace({ expireAt: '2024-05-01T00:00:00.000Z' })
    expect(isSpaceActive(space, now)).toBe(false)
  })
})

describe('sortSpaces', () => {
  it('should return empty array for non-array input', () => {
    expect(sortSpaces(null)).toEqual([])
    expect(sortSpaces(undefined)).toEqual([])
    expect(sortSpaces('not-array')).toEqual([])
  })

  it('should prioritize default space first', () => {
    const space1 = createMockSpace({ id: '1', isDefault: false })
    const space2 = createMockSpace({ id: '2', isDefault: true })
    const sorted = sortSpaces([space1, space2])
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('1')
  })

  it('should prioritize current space after default', () => {
    const space1 = createMockSpace({ id: '1', isDefault: false })
    const space2 = createMockSpace({ id: '2', isDefault: false })
    const space3 = createMockSpace({ id: '3', isDefault: true })
    const sorted = sortSpaces([space1, space2, space3], '2')
    expect(sorted[0].id).toBe('3')
    expect(sorted[1].id).toBe('2')
    expect(sorted[2].id).toBe('1')
  })

  it('should sort non-expired spaces before expired ones', () => {
    const now = new Date('2024-06-01T00:00:00.000Z')
    const activeSpace = createMockSpace({ id: '1', expireAt: '2024-07-01T00:00:00.000Z' })
    const expiredSpace = createMockSpace({ id: '2', expireAt: '2024-05-01T00:00:00.000Z' })
    const sorted = sortSpaces([expiredSpace, activeSpace], null, now)
    expect(sorted[0].id).toBe('1')
    expect(sorted[1].id).toBe('2')
  })

  it('should sort by lastAccessedAt in descending order', () => {
    const space1 = createMockSpace({ id: '1', lastAccessedAt: '2024-06-01T00:00:00.000Z' })
    const space2 = createMockSpace({ id: '2', lastAccessedAt: '2024-06-03T00:00:00.000Z' })
    const space3 = createMockSpace({ id: '3', lastAccessedAt: '2024-06-02T00:00:00.000Z' })
    const sorted = sortSpaces([space1, space2, space3])
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('3')
    expect(sorted[2].id).toBe('1')
  })

  it('should sort by createdAt when no lastAccessedAt', () => {
    const space1 = createMockSpace({ id: '1', createdAt: '2024-01-01T00:00:00.000Z', lastAccessedAt: null })
    const space2 = createMockSpace({ id: '2', createdAt: '2024-03-01T00:00:00.000Z', lastAccessedAt: null })
    const space3 = createMockSpace({ id: '3', createdAt: '2024-02-01T00:00:00.000Z', lastAccessedAt: null })
    const sorted = sortSpaces([space1, space2, space3])
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('3')
    expect(sorted[2].id).toBe('1')
  })

  it('should not mutate the original array', () => {
    const spaces = [
      createMockSpace({ id: '1', isDefault: false }),
      createMockSpace({ id: '2', isDefault: true })
    ]
    const originalOrder = spaces.map(s => s.id)
    sortSpaces(spaces)
    expect(spaces.map(s => s.id)).toEqual(originalOrder)
  })
})

describe('setDefaultSpace', () => {
  it('should return empty array for non-array input', () => {
    expect(setDefaultSpace(null, '1')).toEqual([])
    expect(setDefaultSpace(undefined, '1')).toEqual([])
  })

  it('should set the specified space as default and clear others', () => {
    const spaces = [
      createMockSpace({ id: '1', isDefault: true }),
      createMockSpace({ id: '2', isDefault: false }),
      createMockSpace({ id: '3', isDefault: false })
    ]
    const result = setDefaultSpace(spaces, '2')
    expect(result.find(s => s.id === '1').isDefault).toBe(false)
    expect(result.find(s => s.id === '2').isDefault).toBe(true)
    expect(result.find(s => s.id === '3').isDefault).toBe(false)
  })

  it('should not set expired space as default', () => {
    const now = new Date('2024-06-01T00:00:00.000Z')
    const spaces = [
      createMockSpace({ id: '1', isDefault: true, expireAt: '2024-07-01T00:00:00.000Z' }),
      createMockSpace({ id: '2', isDefault: false, expireAt: '2024-05-01T00:00:00.000Z' })
    ]
    const result = setDefaultSpace(spaces, '2')
    expect(result.find(s => s.id === '1').isDefault).toBe(true)
    expect(result.find(s => s.id === '2').isDefault).toBe(false)
  })

  it('should return original array if space not found', () => {
    const spaces = [
      createMockSpace({ id: '1', isDefault: true }),
      createMockSpace({ id: '2', isDefault: false })
    ]
    const result = setDefaultSpace(spaces, 'non-existent')
    expect(result).toEqual(spaces)
  })

  it('should not mutate the original array', () => {
    const spaces = [
      createMockSpace({ id: '1', isDefault: true }),
      createMockSpace({ id: '2', isDefault: false })
    ]
    setDefaultSpace(spaces, '2')
    expect(spaces.find(s => s.id === '1').isDefault).toBe(true)
  })
})

describe('getDefaultSpace', () => {
  it('should return null for non-array input', () => {
    expect(getDefaultSpace(null)).toBe(null)
    expect(getDefaultSpace(undefined)).toBe(null)
  })

  it('should return the default space', () => {
    const defaultSpace = createMockSpace({ id: '1', isDefault: true })
    const spaces = [
      createMockSpace({ id: '2', isDefault: false }),
      defaultSpace,
      createMockSpace({ id: '3', isDefault: false })
    ]
    expect(getDefaultSpace(spaces)).toEqual(defaultSpace)
  })

  it('should return null if no default space', () => {
    const spaces = [
      createMockSpace({ id: '1', isDefault: false }),
      createMockSpace({ id: '2', isDefault: false })
    ]
    expect(getDefaultSpace(spaces)).toBe(null)
  })
})

describe('updateLastAccessed', () => {
  it('should return empty array for non-array input', () => {
    expect(updateLastAccessed(null, '1')).toEqual([])
    expect(updateLastAccessed(undefined, '1')).toEqual([])
  })

  it('should update lastAccessedAt for specified space', () => {
    const now = new Date('2024-06-01T12:00:00.000Z')
    const spaces = [
      createMockSpace({ id: '1', lastAccessedAt: '2024-01-01T00:00:00.000Z' }),
      createMockSpace({ id: '2', lastAccessedAt: '2024-01-01T00:00:00.000Z' })
    ]
    const result = updateLastAccessed(spaces, '2', now)
    expect(result.find(s => s.id === '1').lastAccessedAt).toBe('2024-01-01T00:00:00.000Z')
    expect(result.find(s => s.id === '2').lastAccessedAt).toBe(now.toISOString())
  })

  it('should not mutate the original array', () => {
    const now = new Date('2024-06-01T12:00:00.000Z')
    const spaces = [
      createMockSpace({ id: '1', lastAccessedAt: '2024-01-01T00:00:00.000Z' })
    ]
    updateLastAccessed(spaces, '1', now)
    expect(spaces[0].lastAccessedAt).toBe('2024-01-01T00:00:00.000Z')
  })
})

describe('getRecentAccessRecords', () => {
  it('should return empty array for non-array input', () => {
    expect(getRecentAccessRecords(null)).toEqual([])
    expect(getRecentAccessRecords(undefined)).toEqual([])
  })

  it('should return spaces with lastAccessedAt sorted by recent access', () => {
    const space1 = createMockSpace({ id: '1', lastAccessedAt: '2024-06-01T00:00:00.000Z' })
    const space2 = createMockSpace({ id: '2', lastAccessedAt: '2024-06-03T00:00:00.000Z' })
    const space3 = createMockSpace({ id: '3', lastAccessedAt: null })
    const result = getRecentAccessRecords([space1, space2, space3])
    expect(result.map(s => s.id)).toEqual(['2', '1'])
  })

  it('should exclude expired spaces', () => {
    const now = new Date('2024-06-01T00:00:00.000Z')
    const activeSpace = createMockSpace({ id: '1', lastAccessedAt: '2024-06-01T00:00:00.000Z', expireAt: '2024-07-01T00:00:00.000Z' })
    const expiredSpace = createMockSpace({ id: '2', lastAccessedAt: '2024-06-03T00:00:00.000Z', expireAt: '2024-05-01T00:00:00.000Z' })
    const result = getRecentAccessRecords([activeSpace, expiredSpace], 5, now)
    expect(result.map(s => s.id)).toEqual(['1'])
  })

  it('should respect the limit parameter', () => {
    const spaces = [
      createMockSpace({ id: '1', lastAccessedAt: '2024-06-01T00:00:00.000Z' }),
      createMockSpace({ id: '2', lastAccessedAt: '2024-06-02T00:00:00.000Z' }),
      createMockSpace({ id: '3', lastAccessedAt: '2024-06-03T00:00:00.000Z' }),
      createMockSpace({ id: '4', lastAccessedAt: '2024-06-04T00:00:00.000Z' })
    ]
    const result = getRecentAccessRecords(spaces, 2)
    expect(result.length).toBe(2)
    expect(result.map(s => s.id)).toEqual(['4', '3'])
  })

  it('should use default limit of 5', () => {
    const spaces = Array.from({ length: 8 }, (_, i) =>
      createMockSpace({ id: `${i + 1}`, lastAccessedAt: `2024-06-0${i + 1}T00:00:00.000Z` })
    )
    const result = getRecentAccessRecords(spaces)
    expect(result.length).toBe(5)
  })
})

describe('formatDate', () => {
  it('should return "未设置" for null or undefined', () => {
    expect(formatDate(null)).toBe('未设置')
    expect(formatDate(undefined)).toBe('未设置')
    expect(formatDate('')).toBe('未设置')
  })

  it('should format date correctly', () => {
    expect(formatDate('2024-06-15T14:30:00.000Z')).toBe('2024-06-15 14:30')
  })

  it('should pad single digit month and day', () => {
    expect(formatDate('2024-01-05T09:05:00.000Z')).toBe('2024-01-05 09:05')
  })
})

describe('getExpireStatus', () => {
  it('should return "长期有效" for space without expireAt', () => {
    const space = createMockSpace({ expireAt: null })
    const result = getExpireStatus(space)
    expect(result.type).toBe('none')
    expect(result.label).toBe('长期有效')
    expect(result.daysLeft).toBe(Infinity)
  })

  it('should return null/undefined space as "长期有效"', () => {
    expect(getExpireStatus(null).type).toBe('none')
    expect(getExpireStatus(undefined).type).toBe('none')
  })

  it('should detect expired space', () => {
    const now = new Date('2024-06-15T00:00:00.000Z')
    const space = createMockSpace({ expireAt: '2024-06-10T00:00:00.000Z' })
    const result = getExpireStatus(space, now)
    expect(result.type).toBe('expired')
    expect(result.label).toBe('已过期')
    expect(result.daysLeft).toBeLessThan(0)
  })

  it('should warn when expiring within 7 days', () => {
    const now = new Date('2024-06-10T00:00:00.000Z')
    const space = createMockSpace({ expireAt: '2024-06-15T00:00:00.000Z' })
    const result = getExpireStatus(space, now)
    expect(result.type).toBe('warning')
    expect(result.label).toContain('即将过期')
    expect(result.daysLeft).toBe(5)
  })

  it('should notice when expiring within 30 days', () => {
    const now = new Date('2024-06-01T00:00:00.000Z')
    const space = createMockSpace({ expireAt: '2024-06-20T00:00:00.000Z' })
    const result = getExpireStatus(space, now)
    expect(result.type).toBe('notice')
    expect(result.daysLeft).toBe(19)
  })

  it('should return normal status for far future expiration', () => {
    const now = new Date('2024-06-01T00:00:00.000Z')
    const space = createMockSpace({ expireAt: '2025-06-01T00:00:00.000Z' })
    const result = getExpireStatus(space, now)
    expect(result.type).toBe('normal')
    expect(result.daysLeft).toBe(365)
  })

  it('should handle same day correctly', () => {
    const now = new Date('2024-06-15T00:00:00.000Z')
    const space = createMockSpace({ expireAt: '2024-06-15T23:59:59.000Z' })
    const result = getExpireStatus(space, now)
    expect(result.type).toBe('warning')
    expect(result.daysLeft).toBe(1)
  })
})
