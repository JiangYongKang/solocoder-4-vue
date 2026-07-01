export const DEVICE_AUTH_STATUS = {
  PENDING_SCAN: 'pending_scan',
  SCANNED_PENDING: 'scanned_pending',
  AUTHORIZED: 'authorized',
  REJECTED: 'rejected',
  TIMEOUT: 'timeout',
  RISK: 'risk'
}

export const DEVICE_AUTH_STATUS_LABELS = {
  [DEVICE_AUTH_STATUS.PENDING_SCAN]: '待扫描',
  [DEVICE_AUTH_STATUS.SCANNED_PENDING]: '待确认',
  [DEVICE_AUTH_STATUS.AUTHORIZED]: '授权成功',
  [DEVICE_AUTH_STATUS.REJECTED]: '已拒绝',
  [DEVICE_AUTH_STATUS.TIMEOUT]: '已超时',
  [DEVICE_AUTH_STATUS.RISK]: '异常风险'
}

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
}

export const RISK_LEVEL_LABELS = {
  [RISK_LEVELS.LOW]: '低风险',
  [RISK_LEVELS.MEDIUM]: '中风险',
  [RISK_LEVELS.HIGH]: '高风险'
}

export const DEVICE_TYPES = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
  TABLET: 'tablet',
  UNKNOWN: 'unknown'
}

export const DEVICE_TYPE_LABELS = {
  [DEVICE_TYPES.DESKTOP]: '桌面设备',
  [DEVICE_TYPES.MOBILE]: '移动设备',
  [DEVICE_TYPES.TABLET]: '平板设备',
  [DEVICE_TYPES.UNKNOWN]: '未知设备'
}

export const DEFAULT_QR_TIMEOUT = 120

export const MOCK_DEVICE_INFO = {
  deviceName: 'MacBook Pro (16-inch, 2023)',
  deviceType: DEVICE_TYPES.DESKTOP,
  osName: 'macOS',
  osVersion: 'Sonoma 14.2',
  browserName: 'Chrome',
  browserVersion: '120.0.0.0',
  ipAddress: '192.168.1.100',
  loginLocation: '广东省深圳市南山区',
  approximateLocation: '中国 · 深圳'
}

export const MOCK_RISK_DEVICE_INFO = {
  deviceName: 'Unknown Device X789',
  deviceType: DEVICE_TYPES.UNKNOWN,
  osName: '未知系统',
  osVersion: '未知版本',
  browserName: '未知浏览器',
  browserVersion: '未知',
  ipAddress: '45.33.32.156',
  loginLocation: '北京市朝阳区（异常地点）',
  approximateLocation: '中国 · 北京',
  riskLevel: RISK_LEVELS.HIGH,
  riskReasons: [
    '该设备从未在您的常用地点登录',
    'IP地址归属地与常用地不符',
    '浏览器指纹异常'
  ]
}

export const STATUS_DESCRIPTIONS = {
  [DEVICE_AUTH_STATUS.PENDING_SCAN]: '请使用已登录的移动设备扫描二维码',
  [DEVICE_AUTH_STATUS.SCANNED_PENDING]: '已扫描，请在下方确认是否授权该设备登录',
  [DEVICE_AUTH_STATUS.AUTHORIZED]: '设备授权成功，新设备可正常登录',
  [DEVICE_AUTH_STATUS.REJECTED]: '已拒绝该设备的登录请求',
  [DEVICE_AUTH_STATUS.TIMEOUT]: '二维码已过期，请刷新重新获取',
  [DEVICE_AUTH_STATUS.RISK]: '检测到异常登录风险，请谨慎确认'
}

export const STATUS_ICONS = {
  [DEVICE_AUTH_STATUS.PENDING_SCAN]: '📱',
  [DEVICE_AUTH_STATUS.SCANNED_PENDING]: '✅',
  [DEVICE_AUTH_STATUS.AUTHORIZED]: '🎉',
  [DEVICE_AUTH_STATUS.REJECTED]: '🚫',
  [DEVICE_AUTH_STATUS.TIMEOUT]: '⏰',
  [DEVICE_AUTH_STATUS.RISK]: '⚠️'
}

export const STATUS_COLORS = {
  [DEVICE_AUTH_STATUS.PENDING_SCAN]: '#3b82f6',
  [DEVICE_AUTH_STATUS.SCANNED_PENDING]: '#f59e0b',
  [DEVICE_AUTH_STATUS.AUTHORIZED]: '#10b981',
  [DEVICE_AUTH_STATUS.REJECTED]: '#6b7280',
  [DEVICE_AUTH_STATUS.TIMEOUT]: '#ef4444',
  [DEVICE_AUTH_STATUS.RISK]: '#dc2626'
}
