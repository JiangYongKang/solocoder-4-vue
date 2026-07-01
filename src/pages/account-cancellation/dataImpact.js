import { DATA_CLEAR_SCOPE, DATA_CLEAR_SCOPE_LABELS, DATA_IMPACT_CATEGORIES } from './constants.js'

export const DATA_IMPACTS = [
  {
    id: DATA_IMPACT_CATEGORIES.PERSONAL_DATA,
    icon: '👤',
    title: '个人资料',
    description: '昵称、头像、个人简介、联系方式等基本信息',
    items: [
      { name: '昵称与头像', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true },
      { name: '真实姓名与证件信息', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true },
      { name: '手机号码', scope: DATA_CLEAR_SCOPE.COOLING_PERIOD_END, irreversible: true },
      { name: '邮箱地址', scope: DATA_CLEAR_SCOPE.COOLING_PERIOD_END, irreversible: true },
      { name: '收货地址', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true }
    ]
  },
  {
    id: DATA_IMPACT_CATEGORIES.ORDER_DATA,
    icon: '📦',
    title: '订单与交易记录',
    description: '历史订单、支付记录、发票信息等交易数据',
    items: [
      { name: '历史订单记录', scope: DATA_CLEAR_SCOPE.COOLING_PERIOD_END, irreversible: true },
      { name: '支付与退款记录', scope: DATA_CLEAR_SCOPE.RETAINED, irreversible: false, retentionDesc: '依法保留5年用于财务审计' },
      { name: '发票与报销记录', scope: DATA_CLEAR_SCOPE.RETAINED, irreversible: false, retentionDesc: '依法保留10年用于税务合规' },
      { name: '购物车与收藏夹', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true }
    ]
  },
  {
    id: DATA_IMPACT_CATEGORIES.ASSET_DATA,
    icon: '💰',
    title: '账户资产与权益',
    description: '余额、积分、优惠券、会员等资产将被清零且无法恢复',
    warningLevel: 'high',
    items: [
      { name: '账户余额', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true, note: '请在注销前提现至银行卡' },
      { name: '积分与成长值', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true, note: '将全部清零，无法转移或恢复' },
      { name: '优惠券与红包', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true },
      { name: '会员与订阅服务', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true, note: '剩余时长不支持退款' },
      { name: '虚拟商品与游戏道具', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true }
    ]
  },
  {
    id: DATA_IMPACT_CATEGORIES.PRIVILEGE_DATA,
    icon: '🎖️',
    title: '权限与资格',
    description: '认证资格、准入权限等将被永久取消',
    items: [
      { name: '实名认证状态', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true },
      { name: '商家/创作者资格', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true },
      { name: '平台准入白名单', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true },
      { name: 'API 访问密钥', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true }
    ]
  },
  {
    id: DATA_IMPACT_CATEGORIES.SOCIAL_DATA,
    icon: '💬',
    title: '社交与互动数据',
    description: '好友关系、评论、发帖等社交内容',
    items: [
      { name: '好友与关注列表', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true },
      { name: '发帖与评论内容', scope: DATA_CLEAR_SCOPE.COOLING_PERIOD_END, irreversible: true },
      { name: '点赞与收藏记录', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true },
      { name: '私信与群聊记录', scope: DATA_CLEAR_SCOPE.IMMEDIATE, irreversible: true }
    ]
  }
]

export const IRREVERSIBLE_RISKS = [
  {
    id: 'login_loss',
    icon: '🚫',
    title: '账号无法登录',
    description: '注销完成后，您将无法再使用该账号登录平台，相关登录凭证将永久失效。'
  },
  {
    id: 'asset_loss',
    icon: '💸',
    title: '资产全部清零',
    description: '账户内所有余额、积分、优惠券、会员权益等将被清零，且不支持退款或转移。'
  },
  {
    id: 'data_loss',
    icon: '🗑️',
    title: '数据永久删除',
    description: '除法律法规要求保留的数据外，其他个人数据、交易记录、社交内容等将永久删除且无法恢复。'
  },
  {
    id: 'qualification_loss',
    icon: '📋',
    title: '资格永久取消',
    description: '实名认证、商家资格、创作者权限等将被永久取消，重新注册需从头申请。'
  },
  {
    id: 're_register',
    icon: '🔄',
    title: '绑定信息释放',
    description: '手机号、邮箱等绑定信息将被释放，可用于重新注册新账号，但原账号数据不会迁移。'
  }
]

export function getDataImpactsByScope(scope) {
  const result = []
  for (const category of DATA_IMPACTS) {
    const matchedItems = category.items.filter(item => item.scope === scope)
    if (matchedItems.length > 0) {
      result.push({
        ...category,
        items: matchedItems
      })
    }
  }
  return result
}

export function getIrreversibleItems() {
  const result = []
  for (const category of DATA_IMPACTS) {
    const irreversibleItems = category.items.filter(item => item.irreversible)
    if (irreversibleItems.length > 0) {
      result.push({
        ...category,
        items: irreversibleItems
      })
    }
  }
  return result
}

export function getHighRiskCategories() {
  return DATA_IMPACTS.filter(category => category.warningLevel === 'high')
}

export function getScopeLabel(scope) {
  return DATA_CLEAR_SCOPE_LABELS[scope] || ''
}

export function countDataItems() {
  let total = 0
  let irreversible = 0
  for (const category of DATA_IMPACTS) {
    total += category.items.length
    irreversible += category.items.filter(item => item.irreversible).length
  }
  return { total, irreversible }
}
