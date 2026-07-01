<template>
  <div class="device-authorization">
    <div class="container">
      <header class="page-header">
        <h1>新设备登录授权</h1>
        <p class="subtitle">扫描二维码或确认登录请求</p>
      </header>

      <div class="status-card" :style="{ borderColor: statusColor }">
        <div class="status-icon">{{ statusIcon }}</div>
        <div class="status-info">
          <div class="status-label" :style="{ color: statusColor }">
            {{ statusLabel }}
          </div>
          <div class="status-description">{{ statusDescription }}</div>
        </div>
        <div v-if="showCountdown" class="countdown-badge" :class="{ warning: countdownRemaining <= 10 }">
          <span class="countdown-icon">⏱️</span>
          <span class="countdown-text">{{ countdownFormatted }}</span>
        </div>
      </div>

      <div v-if="isRiskStatus" class="risk-warning-card">
        <div class="risk-header">
          <span class="risk-icon">⚠️</span>
          <span class="risk-title" :style="{ color: riskLevelColor }">
            {{ riskLevelLabel }}
          </span>
        </div>
        <ul class="risk-reasons">
          <li v-for="(reason, idx) in currentDeviceInfo.riskReasons" :key="idx">{{ reason }}</li>
        </ul>
        <div class="risk-advice-list">
          <div v-for="(advice, idx) in currentRiskAdvice" :key="idx" class="risk-advice-item">
            {{ advice }}
          </div>
        </div>
      </div>

      <div class="content-layout">
        <div class="main-panel">
          <div v-if="isPendingScan" class="qr-section">
            <div class="qr-wrapper">
              <div class="qr-code-placeholder" :class="{ expired: isExpired }">
                <div class="qr-pattern">
                  <div v-for="i in 25" :key="i" class="qr-cell" :class="{ filled: qrPattern[i - 1] }"></div>
                </div>
                <div v-if="isExpired" class="qr-overlay">
                  <span class="overlay-icon">⏰</span>
                  <span class="overlay-text">已过期</span>
                </div>
              </div>
            </div>
            <div class="qr-hint">
              <div class="qr-hint-title">请使用已登录的设备扫描</div>
              <div class="qr-hint-desc">打开安全中心 → 扫一扫</div>
            </div>
            <div class="qr-request-id">请求编号：{{ requestId }}</div>
          </div>

          <div v-if="showDevicePanel" class="device-info-section">
            <h2 class="section-title">设备信息</h2>
            <div class="device-info-grid">
              <div class="info-item">
                <div class="info-label">设备名称</div>
                <div class="info-value">{{ currentDeviceInfo.deviceName || '未知' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">设备类型</div>
                <div class="info-value">
                  <span class="device-type-icon">{{ getDeviceTypeIcon(currentDeviceInfo.deviceType) }}</span>
                  {{ deviceTypeLabel }}
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">操作系统</div>
                <div class="info-value">{{ currentDeviceInfo.osName }} {{ currentDeviceInfo.osVersion }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">浏览器</div>
                <div class="info-value">{{ currentDeviceInfo.browserName }} {{ currentDeviceInfo.browserVersion }}</div>
              </div>
              <div class="info-item full-width">
                <div class="info-label">IP 地址</div>
                <div class="info-value monospace">{{ currentDeviceInfo.ipAddress }}</div>
              </div>
              <div class="info-item full-width">
                <div class="info-label">登录地点</div>
                <div class="info-value">
                  <span class="location-icon">📍</span>
                  {{ currentDeviceInfo.loginLocation }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="isAuthorized" class="result-section success">
            <div class="result-icon-large">🎉</div>
            <h2 class="result-title">授权成功</h2>
            <p class="result-desc">新设备已获得登录权限，可在该设备上正常使用账号。</p>
            <div class="result-meta">
              <div class="meta-item">
                <span class="meta-label">授权时间：</span>
                <span class="meta-value">{{ authorizedTime }}</span>
              </div>
            </div>
          </div>

          <div v-if="isRejected" class="result-section rejected">
            <div class="result-icon-large">🚫</div>
            <h2 class="result-title">已拒绝登录</h2>
            <p class="result-desc">该设备的登录请求已被拒绝。</p>
            <div class="result-meta">
              <div class="meta-item">
                <span class="meta-label">拒绝原因：</span>
                <span class="meta-value">{{ rejectReason }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">操作时间：</span>
                <span class="meta-value">{{ rejectedTime }}</span>
              </div>
            </div>
          </div>

          <div v-if="isTimeout" class="result-section timeout">
            <div class="result-icon-large">⏰</div>
            <h2 class="result-title">授权请求已超时</h2>
            <p class="result-desc">二维码或授权请求已超过有效时间，请重新发起。</p>
            <button class="btn btn-primary btn-large" @click="handleRefresh">
              🔄 刷新重新获取
            </button>
          </div>
        </div>

        <div class="side-panel">
          <div class="actions-card">
            <h3 class="card-title">操作面板</h3>
            <div v-if="canShowActions" class="actions-group">
              <button
                class="btn btn-danger btn-block"
                :disabled="isActionDisabled"
                @click="handleReject"
              >
                <span v-if="isSubmitting" class="btn-spinner"></span>
                拒绝登录
              </button>
              <button
                class="btn btn-success btn-block"
                :disabled="isActionDisabled"
                @click="handleConfirm"
              >
                <span v-if="isSubmitting" class="btn-spinner"></span>
                {{ isRiskStatus ? '确认风险并授权' : '确认授权' }}
              </button>
            </div>

            <div v-else class="actions-hint">
              <template v-if="isPendingScan">
                <div class="hint-icon">📱</div>
                <div class="hint-text">等待扫描二维码...</div>
                <button class="btn btn-secondary btn-small btn-block" @click="simulateScan(false)">
                  模拟：正常设备扫描
                </button>
                <button class="btn btn-outline-danger btn-small btn-block" @click="simulateScan(true)">
                  模拟：风险设备扫描
                </button>
              </template>
              <template v-else-if="isAuthorized">
                <div class="hint-icon success">✅</div>
                <div class="hint-text success-text">授权已完成</div>
              </template>
              <template v-else-if="isRejected">
                <div class="hint-icon">🚫</div>
                <div class="hint-text">操作已完成</div>
              </template>
              <template v-else-if="isTimeout">
                <div class="hint-icon">⏰</div>
                <div class="hint-text">请刷新重新获取</div>
                <button class="btn btn-primary btn-small btn-block" @click="handleRefresh">
                  重新获取
                </button>
              </template>
            </div>

            <div v-if="isExpired && canShowActions" class="expired-notice">
              ⚠️ 授权已超时，无法继续操作
            </div>
          </div>

          <div class="security-tips-card">
            <h3 class="card-title">🔒 安全提示</h3>
            <ul class="tips-list">
              <li>请确认二维码是由您本人或信任的设备生成的</li>
              <li>不要在公共场所随意扫码授权</li>
              <li>如果发现异常，请立即拒绝并修改密码</li>
              <li>授权成功后请注意查收登录通知</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  DEVICE_AUTH_STATUS,
  DEVICE_AUTH_STATUS_LABELS,
  DEVICE_TYPE_LABELS,
  DEFAULT_QR_TIMEOUT,
  MOCK_DEVICE_INFO,
  MOCK_RISK_DEVICE_INFO,
  RISK_LEVELS,
  RISK_LEVEL_LABELS
} from './constants.js'
import {
  getStatusDescription,
  getStatusIcon,
  getStatusColor,
  isTerminalStatus,
  createCountdownManager,
  createAuthorizationManager,
  shouldShowRiskWarning,
  getRiskLevelColor,
  getHighRiskAdvice
} from './authorizationState.js'

const PENDING_SCAN = DEVICE_AUTH_STATUS.PENDING_SCAN
const SCANNED_PENDING = DEVICE_AUTH_STATUS.SCANNED_PENDING
const AUTHORIZED = DEVICE_AUTH_STATUS.AUTHORIZED
const REJECTED = DEVICE_AUTH_STATUS.REJECTED
const TIMEOUT = DEVICE_AUTH_STATUS.TIMEOUT
const RISK = DEVICE_AUTH_STATUS.RISK

const authManager = createAuthorizationManager()
const status = ref(authManager.getStatus())
const isSubmitting = ref(false)
const countdownRemaining = ref(DEFAULT_QR_TIMEOUT)

const qrPattern = Array.from({ length: 25 }, () => Math.random() > 0.5)

let countdownManager = null

const managerState = computed(() => authManager.toJSON())

const currentDeviceInfo = computed(() => managerState.value.deviceInfo)
const deviceRiskLevel = computed(() => managerState.value.riskLevel)
const rejectReason = computed(() => managerState.value.rejectReason)
const requestId = computed(() => managerState.value.requestId)
const isOperationDone = computed(() => managerState.value.isOperationDone)

const timestamps = computed(() => managerState.value.timestamps)
const authorizedAt = computed(() => timestamps.value.confirmedAt)
const rejectedAt = computed(() => timestamps.value.rejectedAt)

const statusLabel = computed(() => DEVICE_AUTH_STATUS_LABELS[status.value])
const statusDescription = computed(() => getStatusDescription(status.value))
const statusIcon = computed(() => getStatusIcon(status.value))
const statusColor = computed(() => getStatusColor(status.value))

const isPendingScan = computed(() => status.value === PENDING_SCAN)
const isScannedPending = computed(() => status.value === SCANNED_PENDING)
const isAuthorized = computed(() => status.value === AUTHORIZED)
const isRejected = computed(() => status.value === REJECTED)
const isTimeout = computed(() => status.value === TIMEOUT)
const isRiskStatus = computed(() => shouldShowRiskWarning(status.value))

const showDevicePanel = computed(() => {
  return [SCANNED_PENDING, RISK, AUTHORIZED, REJECTED].includes(status.value)
})

const showCountdown = computed(() => {
  return [PENDING_SCAN, SCANNED_PENDING, RISK].includes(status.value)
})

const canShowActions = computed(() => {
  return (status.value === SCANNED_PENDING || status.value === RISK) && !isOperationDone.value
})

const isExpired = computed(() => countdownRemaining.value <= 0)

const canOperate = computed(() => {
  if (isOperationDone.value) return false
  if (isExpired.value) return false
  return status.value === SCANNED_PENDING || status.value === RISK
})

const isActionDisabled = computed(() => !canOperate.value || isSubmitting.value)

const countdownFormatted = computed(() => {
  const mins = Math.floor(Math.max(0, countdownRemaining.value) / 60)
  const secs = Math.max(0, countdownRemaining.value) % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const riskLevelColor = computed(() => getRiskLevelColor(deviceRiskLevel.value))

const riskLevelLabel = computed(() => {
  const level = deviceRiskLevel.value
  if (!level) return '高风险'
  return RISK_LEVEL_LABELS[level] || '未知风险'
})

const currentRiskAdvice = computed(() => getHighRiskAdvice(deviceRiskLevel.value))

const deviceTypeLabel = computed(() => {
  return DEVICE_TYPE_LABELS[currentDeviceInfo.value.deviceType] || '未知设备'
})

const authorizedTime = computed(() => formatTime(authorizedAt.value))
const rejectedTime = computed(() => formatTime(rejectedAt.value))

function formatTime(isoString) {
  if (!isoString) return '-'
  const d = new Date(isoString)
  return d.toLocaleString('zh-CN')
}

function getDeviceTypeIcon(type) {
  const icons = {
    desktop: '💻',
    mobile: '📱',
    tablet: '📲',
    unknown: '❓'
  }
  return icons[type] || '❓'
}

function initCountdown() {
  countdownManager = createCountdownManager(DEFAULT_QR_TIMEOUT, () => {
    handleTimeout()
  })
  countdownManager.start((remaining) => {
    countdownRemaining.value = remaining
  })
}

function resetCountdown() {
  if (countdownManager) {
    countdownManager.reset(DEFAULT_QR_TIMEOUT)
    countdownRemaining.value = DEFAULT_QR_TIMEOUT
    countdownManager.start((remaining) => {
      countdownRemaining.value = remaining
    })
  }
}

function stopCountdown() {
  if (countdownManager) {
    countdownManager.stop()
  }
}

function refreshManagerState() {
  status.value = authManager.getStatus()
}

function simulateScan(isRisk = false) {
  if (isExpired.value || isSubmitting.value || isOperationDone.value) return

  const deviceInfo = isRisk ? { ...MOCK_RISK_DEVICE_INFO } : { ...MOCK_DEVICE_INFO }

  const result = authManager.markAsScanned(deviceInfo, isRisk)
  if (result.success) {
    refreshManagerState()
  }
}

function handleConfirm() {
  if (isActionDisabled.value) return

  isSubmitting.value = true

  const result = authManager.confirm()

  if (result.success) {
    refreshManagerState()
    stopCountdown()
  }
  isSubmitting.value = false
}

function handleReject() {
  if (isActionDisabled.value) return

  isSubmitting.value = true

  const result = authManager.reject('用户拒绝授权该设备登录')

  if (result.success) {
    refreshManagerState()
    stopCountdown()
  }
  isSubmitting.value = false
}

function handleTimeout() {
  const result = authManager.markAsTimeout()
  if (result.success) {
    refreshManagerState()
  }
}

function handleRefresh() {
  const result = authManager.refresh()
  if (result.success) {
    refreshManagerState()
    resetCountdown()
  }
}

watch(status, (newStatus) => {
  if (isTerminalStatus(newStatus)) {
    stopCountdown()
  }
})

onMounted(() => {
  initCountdown()
})

onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped>
.device-authorization {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #f5f7fa 100%);
  padding: 24px 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.status-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px 24px;
  border-left: 4px solid #3b82f6;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.status-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-label {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.status-description {
  font-size: 13px;
  color: #6b7280;
}

.countdown-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #eff6ff;
  border-radius: 20px;
  color: #3b82f6;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.countdown-badge.warning {
  background: #fef2f2;
  color: #dc2626;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.countdown-icon {
  font-size: 14px;
}

.risk-warning-card {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.risk-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.risk-icon {
  font-size: 22px;
}

.risk-title {
  font-size: 16px;
  font-weight: 700;
}

.risk-reasons {
  margin: 0 0 16px 0;
  padding-left: 24px;
  color: #92400e;
  font-size: 13px;
  line-height: 1.7;
}

.risk-advice-list {
  background: #ffffff;
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid #fed7aa;
}

.risk-advice-item {
  font-size: 13px;
  color: #7c2d12;
  padding: 6px 0;
  line-height: 1.5;
}

.risk-advice-item + .risk-advice-item {
  border-top: 1px dashed #fed7aa;
}

.content-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}

.main-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.qr-section,
.device-info-section,
.result-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 28px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.qr-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.qr-code-placeholder {
  position: relative;
  width: 240px;
  height: 240px;
  padding: 20px;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
}

.qr-code-placeholder.expired {
  border-color: #fca5a5;
  background: #fef2f2;
}

.qr-pattern {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  width: 100%;
  height: 100%;
}

.qr-cell {
  border-radius: 2px;
  background: #f3f4f6;
}

.qr-cell.filled {
  background: #111827;
}

.qr-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  gap: 8px;
}

.overlay-icon {
  font-size: 48px;
}

.overlay-text {
  font-size: 16px;
  font-weight: 600;
  color: #dc2626;
}

.qr-hint {
  text-align: center;
  margin-bottom: 16px;
}

.qr-hint-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 6px;
}

.qr-hint-desc {
  font-size: 13px;
  color: #6b7280;
}

.qr-request-id {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.device-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
  line-height: 1.4;
  word-break: break-all;
}

.info-value.monospace {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.device-type-icon,
.location-icon {
  margin-right: 4px;
}

.result-section {
  text-align: center;
  padding: 40px 28px;
}

.result-section.success {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  border: 1px solid #bbf7d0;
}

.result-section.rejected {
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  border: 1px solid #e5e7eb;
}

.result-section.timeout {
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
  border: 1px solid #fecaca;
}

.result-icon-large {
  font-size: 64px;
  margin-bottom: 16px;
}

.result-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 10px 0;
}

.result-section.success .result-title {
  color: #059669;
}

.result-section.rejected .result-title {
  color: #6b7280;
}

.result-section.timeout .result-title {
  color: #dc2626;
}

.result-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.result-meta {
  display: inline-block;
  text-align: left;
  background: #ffffff;
  border-radius: 8px;
  padding: 14px 20px;
  border: 1px solid #e5e7eb;
}

.meta-item + .meta-item {
  margin-top: 8px;
}

.meta-label {
  font-size: 13px;
  color: #6b7280;
}

.meta-value {
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.actions-card,
.security-tips-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.actions-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.actions-hint {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
}

.actions-hint .btn {
  margin-top: 4px;
}

.hint-icon {
  font-size: 32px;
  opacity: 0.6;
}

.hint-icon.success {
  opacity: 1;
}

.hint-text {
  font-size: 13px;
  color: #6b7280;
}

.hint-text.success-text {
  color: #059669;
  font-weight: 500;
}

.expired-notice {
  margin-top: 14px;
  padding: 10px 12px;
  background: #fef2f2;
  border-radius: 8px;
  color: #dc2626;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

.btn-large {
  padding: 14px 28px;
  font-size: 15px;
}

.btn-small {
  padding: 8px 14px;
  font-size: 13px;
}

.btn-primary {
  background: #3b82f6;
  color: #ffffff;
  border-color: #3b82f6;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-success {
  background: #10b981;
  color: #ffffff;
  border-color: #10b981;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
}

.btn-danger {
  background: #ffffff;
  color: #dc2626;
  border-color: #fecaca;
}

.btn-danger:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
}

.btn-outline-danger {
  background: #ffffff;
  color: #dc2626;
  border-color: #fecaca;
}

.btn-outline-danger:hover:not(:disabled) {
  background: #fef2f2;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-danger .btn-spinner,
.btn-outline-danger .btn-spinner {
  border-color: rgba(220, 38, 38, 0.3);
  border-top-color: #dc2626;
}

.btn-secondary .btn-spinner {
  border-color: rgba(55, 65, 81, 0.3);
  border-top-color: #374151;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tips-list li {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .content-layout {
    grid-template-columns: 1fr;
  }

  .side-panel {
    order: 2;
  }
}

@media (max-width: 375px) {
  .container {
    padding: 0 16px;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .status-card {
    padding: 16px;
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }

  .status-icon {
    font-size: 30px;
  }

  .countdown-badge {
    order: -1;
    padding: 6px 12px;
    font-size: 13px;
  }

  .qr-section,
  .device-info-section,
  .result-section {
    padding: 20px 16px;
  }

  .qr-code-placeholder {
    width: 200px;
    height: 200px;
    padding: 16px;
  }

  .device-info-grid {
    grid-template-columns: 1fr;
  }

  .actions-card,
  .security-tips-card {
    padding: 16px;
  }

  .result-section {
    padding: 28px 16px;
  }

  .result-icon-large {
    font-size: 48px;
  }

  .result-title {
    font-size: 18px;
  }

  .result-meta {
    display: block;
    text-align: left;
  }
}
</style>
