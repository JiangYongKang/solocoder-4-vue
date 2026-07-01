import { MEMBER_ROLES } from './utils.js'

export function generateMockSpaces() {
  const now = new Date()
  const futureDate = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
  const pastDate = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

  return [
    {
      id: 'space-1',
      name: 'GoletaLab 研发中心',
      role: MEMBER_ROLES.OWNER,
      isDefault: true,
      expireAt: null,
      lastAccessedAt: pastDate(0.1),
      createdAt: pastDate(365)
    },
    {
      id: 'space-2',
      name: '产品设计团队',
      role: MEMBER_ROLES.ADMIN,
      isDefault: false,
      expireAt: futureDate(3),
      lastAccessedAt: pastDate(1),
      createdAt: pastDate(200)
    },
    {
      id: 'space-3',
      name: '市场营销部',
      role: MEMBER_ROLES.MEMBER,
      isDefault: false,
      expireAt: futureDate(15),
      lastAccessedAt: pastDate(3),
      createdAt: pastDate(150)
    },
    {
      id: 'space-4',
      name: '人力资源',
      role: MEMBER_ROLES.MEMBER,
      isDefault: false,
      expireAt: futureDate(45),
      lastAccessedAt: pastDate(7),
      createdAt: pastDate(100)
    },
    {
      id: 'space-5',
      name: '客户成功团队',
      role: MEMBER_ROLES.GUEST,
      isDefault: false,
      expireAt: futureDate(90),
      lastAccessedAt: pastDate(14),
      createdAt: pastDate(60)
    },
    {
      id: 'space-6',
      name: '旧版测试空间',
      role: MEMBER_ROLES.MEMBER,
      isDefault: false,
      expireAt: pastDate(5),
      lastAccessedAt: pastDate(20),
      createdAt: pastDate(400)
    },
    {
      id: 'space-7',
      name: '临时项目组',
      role: MEMBER_ROLES.ADMIN,
      isDefault: false,
      expireAt: pastDate(30),
      lastAccessedAt: pastDate(45),
      createdAt: pastDate(300)
    },
    {
      id: 'space-8',
      name: '数据安全委员会',
      role: MEMBER_ROLES.MEMBER,
      isDefault: false,
      expireAt: null,
      lastAccessedAt: null,
      createdAt: pastDate(50)
    }
  ]
}
