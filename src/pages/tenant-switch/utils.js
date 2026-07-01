export const MEMBER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  GUEST: 'guest'
}

export const ROLE_LABELS = {
  [MEMBER_ROLES.OWNER]: '所有者',
  [MEMBER_ROLES.ADMIN]: '管理员',
  [MEMBER_ROLES.MEMBER]: '成员',
  [MEMBER_ROLES.GUEST]: '访客'
}

export function isSpaceExpired(space, now = new Date()) {
  if (!space || !space.expireAt) return false
  const expireDate = new Date(space.expireAt)
  return expireDate < now
}

export function isSpaceActive(space, now = new Date()) {
  return !isSpaceExpired(space, now)
}

export function sortSpaces(spaces, currentSpaceId = null, now = new Date()) {
  if (!Array.isArray(spaces)) return []

  return [...spaces].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1

    if (a.id === currentSpaceId && b.id !== currentSpaceId) return -1
    if (a.id !== currentSpaceId && b.id === currentSpaceId) return 1

    const aExpired = isSpaceExpired(a, now)
    const bExpired = isSpaceExpired(b, now)
    if (!aExpired && bExpired) return -1
    if (aExpired && !bExpired) return 1

    const aLastAccess = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0
    const bLastAccess = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0
    if (aLastAccess !== bLastAccess) return bLastAccess - aLastAccess

    const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bCreatedAt - aCreatedAt
  })
}

export function setDefaultSpace(spaces, spaceId, now = new Date()) {
  if (!Array.isArray(spaces)) return []

  const targetSpace = spaces.find(s => s.id === spaceId)
  if (!targetSpace || isSpaceExpired(targetSpace, now)) {
    return spaces
  }

  return spaces.map(space => ({
    ...space,
    isDefault: space.id === spaceId
  }))
}

export function getDefaultSpace(spaces) {
  if (!Array.isArray(spaces)) return null
  return spaces.find(space => space.isDefault) || null
}

export function updateLastAccessed(spaces, spaceId, now = new Date()) {
  if (!Array.isArray(spaces)) return []

  return spaces.map(space => {
    if (space.id === spaceId) {
      return {
        ...space,
        lastAccessedAt: now.toISOString()
      }
    }
    return space
  })
}

export function getRecentAccessRecords(spaces, limit = 5, now = new Date()) {
  if (!Array.isArray(spaces)) return []

  const accessedSpaces = spaces
    .filter(space => space.lastAccessedAt && !isSpaceExpired(space, now))
    .sort((a, b) => {
      const aTime = new Date(a.lastAccessedAt).getTime()
      const bTime = new Date(b.lastAccessedAt).getTime()
      return bTime - aTime
    })

  return accessedSpaces.slice(0, limit)
}

export function formatDate(dateString) {
  if (!dateString) return '未设置'
  const date = new Date(dateString)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function getExpireStatus(space, now = new Date()) {
  if (!space || !space.expireAt) {
    return { type: 'none', label: '长期有效', daysLeft: Infinity }
  }

  const expireDate = new Date(space.expireAt)
  const diffTime = expireDate - now
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return { type: 'expired', label: '已过期', daysLeft }
  } else if (daysLeft <= 7) {
    return { type: 'warning', label: `即将过期 (${daysLeft}天)`, daysLeft }
  } else if (daysLeft <= 30) {
    return { type: 'notice', label: `${daysLeft}天后过期`, daysLeft }
  }

  return { type: 'normal', label: `${daysLeft}天后过期`, daysLeft }
}
