export const GESTURE_STATUS = {
  OFF: 'off',
  DRAWING: 'drawing',
  CONFIRMING: 'confirming',
  SET: 'set',
  VERIFYING: 'verifying',
  LOCKED: 'locked'
}

export const GESTURE_STEP = {
  IDLE: 'idle',
  FIRST_DRAW: 'first_draw',
  SECOND_DRAW: 'second_draw',
  VERIFY: 'verify',
  RESET: 'reset'
}

export const MIN_POINTS = 4

export const MAX_ERRORS = 5

export const LOCK_DURATION = 30000

export const POINT_COUNT = 9

export const GESTURE_STATUS_LABELS = {
  [GESTURE_STATUS.OFF]: '未开启',
  [GESTURE_STATUS.DRAWING]: '绘制中',
  [GESTURE_STATUS.CONFIRMING]: '确认中',
  [GESTURE_STATUS.SET]: '已设置',
  [GESTURE_STATUS.VERIFYING]: '验证中',
  [GESTURE_STATUS.LOCKED]: '已锁定'
}

export const GESTURE_STEP_LABELS = {
  [GESTURE_STEP.IDLE]: '请绘制手势密码',
  [GESTURE_STEP.FIRST_DRAW]: '请绘制新手势',
  [GESTURE_STEP.SECOND_DRAW]: '请再次绘制手势',
  [GESTURE_STEP.VERIFY]: '请验证手势密码',
  [GESTURE_STEP.RESET]: '请验证原手势以重置'
}

export const SECURITY_TIPS = [
  {
    id: 1,
    icon: '🔒',
    title: '保护账号安全',
    description: '手势密码用于快速解锁应用，防止他人未经授权访问您的账号'
  },
  {
    id: 2,
    icon: '⚠️',
    title: '避免简单手势',
    description: '请勿使用过于简单的手势（如一字形、L形），建议连接至少4个点位'
  },
  {
    id: 3,
    icon: '💡',
    title: '牢记手势图案',
    description: '请牢记您的手势密码，忘记后需要重新验证身份才能重置'
  }
]
