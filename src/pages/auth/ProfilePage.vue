<template>
  <div class="profile-wrapper">
    <div class="container">
      <header class="profile-header">
        <div class="header-left">
          <div class="user-avatar">{{ avatarLetter }}</div>
          <div class="user-info">
            <div class="user-name">{{ user?.username }}</div>
            <div class="user-email">{{ user?.email }}</div>
          </div>
        </div>
        <div class="header-right">
          <div class="auth-status verified">
            <span class="status-dot"></span>
            <span>已登录</span>
          </div>
        </div>
      </header>

      <div class="token-card">
        <div class="card-icon">🎫</div>
        <div class="card-content">
          <div class="card-label">访问令牌</div>
          <div class="card-value token-value">{{ tokenDisplay }}</div>
          <div class="card-meta">
            <span class="meta-item">
              <span class="meta-icon">⏰</span>
              有效期至：{{ expireAtDisplay }}
            </span>
            <span class="meta-item">
              <span class="meta-icon">📊</span>
              剩余：{{ remainingTimeDisplay }}
            </span>
          </div>
        </div>
      </div>

      <div class="action-section">
        <h2 class="section-title">账号设置</h2>
        <div class="action-grid">
          <button
            class="action-card"
            @click="handleChangePassword"
          >
            <div class="action-icon">🔑</div>
            <div class="action-content">
              <div class="action-title">修改密码</div>
              <div class="action-desc">定期修改密码保护账号安全</div>
            </div>
            <div class="action-arrow">→</div>
          </button>

          <button
            class="action-card danger"
            @click="handleLogout"
          >
            <div class="action-icon">🚪</div>
            <div class="action-content">
              <div class="action-title">退出登录</div>
              <div class="action-desc">清除当前会话，返回登录页</div>
            </div>
            <div class="action-arrow">→</div>
          </button>
        </div>
      </div>

      <div class="info-section">
        <h2 class="section-title">安全提示</h2>
        <div class="tips-list">
          <div class="tip-item">
            <div class="tip-icon">🛡️</div>
            <div class="tip-content">
              <div class="tip-title">请勿泄露密码</div>
              <div class="tip-desc">请勿将密码告知他人，客服不会向您索要密码</div>
            </div>
          </div>
          <div class="tip-item">
            <div class="tip-icon">📱</div>
            <div class="tip-content">
              <div class="tip-title">警惕钓鱼链接</div>
              <div class="tip-desc">请通过官方渠道访问，避免点击可疑链接</div>
            </div>
          </div>
          <div class="tip-item">
            <div class="tip-icon">🔐</div>
            <div class="tip-content">
              <div class="tip-title">使用强密码</div>
              <div class="tip-desc">建议使用包含大小写字母、数字的复杂密码</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="logoutConfirm" class="modal-overlay" @click.self="cancelLogout">
      <div class="modal-card">
        <div class="modal-icon">⚠️</div>
        <div class="modal-title">确认退出登录？</div>
        <div class="modal-desc">退出后需要重新输入账号密码才能登录</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="cancelLogout">
            取消
          </button>
          <button class="btn btn-danger" :disabled="isLoggingOut" @click="confirmLogout">
            <span v-if="isLoggingOut" class="btn-spinner"></span>
            {{ isLoggingOut ? '退出中...' : '确认退出' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { AUTH_ROUTES } from './constants.js'
import { getUser, getToken, logoutUser } from './authState.js'

const props = defineProps({
  tokenExpireAt: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['navigate', 'logout'])

const logoutConfirm = ref(false)
const isLoggingOut = ref(false)
const currentTime = ref(Date.now())
let timer = null

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

const user = computed(() => getUser())
const token = computed(() => getToken())

const avatarLetter = computed(() => {
  return user.value?.username?.[0]?.toUpperCase() || '?'
})

const tokenDisplay = computed(() => {
  const t = token.value
  if (!t) return '-'
  if (t.length <= 12) return t
  return t.substring(0, 6) + '...' + t.substring(t.length - 6)
})

const expireAtDisplay = computed(() => {
  if (!props.tokenExpireAt) return '-'
  const date = new Date(props.tokenExpireAt)
  return date.toLocaleString('zh-CN')
})

const remainingTimeDisplay = computed(() => {
  if (!props.tokenExpireAt) return '-'
  const remaining = props.tokenExpireAt - currentTime.value
  if (remaining <= 0) return '已过期'

  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分${seconds}秒`
  } else {
    return `${seconds}秒`
  }
})

function handleChangePassword() {
  emit('navigate', AUTH_ROUTES.CHANGE_PASSWORD)
}

function handleLogout() {
  logoutConfirm.value = true
}

function cancelLogout() {
  logoutConfirm.value = false
}

async function confirmLogout() {
  isLoggingOut.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  logoutUser()
  emit('logout')
  isLoggingOut.value = false
  logoutConfirm.value = false
  emit('navigate', AUTH_ROUTES.LOGIN)
}
</script>

<style scoped>
.profile-wrapper {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

.profile-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 16px;
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  color: #ffffff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  backdrop-filter: blur(4px);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.user-email {
  font-size: 13px;
  opacity: 0.85;
}

.auth-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.token-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.card-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
}

.card-value {
  font-size: 14px;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  color: #111827;
  font-weight: 600;
  word-break: break-all;
  margin-bottom: 12px;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  font-size: 12px;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-icon {
  font-size: 14px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.action-section {
  margin-bottom: 24px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.action-card:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.action-card.danger:hover {
  border-color: #ef4444;
  background: #fef2f2;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
}

.action-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
  min-width: 0;
}

.action-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.action-arrow {
  font-size: 20px;
  color: #9ca3af;
  transition: all 0.2s;
}

.action-card:hover .action-arrow {
  color: #3b82f6;
  transform: translateX(4px);
}

.action-card.danger:hover .action-arrow {
  color: #ef4444;
}

.info-section {
  margin-bottom: 24px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  background: #ffffff;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.tip-icon {
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.tip-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.modal-desc {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 12px 24px;
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

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-secondary .btn-spinner {
  border-color: rgba(55, 65, 81, 0.3);
  border-top-color: #374151;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .profile-header {
    padding: 24px;
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .card-meta {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 375px) {
  .container {
    padding: 0 16px;
  }

  .profile-header {
    padding: 20px;
    border-radius: 12px;
  }

  .user-avatar {
    width: 52px;
    height: 52px;
    font-size: 22px;
  }

  .user-name {
    font-size: 18px;
  }

  .user-email {
    font-size: 12px;
  }

  .token-card {
    padding: 16px;
    flex-direction: column;
    gap: 12px;
  }

  .card-icon {
    font-size: 32px;
  }

  .action-card {
    padding: 16px;
  }

  .action-icon {
    font-size: 28px;
  }

  .modal-card {
    padding: 24px 20px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
