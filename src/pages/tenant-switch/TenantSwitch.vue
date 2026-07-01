<template>
  <div class="tenant-switch">
    <div class="tenant-switch__container">
      <header class="tenant-switch__header">
        <div>
          <h1 class="tenant-switch__title">切换组织空间</h1>
          <p class="tenant-switch__subtitle">选择您要进入的组织空间</p>
        </div>
        <button
          class="tenant-switch__invite-btn"
          @click="handleInvite"
          :disabled="loading"
        >
          <svg class="tenant-switch__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          邀请成员
        </button>
      </header>

      <div class="tenant-switch__notification" v-if="notification.show" :class="`tenant-switch__notification--${notification.type}`">
        <svg class="tenant-switch__notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-if="notification.type === 'success'">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <svg class="tenant-switch__notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-else>
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>{{ notification.message }}</span>
      </div>

      <section class="tenant-switch__recent" v-if="!loading && recentSpaces.length > 0">
        <h2 class="tenant-switch__section-title">
          <svg class="tenant-switch__icon tenant-switch__icon--small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          最近访问
        </h2>
        <div class="tenant-switch__recent-list">
          <button
            v-for="space in recentSpaces"
            :key="space.id"
            class="tenant-switch__recent-item"
            @click="handleSwitchSpace(space)"
            :disabled="switchingSpaceId === space.id"
          >
            <span class="tenant-switch__recent-name">{{ space.name }}</span>
            <span class="tenant-switch__recent-time">{{ formatRelativeTime(space.lastAccessedAt) }}</span>
          </button>
        </div>
      </section>

      <section class="tenant-switch__content">
        <div class="tenant-switch__loading" v-if="loading">
          <div class="tenant-switch__spinner"></div>
          <p>正在加载空间列表...</p>
        </div>

        <div class="tenant-switch__empty" v-else-if="sortedSpaces.length === 0">
          <svg class="tenant-switch__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <h3>暂无组织空间</h3>
          <p>您还没有加入任何组织空间，请联系管理员邀请您加入。</p>
        </div>

        <div class="tenant-switch__list" v-else>
          <h2 class="tenant-switch__section-title">
            <svg class="tenant-switch__icon tenant-switch__icon--small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            全部空间 ({{ sortedSpaces.length }})
          </h2>
          <div class="tenant-switch__cards">
            <div
              v-for="space in sortedSpaces"
              :key="space.id"
              class="tenant-switch__card"
              :class="{
                'tenant-switch__card--expired': isSpaceExpired(space),
                'tenant-switch__card--current': currentSpaceId === space.id,
                'tenant-switch__card--default': space.isDefault
              }"
            >
              <div class="tenant-switch__card-badges" v-if="space.isDefault || isSpaceExpired(space) || currentSpaceId === space.id">
                <span class="tenant-switch__badge tenant-switch__badge--default" v-if="space.isDefault">
                  <svg viewBox="0 0 24 24" fill="currentColor" class="tenant-switch__badge-icon">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  默认
                </span>
                <span class="tenant-switch__badge tenant-switch__badge--current" v-if="currentSpaceId === space.id">
                  当前
                </span>
                <span class="tenant-switch__badge tenant-switch__badge--expired" v-if="isSpaceExpired(space)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tenant-switch__badge-icon">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  已过期
                </span>
              </div>

              <div class="tenant-switch__card-header">
                <div class="tenant-switch__card-avatar">
                  {{ space.name.charAt(0).toUpperCase() }}
                </div>
                <div class="tenant-switch__card-info">
                  <h3 class="tenant-switch__card-name">{{ space.name }}</h3>
                  <span class="tenant-switch__card-role" :class="`tenant-switch__card-role--${space.role}`">
                    {{ ROLE_LABELS[space.role] }}
                  </span>
                </div>
              </div>

              <div class="tenant-switch__card-meta">
                <div class="tenant-switch__meta-item">
                  <svg class="tenant-switch__meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span :class="`tenant-switch__expire--${getExpireStatus(space).type}`">
                    {{ getExpireStatus(space).label }}
                  </span>
                </div>
                <div class="tenant-switch__meta-item" v-if="space.lastAccessedAt">
                  <svg class="tenant-switch__meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>最近访问: {{ formatDate(space.lastAccessedAt) }}</span>
                </div>
              </div>

              <div class="tenant-switch__card-expired-warning" v-if="isSpaceExpired(space)">
                <svg class="tenant-switch__warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <p class="tenant-switch__warning-title">该空间已过期</p>
                  <p class="tenant-switch__warning-desc">过期时间：{{ formatDate(space.expireAt) }}，如需继续使用请联系管理员续费。</p>
                </div>
              </div>

              <div class="tenant-switch__card-actions">
                <button
                  class="tenant-switch__btn tenant-switch__btn--primary"
                  @click="handleSwitchSpace(space)"
                  :disabled="isSpaceExpired(space) || switchingSpaceId === space.id"
                >
                  <span v-if="switchingSpaceId === space.id">
                    <span class="tenant-switch__btn-spinner"></span>
                    切换中...
                  </span>
                  <span v-else-if="currentSpaceId === space.id">
                    当前空间
                  </span>
                  <span v-else>
                    进入空间
                  </span>
                </button>
                <button
                  class="tenant-switch__btn tenant-switch__btn--secondary"
                  @click="handleSetDefault(space)"
                  :disabled="isSpaceExpired(space) || space.isDefault || settingDefaultId === space.id"
                >
                  <span v-if="settingDefaultId === space.id">
                    <span class="tenant-switch__btn-spinner"></span>
                    设置中...
                  </span>
                  <span v-else-if="space.isDefault">
                    已设为默认
                  </span>
                  <span v-else>
                    设为默认
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  MEMBER_ROLES,
  ROLE_LABELS,
  isSpaceExpired,
  sortSpaces,
  setDefaultSpace,
  getDefaultSpace,
  updateLastAccessed,
  getRecentAccessRecords,
  formatDate,
  getExpireStatus
} from './utils.js'

const loading = ref(true)
const switchingSpaceId = ref(null)
const settingDefaultId = ref(null)

const spaces = ref([])
const currentSpaceId = ref(null)

const notification = ref({
  show: false,
  type: 'success',
  message: ''
})

const sortedSpaces = computed(() => {
  return sortSpaces(spaces.value, currentSpaceId.value)
})

const recentSpaces = computed(() => {
  return getRecentAccessRecords(spaces.value, 5)
})

function showNotification(type, message) {
  notification.value = { show: true, type, message }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

function formatRelativeTime(dateString) {
  if (!dateString) return '未访问'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return formatDate(dateString)
}

async function handleSwitchSpace(space) {
  if (isSpaceExpired(space) || switchingSpaceId.value) return

  switchingSpaceId.value = space.id

  try {
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400))

    if (Math.random() < 0.1) {
      throw new Error('模拟切换失败')
    }

    currentSpaceId.value = space.id
    spaces.value = updateLastAccessed(spaces.value, space.id)
    showNotification('success', `已成功切换到「${space.name}」`)
  } catch (error) {
    showNotification('error', `切换到「${space.name}」失败，请稍后重试`)
  } finally {
    switchingSpaceId.value = null
  }
}

async function handleSetDefault(space) {
  if (isSpaceExpired(space) || space.isDefault || settingDefaultId.value) return

  settingDefaultId.value = space.id

  try {
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400))

    if (Math.random() < 0.1) {
      throw new Error('模拟设置失败')
    }

    spaces.value = setDefaultSpace(spaces.value, space.id)
    showNotification('success', `已将「${space.name}」设为默认空间`)
  } catch (error) {
    showNotification('error', `设置「${space.name}」为默认空间失败，请稍后重试`)
  } finally {
    settingDefaultId.value = null
  }
}

function handleInvite() {
  showNotification('success', '邀请功能开发中，敬请期待')
}

function generateMockSpaces() {
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

onMounted(async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1200))
    const mockSpaces = generateMockSpaces()
    spaces.value = mockSpaces

    const defaultSpace = getDefaultSpace(mockSpaces)
    if (defaultSpace) {
      currentSpaceId.value = defaultSpace.id
    }
  } catch (error) {
    showNotification('error', '加载空间列表失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.tenant-switch {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.tenant-switch__container {
  max-width: 1200px;
  margin: 0 auto;
}

.tenant-switch__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.tenant-switch__title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
}

.tenant-switch__subtitle {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.tenant-switch__invite-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.tenant-switch__invite-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.tenant-switch__invite-btn:active:not(:disabled) {
  transform: translateY(0);
}

.tenant-switch__invite-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tenant-switch__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.tenant-switch__icon--small {
  width: 16px;
  height: 16px;
}

.tenant-switch__notification {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tenant-switch__notification--success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.tenant-switch__notification--error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.tenant-switch__notification-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.tenant-switch__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.tenant-switch__recent {
  margin-bottom: 28px;
}

.tenant-switch__recent-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tenant-switch__recent-item {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  min-width: 140px;
}

.tenant-switch__recent-item:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.tenant-switch__recent-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tenant-switch__recent-name {
  font-weight: 600;
  font-size: 14px;
}

.tenant-switch__recent-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.tenant-switch__content {
  background: #ffffff;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  min-height: 400px;
}

.tenant-switch__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.tenant-switch__spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tenant-switch__loading p {
  margin: 0;
  font-size: 14px;
}

.tenant-switch__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.tenant-switch__empty-icon {
  width: 64px;
  height: 64px;
  color: #d1d5db;
  margin-bottom: 20px;
}

.tenant-switch__empty h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.tenant-switch__empty p {
  margin: 0;
  font-size: 14px;
  max-width: 400px;
}

.tenant-switch__section-title {
  color: #111827;
  margin-bottom: 20px;
}

.tenant-switch__section-title .tenant-switch__icon {
  color: #667eea;
}

.tenant-switch__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.tenant-switch__card {
  position: relative;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.tenant-switch__card:hover {
  border-color: #667eea;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.tenant-switch__card--current {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.tenant-switch__card--current::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.tenant-switch__card--expired {
  border-color: #fca5a5;
  background: #fef2f2;
  opacity: 0.85;
}

.tenant-switch__card--expired:hover {
  border-color: #ef4444;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.15);
}

.tenant-switch__card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  position: absolute;
  top: 16px;
  right: 16px;
}

.tenant-switch__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.tenant-switch__badge-icon {
  width: 12px;
  height: 12px;
}

.tenant-switch__badge--default {
  background: #fef3c7;
  color: #92400e;
}

.tenant-switch__badge--current {
  background: #dbeafe;
  color: #1e40af;
}

.tenant-switch__badge--expired {
  background: #fee2e2;
  color: #991b1b;
}

.tenant-switch__card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-right: 100px;
}

.tenant-switch__card-avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  flex-shrink: 0;
}

.tenant-switch__card--expired .tenant-switch__card-avatar {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.tenant-switch__card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.tenant-switch__card-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tenant-switch__card-role {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  width: fit-content;
}

.tenant-switch__card-role--owner {
  background: #fce7f3;
  color: #9d174d;
}

.tenant-switch__card-role--admin {
  background: #dbeafe;
  color: #1e40af;
}

.tenant-switch__card-role--member {
  background: #d1fae5;
  color: #065f46;
}

.tenant-switch__card-role--guest {
  background: #e5e7eb;
  color: #374151;
}

.tenant-switch__card-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tenant-switch__meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.tenant-switch__meta-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #9ca3af;
}

.tenant-switch__expire--expired {
  color: #dc2626;
  font-weight: 600;
}

.tenant-switch__expire--warning {
  color: #d97706;
  font-weight: 600;
}

.tenant-switch__expire--notice {
  color: #d97706;
}

.tenant-switch__expire--normal,
.tenant-switch__expire--none {
  color: #059669;
}

.tenant-switch__card-expired-warning {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
}

.tenant-switch__warning-icon {
  width: 20px;
  height: 20px;
  color: #dc2626;
  flex-shrink: 0;
  margin-top: 2px;
}

.tenant-switch__warning-title {
  margin: 0 0 4px 0;
  font-size: 13px;
  font-weight: 600;
  color: #991b1b;
}

.tenant-switch__warning-desc {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.tenant-switch__card-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.tenant-switch__btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-height: 40px;
}

.tenant-switch__btn--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.tenant-switch__btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.tenant-switch__btn--secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.tenant-switch__btn--secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.tenant-switch__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.tenant-switch__btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.tenant-switch__btn--secondary .tenant-switch__btn-spinner {
  border-color: rgba(107, 114, 128, 0.3);
  border-top-color: #6b7280;
}

@media (max-width: 768px) {
  .tenant-switch {
    padding: 16px 12px;
  }

  .tenant-switch__header {
    flex-direction: column;
    align-items: stretch;
  }

  .tenant-switch__title {
    font-size: 22px;
  }

  .tenant-switch__invite-btn {
    justify-content: center;
  }

  .tenant-switch__content {
    padding: 20px 16px;
    border-radius: 16px;
  }

  .tenant-switch__cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .tenant-switch__card {
    padding: 16px;
  }

  .tenant-switch__card-header {
    padding-right: 90px;
  }

  .tenant-switch__card-badges {
    top: 12px;
    right: 12px;
  }

  .tenant-switch__badge {
    font-size: 10px;
    padding: 3px 8px;
  }

  .tenant-switch__card-avatar {
    width: 44px;
    height: 44px;
    font-size: 18px;
    border-radius: 12px;
  }

  .tenant-switch__card-name {
    font-size: 15px;
  }

  .tenant-switch__card-actions {
    flex-direction: column;
  }

  .tenant-switch__btn {
    width: 100%;
  }

  .tenant-switch__recent-list {
    flex-direction: column;
  }

  .tenant-switch__recent-item {
    width: 100%;
  }
}

@media (max-width: 375px) {
  .tenant-switch {
    padding: 12px 10px;
  }

  .tenant-switch__title {
    font-size: 20px;
  }

  .tenant-switch__subtitle {
    font-size: 13px;
  }

  .tenant-switch__content {
    padding: 16px 12px;
    border-radius: 14px;
  }

  .tenant-switch__card {
    padding: 14px;
    gap: 12px;
  }

  .tenant-switch__card-header {
    padding-right: 75px;
    gap: 10px;
  }

  .tenant-switch__card-avatar {
    width: 40px;
    height: 40px;
    font-size: 16px;
    border-radius: 10px;
  }

  .tenant-switch__card-name {
    font-size: 14px;
  }

  .tenant-switch__card-badges {
    top: 10px;
    right: 10px;
    gap: 4px;
  }

  .tenant-switch__badge {
    font-size: 9px;
    padding: 2px 6px;
  }

  .tenant-switch__badge-icon {
    width: 10px;
    height: 10px;
  }

  .tenant-switch__meta-item {
    font-size: 12px;
  }

  .tenant-switch__warning-title {
    font-size: 12px;
  }

  .tenant-switch__warning-desc {
    font-size: 11px;
  }

  .tenant-switch__btn {
    font-size: 12px;
    padding: 9px 14px;
    min-height: 36px;
  }

  .tenant-switch__section-title {
    font-size: 14px;
  }
}
</style>
