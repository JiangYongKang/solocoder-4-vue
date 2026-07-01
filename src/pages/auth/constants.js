export const AUTH_ROUTES = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot_password',
  RESET_PASSWORD: 'reset_password',
  CHANGE_PASSWORD: 'change_password',
  PROFILE: 'profile'
}

export const PUBLIC_ROUTES = [
  AUTH_ROUTES.LOGIN,
  AUTH_ROUTES.REGISTER,
  AUTH_ROUTES.FORGOT_PASSWORD,
  AUTH_ROUTES.RESET_PASSWORD
]

export const PROTECTED_ROUTES = [
  AUTH_ROUTES.CHANGE_PASSWORD,
  AUTH_ROUTES.PROFILE
]

export const TOKEN_STORAGE_KEY = 'auth_token'
export const USER_STORAGE_KEY = 'auth_user'
export const TOKEN_EXPIRE_KEY = 'auth_token_expire'

export const TOKEN_DURATION_MS = 24 * 60 * 60 * 1000

export const VALIDATION_RULES = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 50
}

export const ERROR_MESSAGES = {
  USERNAME_REQUIRED: '请输入用户名',
  USERNAME_TOO_SHORT: '用户名至少 3 个字符',
  USERNAME_TOO_LONG: '用户名最多 20 个字符',
  USERNAME_INVALID: '用户名只能包含字母、数字和下划线',

  EMAIL_REQUIRED: '请输入邮箱',
  EMAIL_INVALID: '邮箱格式不正确',

  PASSWORD_REQUIRED: '请输入密码',
  PASSWORD_TOO_SHORT: '密码至少 8 个字符',
  PASSWORD_TOO_LONG: '密码最多 50 个字符',
  PASSWORD_WEAK: '密码需要包含大小写字母和数字',
  PASSWORD_MISMATCH: '两次输入的密码不一致',

  CONFIRM_PASSWORD_REQUIRED: '请确认密码',
  CURRENT_PASSWORD_REQUIRED: '请输入当前密码',
  NEW_PASSWORD_REQUIRED: '请输入新密码',

  LOGIN_FAILED: '用户名或密码错误',
  REGISTER_DUPLICATE: '用户名已存在',
  INVALID_TOKEN: '登录状态已失效，请重新登录',
  PASSWORD_CHANGE_REQUIRE_LOGIN: '请先登录后再修改密码',
  WRONG_CURRENT_PASSWORD: '当前密码不正确'
}

export const ROUTE_TITLES = {
  [AUTH_ROUTES.LOGIN]: '登录',
  [AUTH_ROUTES.REGISTER]: '注册',
  [AUTH_ROUTES.FORGOT_PASSWORD]: '找回密码',
  [AUTH_ROUTES.RESET_PASSWORD]: '重置密码',
  [AUTH_ROUTES.CHANGE_PASSWORD]: '修改密码',
  [AUTH_ROUTES.PROFILE]: '个人中心'
}
