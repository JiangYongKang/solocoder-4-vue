<template>
  <div class="auth-system">
    <nav v-if="showNav" class="auth-nav">
      <div class="nav-container">
        <div class="nav-brand">
          <span class="brand-icon">🔐</span>
          <span class="brand-name">用户认证系统</span>
        </div>
        <div v-if="authenticated" class="nav-user">
          <span class="user-label">{{ currentUser?.username }}</span>
          <button class="nav-btn nav-profile" @click="navigate(AUTH_ROUTES.PROFILE)">
            <span>👤</span>
            <span class="nav-text">个人中心</span>
          </button>
          <button class="nav-btn nav-logout" @click="handleNavLogout">
            <span>🚪</span>
            <span class="nav-text">退出</span>
          </button>
        </div>
        <div v-else class="nav-links">
          <button
            v-for="route in publicNavRoutes"
            :key="route.key"
            class="nav-btn"
            :class="{ active: currentRoute === route.key }"
            @click="navigate(route.key)"
          >
            <span>{{ route.icon }}</span>
            <span class="nav-text">{{ route.label }}</span>
          </button>
        </div>
      </div>
    </nav>

    <div v-if="accessBlocked" class="access-denied">
      <div class="denied-icon">🚫</div>
      <div class="denied-title">访问受限</div>
      <div class="denied-reason">{{ accessReason }}</div>
      <button class="btn btn-primary" @click="navigate(redirectTo)">
        {{ blockedBtnText }}
      </button>
    </div>

    <main v-else class="auth-main">
      <component
        :is="currentComponent"
        :token-expire-at="tokenExpireAt"
        @navigate="handleNavigate"
        @login-success="handleLoginSuccess"
        @logout="handleLogout"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, provide } from 'vue'
import {
  AUTH_ROUTES,
  ROUTE_TITLES,
  PUBLIC_ROUTES
} from './constants.js'
import {
  initAuthState,
  isAuthenticated,
  getUser,
  getToken,
  canAccessRoute,
  getDefaultRoute,
  logoutUser,
  getTokenExpireAt
} from './authState.js'

import LoginPage from './LoginPage.vue'
import RegisterPage from './RegisterPage.vue'
import ForgotPasswordPage from './ForgotPasswordPage.vue'
import ChangePasswordPage from './ChangePasswordPage.vue'
import ProfilePage from './ProfilePage.vue'

const componentMap = {
  [AUTH_ROUTES.LOGIN]: LoginPage,
  [AUTH_ROUTES.REGISTER]: RegisterPage,
  [AUTH_ROUTES.FORGOT_PASSWORD]: ForgotPasswordPage,
  [AUTH_ROUTES.RESET_PASSWORD]: ForgotPasswordPage,
  [AUTH_ROUTES.CHANGE_PASSWORD]: ChangePasswordPage,
  [AUTH_ROUTES.PROFILE]: ProfilePage
}

const publicNavRoutes = [
  { key: AUTH_ROUTES.LOGIN, label: '登录', icon: '🔑' },
  { key: AUTH_ROUTES.REGISTER, label: '注册', icon: '✨' },
  { key: AUTH_ROUTES.FORGOT_PASSWORD, label: '找回密码', icon: '🔍' }
]

const props = defineProps({
  initialRoute: {
    type: String,
    default: null
  },
  showNav: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['routeChange', 'authStateChange'])

const currentRoute = ref(AUTH_ROUTES.LOGIN)
const authenticated = ref(false)
const accessBlocked = ref(false)
const accessReason = ref('')
const redirectTo = ref(AUTH_ROUTES.LOGIN)
const currentUser = ref(null)
const tokenExpireAt = ref(null)
const authVersion = ref(0)

onMounted(() => {
  initAuthState()
  refreshAuthState()

  if (props.initialRoute) {
    handleNavigate(props.initialRoute)
  } else {
    const defaultRoute = getDefaultRoute(authenticated.value)
    handleNavigate(defaultRoute)
  }
})

function refreshAuthState() {
  authenticated.value = isAuthenticated()
  currentUser.value = getUser()
  tokenExpireAt.value = getTokenExpireAt()
  authVersion.value++
}

const currentComponent = computed(() => {
  return componentMap[currentRoute.value] || LoginPage
})

const blockedBtnText = computed(() => {
  if (redirectTo.value === AUTH_ROUTES.LOGIN) return '去登录'
  if (redirectTo.value === AUTH_ROUTES.PROFILE) return '去个人中心'
  return '返回'
})

function checkAccess(route) {
  const accessResult = canAccessRoute(route, authenticated.value)
  if (!accessResult.allowed) {
    accessBlocked.value = true
    accessReason.value = accessResult.reason
    redirectTo.value = accessResult.redirectTo
    return false
  }
  accessBlocked.value = false
  accessReason.value = ''
  redirectTo.value = null
  return true
}

function handleNavigate(route) {
  if (!Object.values(AUTH_ROUTES).includes(route)) {
    route = getDefaultRoute(authenticated.value)
  }

  refreshAuthState()

  if (!checkAccess(route)) {
    emit('routeChange', {
      route: redirectTo.value,
      blocked: true,
      originalRoute: route,
      reason: accessReason.value
    })
    return
  }

  currentRoute.value = route
  emit('routeChange', {
    route,
    blocked: false,
    title: ROUTE_TITLES[route]
  })
}

function navigate(route) {
  handleNavigate(route)
}

function handleLoginSuccess() {
  refreshAuthState()
  emit('authStateChange', {
    authenticated: true,
    user: currentUser.value,
    token: getToken()
  })
}

function handleLogout() {
  logoutUser()
  refreshAuthState()
  emit('authStateChange', {
    authenticated: false,
    user: null,
    token: null
  })
}

function handleNavLogout() {
  handleLogout()
  handleNavigate(AUTH_ROUTES.LOGIN)
}

watch(currentRoute, (newRoute) => {
  checkAccess(newRoute)
})

provide('authNavigate', navigate)
provide('authState', {
  authenticated,
  currentUser,
  authVersion,
  tokenExpireAt
})

defineExpose({
  navigate,
  getCurrentRoute: () => currentRoute.value,
  isAuthenticated: () => authenticated.value,
  getCurrentUser: () => currentUser.value,
  refresh: refreshAuthState
})
</script>

<style scoped>
.auth-system {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.auth-nav {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
  color: #111827;
}

.brand-icon {
  font-size: 22px;
}

.brand-name {
  white-space: nowrap;
}

.nav-links,
.nav-user {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-user {
  gap: 8px;
}

.user-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  padding: 6px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-btn.active {
  background: #eff6ff;
  color: #3b82f6;
}

.nav-logout {
  color: #ef4444;
}

.nav-logout:hover {
  background: #fef2f2;
  color: #dc2626;
}

.auth-main {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.access-denied {
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.denied-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.denied-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.denied-reason {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
  max-width: 360px;
}

.btn {
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

@media (max-width: 640px) {
  .nav-container {
    padding: 0 16px;
  }

  .nav-btn {
    padding: 8px 10px;
  }

  .nav-text {
    display: none;
  }

  .nav-btn span:first-child {
    font-size: 18px;
  }

  .user-label {
    max-width: 80px;
    font-size: 12px;
    padding: 5px 8px;
  }

  .brand-name {
    display: none;
  }
}

@media (max-width: 375px) {
  .nav-container {
    height: 56px;
  }

  .auth-main {
    min-height: calc(100vh - 56px);
  }

  .access-denied {
    min-height: calc(100vh - 56px);
  }
}
</style>
