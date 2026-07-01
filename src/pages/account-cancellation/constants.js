export const CANCELLATION_STATUS = {
  NOT_APPLIED: 'not_applied',
  COOLING_PERIOD: 'cooling_period',
  REVOKED: 'revoked',
  COMPLETED: 'completed'
}

export const VERIFICATION_METHOD = {
  PASSWORD: 'password',
  SMS_CODE: 'sms_code',
  EMAIL_CODE: 'email_code'
}

export const DATA_CLEAR_SCOPE = {
  IMMEDIATE: 'immediate',
  COOLING_PERIOD_END: 'cooling_period_end',
  RETAINED: 'retained'
}

export const STATUS_LABELS = {
  [CANCELLATION_STATUS.NOT_APPLIED]: '未申请',
  [CANCELLATION_STATUS.COOLING_PERIOD]: '冷静期中',
  [CANCELLATION_STATUS.REVOKED]: '已撤销',
  [CANCELLATION_STATUS.COMPLETED]: '已完成'
}

export const VERIFICATION_METHOD_LABELS = {
  [VERIFICATION_METHOD.PASSWORD]: '账号密码',
  [VERIFICATION_METHOD.SMS_CODE]: '手机验证码',
  [VERIFICATION_METHOD.EMAIL_CODE]: '邮箱验证码'
}

export const COOLING_PERIOD_DAYS = 7

export const DATA_IMPACT_CATEGORIES = {
  PERSONAL_DATA: 'personal_data',
  ORDER_DATA: 'order_data',
  ASSET_DATA: 'asset_data',
  PRIVILEGE_DATA: 'privilege_data',
  SOCIAL_DATA: 'social_data'
}

export const DATA_CLEAR_SCOPE_LABELS = {
  [DATA_CLEAR_SCOPE.IMMEDIATE]: '申请提交后立即清除',
  [DATA_CLEAR_SCOPE.COOLING_PERIOD_END]: '冷静期结束后清除',
  [DATA_CLEAR_SCOPE.RETAINED]: '依法依规保留'
}

export const VERIFICATION_ERRORS = {
  EMPTY_PASSWORD: '请输入登录密码',
  WRONG_PASSWORD: '密码错误，请重试',
  EMPTY_CODE: '请输入验证码',
  INVALID_CODE: '验证码格式不正确',
  WRONG_CODE: '验证码错误或已过期',
  TOO_MANY_ATTEMPTS: '验证失败次数过多，请稍后再试',
  NETWORK_ERROR: '网络错误，请稍后重试'
}

export const MAX_VERIFICATION_ATTEMPTS = 5

export const SMS_CODE_LENGTH = 6
export const EMAIL_CODE_LENGTH = 6
export const PASSWORD_MIN_LENGTH = 6
