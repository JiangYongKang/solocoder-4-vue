<template>
  <div class="gesture-settings">
    <div class="container">
      <header class="page-header">
        <h1>手势密码设置</h1>
        <p class="subtitle">绘制连接至少4个点的手势图案保护您的账号安全</p>
      </header>

      <div class="status-card" :style="{ borderColor: statusColor }">
        <div class="status-icon">{{ statusIcon }}</div>
        <div class="status-info">
          <div class="status-label" :style="{ color: statusColor }">
            {{ statusLabel }}
          </div>
          <div class="status-description">{{ statusDescription }}</div>
        </div>
        <div class="toggle-wrapper">
          <label class="toggle">
            <input
              type="checkbox"
              :checked="isEnabled"
              :disabled="isLocked"
              @change="handleToggle"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div v-if="message" class="message-card" :class="messageType">
        {{ message }}
      </div>

      <div v-if="errorCount > 0 && !isLocked && currentStatus !== SET && currentStep !== RESET" class="error-hint">
        剩余尝试次数：{{ remainingAttempts }}
      </div>

      <div v-if="isLocked" class="locked-card">
        <div class="locked-icon">🔒</div>
        <div class="locked-title">手势已锁定</div>
        <div class="locked-desc">
          错误次数过多，请 {{ formattedLockTime }} 后再试
        </div>
        <button v-if="canUnlock" class="btn btn-primary" @click="handleUnlock">
          重新验证
        </button>
      </div>

      <div v-else-if="showGestureArea" class="gesture-section">
        <div class="gesture-hint" :class="{ 'error': mainDrawer.hasError.value, 'success': mainDrawer.hasSuccess.value }">
          {{ stepLabel }}
        </div>

        <div
          ref="gesturePad"
          class="gesture-pad"
          @mousedown="handleMainStart"
          @mousemove="handleMainDraw"
          @mouseup="handleMainEnd"
          @mouseleave="handleMainLeave"
          @touchstart.prevent="handleMainStart"
          @touchmove.prevent="handleMainDraw"
          @touchend.prevent="handleMainEnd"
        >
          <svg class="gesture-canvas" :width="canvasSize" :height="canvasSize">
            <line
              v-for="(line, index) in mainDrawer.lines.value"
              :key="'line-' + index"
              :x1="line.x1"
              :y1="line.y1"
              :x2="line.x2"
              :y2="line.y2"
              :stroke="mainLineColor"
              stroke-width="4"
              stroke-linecap="round"
            />
            <line
              v-if="mainDrawer.currentLine.value"
              :x1="mainDrawer.currentLine.value.x1"
              :y1="mainDrawer.currentLine.value.y1"
              :x2="mainDrawer.currentLine.value.x2"
              :y2="mainDrawer.currentLine.value.y2"
              :stroke="mainLineColor"
              stroke-width="4"
              stroke-linecap="round"
            />
          </svg>

          <div
            v-for="(point, index) in mainDrawer.gesturePoints.value"
            :key="index"
            class="gesture-point"
            :class="{
              'selected': mainDrawer.selectedPoints.value.includes(index),
              'error': mainDrawer.hasError.value && mainDrawer.selectedPoints.value.includes(index),
              'success': mainDrawer.hasSuccess.value && mainDrawer.selectedPoints.value.includes(index)
            }"
            :style="{ left: point.x + 'px', top: point.y + 'px' }"
          >
            <div class="point-inner"></div>
          </div>
        </div>

        <div v-if="showActions" class="gesture-actions">
          <button v-if="canCancel" class="btn btn-secondary" @click="handleCancel">
            取消
          </button>
          <button v-if="canReset" class="btn btn-secondary" @click="handleOpenReset">
            重置手势
          </button>
        </div>
      </div>

      <div v-if="isEnabled && currentStatus === SET && currentStep === IDLE" class="info-section">
        <button class="btn btn-outline btn-full" @click="handleOpenReset">
          重置手势密码
        </button>
      </div>

      <div class="tips-section">
        <h3>安全提示</h3>
        <div class="tips-list">
          <div v-for="tip in securityTips" :key="tip.id" class="tip-item">
            <div class="tip-icon">{{ tip.icon }}</div>
            <div class="tip-content">
              <div class="tip-title">{{ tip.title }}</div>
              <div class="tip-desc">{{ tip.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showResetConfirm" class="modal-overlay" @click.self="closeResetModal">
        <div class="modal-content">
          <div class="modal-title">重置手势密码</div>
          <div class="modal-desc">请验证原手势密码以继续重置</div>
          <div class="modal-gesture">
            <div
              ref="resetPad"
              class="gesture-pad small"
              @mousedown="handleResetStart"
              @mousemove="handleResetDraw"
              @mouseup="handleResetEnd"
              @mouseleave="handleResetLeave"
              @touchstart.prevent="handleResetStart"
              @touchmove.prevent="handleResetDraw"
              @touchend.prevent="handleResetEnd"
            >
              <svg class="gesture-canvas" :width="smallCanvasSize" :height="smallCanvasSize">
                <line
                  v-for="(line, index) in resetDrawer.lines.value"
                  :key="'rline-' + index"
                  :x1="line.x1"
                  :y1="line.y1"
                  :x2="line.x2"
                  :y2="line.y2"
                  :stroke="resetLineColor"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <line
                  v-if="resetDrawer.currentLine.value"
                  :x1="resetDrawer.currentLine.value.x1"
                  :y1="resetDrawer.currentLine.value.y1"
                  :x2="resetDrawer.currentLine.value.x2"
                  :y2="resetDrawer.currentLine.value.y2"
                  :stroke="resetLineColor"
                  stroke-width="3"
                  stroke-linecap="round"
                />
              </svg>

              <div
                v-for="(point, index) in resetDrawer.gesturePoints.value"
                :key="index"
                class="gesture-point small"
                :class="{
                  'selected': resetDrawer.selectedPoints.value.includes(index),
                  'error': resetDrawer.hasError.value && resetDrawer.selectedPoints.value.includes(index)
                }"
                :style="{ left: point.x + 'px', top: point.y + 'px' }"
              >
                <div class="point-inner"></div>
              </div>
            </div>
          </div>
          <div v-if="resetDrawer.message.value" class="reset-message" :class="{ error: resetDrawer.hasError.value }">
            {{ resetDrawer.message.value }}
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closeResetModal">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  GESTURE_STATUS,
  GESTURE_STEP,
  MAX_ERRORS,
  LOCK_DURATION,
  SECURITY_TIPS
} from './constants.js'
import {
  getLockRemainingTime,
  isLockExpired
} from './gestureValidator.js'
import {
  getInitialState,
  getStatusLabel,
  getStepLabel,
  setFirstGesture,
  confirmGesture,
  verifyGesture,
  unlockAfterLock,
  enterResetStep,
  startReset,
  cancelReset,
  toggleGesture
} from './gestureState.js'
import { useGestureDrawer } from './useGestureDrawer.js'

const OFF = GESTURE_STATUS.OFF
const DRAWING = GESTURE_STATUS.DRAWING
const CONFIRMING = GESTURE_STATUS.CONFIRMING
const SET = GESTURE_STATUS.SET
const VERIFYING = GESTURE_STATUS.VERIFYING
const LOCKED = GESTURE_STATUS.LOCKED

const FIRST_DRAW = GESTURE_STEP.FIRST_DRAW
const SECOND_DRAW = GESTURE_STEP.SECOND_DRAW
const IDLE = GESTURE_STEP.IDLE
const RESET = GESTURE_STEP.RESET

const state = ref(getInitialState())
const isEnabled = computed(() => state.value.isEnabled)
const currentStatus = computed(() => state.value.status)
const currentStep = computed(() => state.value.step)
const savedGesture = computed(() => state.value.gesture)
const firstGesture = computed(() => state.value.firstGesture)
const errorCount = computed(() => state.value.errorCount)
const isLocked = computed(() => state.value.isLocked)
const lockStartTime = computed(() => state.value.lockStartTime)

const canvasSize = ref(300)
const smallCanvasSize = computed(() => {
  const scale = canvasSize.value < 280 ? 0.6 : (canvasSize.value < 300 ? 0.62 : 0.625)
  return Math.floor(canvasSize.value * scale)
})
const pointRadius = computed(() => canvasSize.value < 280 ? 22 : 28)
const smallPointRadius = computed(() => Math.floor(pointRadius.value * 0.62))

const mainDrawer = useGestureDrawer({
  canvasSize,
  pointRadius: pointRadius.value || 28
})

const resetDrawer = useGestureDrawer({
  canvasSize: smallCanvasSize,
  pointRadius: smallPointRadius.value || 17
})

const gesturePad = ref(null)
const resetPad = ref(null)
const showResetConfirm = ref(false)

const message = ref('')
const messageType = ref('info')
const lockTimer = ref(null)
const lockRemaining = ref(0)

const statusLabel = computed(() => getStatusLabel(currentStatus.value))

const statusDescription = computed(() => {
  const descriptions = {
    [OFF]: '开启后可使用手势密码快速解锁',
    [DRAWING]: '请绘制新手势密码',
    [CONFIRMING]: '请再次绘制手势进行确认',
    [SET]: '手势密码已生效',
    [VERIFYING]: '请验证手势密码',
    [LOCKED]: '手势已锁定，请稍后再试'
  }
  return descriptions[currentStatus.value] || ''
})

const statusIcon = computed(() => {
  const icons = {
    [OFF]: '🔒',
    [DRAWING]: '✏️',
    [CONFIRMING]: '🤝',
    [SET]: '✅',
    [VERIFYING]: '🔍',
    [LOCKED]: '⏳'
  }
  return icons[currentStatus.value] || '📄'
})

const statusColor = computed(() => {
  const colors = {
    [OFF]: '#6b7280',
    [DRAWING]: '#3b82f6',
    [CONFIRMING]: '#f59e0b',
    [SET]: '#10b981',
    [VERIFYING]: '#3b82f6',
    [LOCKED]: '#ef4444'
  }
  return colors[currentStatus.value] || '#6b7280'
})

const stepLabel = computed(() => {
  if (mainDrawer.hasError.value) return mainDrawer.message.value
  if (mainDrawer.hasSuccess.value) return mainDrawer.message.value
  return getStepLabel(currentStep.value)
})

const mainLineColor = computed(() => {
  if (mainDrawer.hasError.value) return '#ef4444'
  if (mainDrawer.hasSuccess.value) return '#10b981'
  return '#3b82f6'
})

const resetLineColor = computed(() => {
  return resetDrawer.hasError.value ? '#ef4444' : '#3b82f6'
})

const showGestureArea = computed(() => {
  return isEnabled.value && !isLocked.value && currentStatus.value !== OFF
})

const showActions = computed(() => {
  return currentStatus.value === DRAWING ||
         currentStatus.value === CONFIRMING ||
         (currentStatus.value === SET && currentStep.value === IDLE)
})

const canCancel = computed(() => {
  return currentStatus.value === DRAWING ||
         currentStatus.value === CONFIRMING ||
         (currentStatus.value === SET && currentStep.value === RESET)
})

const canReset = computed(() => {
  return currentStatus.value === SET && currentStep.value === IDLE
})

const remainingAttempts = computed(() => {
  return Math.max(0, MAX_ERRORS - errorCount.value)
})

const securityTips = computed(() => SECURITY_TIPS)

const formattedLockTime = computed(() => {
  const seconds = Math.ceil(lockRemaining.value / 1000)
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }
  return `${seconds}秒`
})

const canUnlock = computed(() => {
  return isLocked.value && isLockExpired(lockStartTime.value, LOCK_DURATION)
})

function handleMainStart(event) {
  if (!canDraw()) return
  mainDrawer.startDrawing(event, gesturePad.value)
}

function handleMainDraw(event) {
  mainDrawer.draw(event, gesturePad.value)
}

function handleMainEnd() {
  if (!mainDrawer.isDrawing.value) return
  const result = mainDrawer.endDrawing()

  if (!result.complete) {
    if (result.error) {
      showError(result.error, 'main')
    }
    return
  }

  handleGestureComplete(result.points)
}

function handleMainLeave() {
  if (mainDrawer.isDrawing.value) {
    handleMainEnd()
  }
}

function handleResetStart(event) {
  if (isLocked.value) return
  resetDrawer.startDrawing(event, resetPad.value)
}

function handleResetDraw(event) {
  resetDrawer.draw(event, resetPad.value)
}

function handleResetEnd() {
  if (!resetDrawer.isDrawing.value) return
  const result = resetDrawer.endDrawing()

  if (!result.complete) {
    if (result.error) {
      showError(result.error, 'reset')
      setTimeout(() => {
        if (!isLocked.value) resetDrawer.clear()
      }, 1500)
    }
    return
  }

  handleResetComplete(result.points)
}

function handleResetLeave() {
  if (resetDrawer.isDrawing.value) {
    handleResetEnd()
  }
}

function canDraw() {
  return !isLocked.value && isEnabled.value &&
         (currentStatus.value === DRAWING ||
          currentStatus.value === CONFIRMING ||
          currentStatus.value === SET)
}

function handleGestureComplete(points) {
  const status = currentStatus.value
  const step = currentStep.value

  if (status === DRAWING && step === FIRST_DRAW) {
    const result = setFirstGesture(status, step, points)
    applyResult(result)
    if (result.success) {
      mainDrawer.clear()
    } else {
      showError(result.error, 'main')
    }
  } else if (status === CONFIRMING && step === SECOND_DRAW) {
    const result = confirmGesture(status, step, firstGesture.value, points)
    applyResult(result)
    if (result.success) {
      showSuccess('手势密码设置成功', 'main')
      setTimeout(() => { mainDrawer.clear() }, 1500)
    } else {
      showError(result.error, 'main')
    }
  } else if (status === SET && step === IDLE) {
    const result = verifyGesture(status, savedGesture.value, points, errorCount.value)
    applyResult(result)
    if (result.success) {
      showSuccess('验证成功', 'main')
      setTimeout(() => { mainDrawer.clear() }, 1500)
    } else {
      showError(result.error, 'main')
    }
  }
}

function applyResult(result) {
  if (!result) return

  if (result.currentStatus !== undefined) {
    state.value.status = result.currentStatus
  }
  if (result.step !== undefined) {
    state.value.step = result.step
  }
  if (result.gesture !== undefined) {
    state.value.gesture = result.gesture
  }
  if (result.firstGesture !== undefined) {
    state.value.firstGesture = result.firstGesture
  }
  if (result.errorCount !== undefined) {
    state.value.errorCount = result.errorCount
  }
  if (result.isLocked !== undefined) {
    state.value.isLocked = result.isLocked
  }
  if (result.lockStartTime !== undefined) {
    state.value.lockStartTime = result.lockStartTime
    if (result.isLocked) {
      startLockTimer()
    }
  }
  if (result.message !== undefined) {
    message.value = result.message
  }
  if (result.isEnabled !== undefined) {
    state.value.isEnabled = result.isEnabled
  }
}

function showError(msg, target = 'main') {
  if (target === 'main') {
    mainDrawer.showError(msg)
    messageType.value = 'error'
    setTimeout(() => {
      if (!isLocked.value) {
        mainDrawer.clear()
      }
    }, 1500)
  } else {
    resetDrawer.showError(msg)
  }
}

function showSuccess(msg, target = 'main') {
  if (target === 'main') {
    mainDrawer.showSuccess(msg)
    messageType.value = 'success'
  }
}

function handleToggle(event) {
  const enabled = event.target.checked
  const result = toggleGesture(enabled, currentStatus.value, state.value)
  applyResult(result)

  if (result.success) {
    if (!enabled) {
      mainDrawer.clear()
      showSuccess('手势密码已关闭', 'main')
    } else {
      mainDrawer.clear()
      message.value = '请绘制新手势密码'
    }
  } else {
    event.target.checked = isEnabled.value
    showError(result.error, 'main')
  }
}

function handleCancel() {
  const result = cancelReset(currentStatus.value, currentStep.value)
  applyResult(result)
  mainDrawer.clear()
}

function handleOpenReset() {
  const result = enterResetStep(currentStatus.value)
  applyResult(result)
  if (result.success) {
    showResetConfirm.value = true
    resetDrawer.clear()
  }
}

function handleUnlock() {
  const result = unlockAfterLock(currentStatus.value, lockStartTime.value, LOCK_DURATION)
  applyResult(result)
  if (result.success) {
    stopLockTimer()
    mainDrawer.clear()
    message.value = '请验证手势密码'
  }
}

function handleResetComplete(points) {
  const result = startReset(currentStatus.value, currentStep.value, savedGesture.value, points, errorCount.value)
  applyResult(result)

  if (result.success) {
    closeResetModal()
    mainDrawer.clear()
    showSuccess('验证成功，请绘制新手势', 'main')
  } else {
    showError(result.error, 'reset')
    if (result.isLocked) {
      setTimeout(closeResetModal, 1500)
    } else {
      setTimeout(() => {
        resetDrawer.clear()
      }, 1500)
    }
  }
}

function closeResetModal() {
  showResetConfirm.value = false
  resetDrawer.clear()
  if (currentStep.value === RESET) {
    state.value.step = IDLE
  }
}

function startLockTimer() {
  stopLockTimer()
  updateLockRemaining()
  lockTimer.value = setInterval(() => {
    updateLockRemaining()
  }, 1000)
}

function stopLockTimer() {
  if (lockTimer.value) {
    clearInterval(lockTimer.value)
    lockTimer.value = null
  }
}

function updateLockRemaining() {
  lockRemaining.value = getLockRemainingTime(lockStartTime.value, LOCK_DURATION)
  if (lockRemaining.value <= 0) {
    stopLockTimer()
  }
}

function updateCanvasSize() {
  const width = window.innerWidth
  if (width <= 375) {
    canvasSize.value = 260
  } else if (width <= 480) {
    canvasSize.value = 280
  } else {
    canvasSize.value = 300
  }
  mainDrawer.initGesturePoints()
  resetDrawer.initGesturePoints()
}

watch(isLocked, (locked) => {
  if (locked && lockStartTime.value) {
    startLockTimer()
  } else {
    stopLockTimer()
  }
})

watch(canvasSize, () => {
  mainDrawer.initGesturePoints()
  resetDrawer.initGesturePoints()
})

onMounted(() => {
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
})

onUnmounted(() => {
  stopLockTimer()
  window.removeEventListener('resize', updateCanvasSize)
})
</script>

<style scoped>
.gesture-settings {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24px 0;
}

.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.status-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #6b7280;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-label {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.status-description {
  font-size: 12px;
  color: #6b7280;
}

.toggle-wrapper {
  flex-shrink: 0;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #d1d5db;
  border-radius: 26px;
  transition: 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle input:checked + .toggle-slider {
  background-color: #3b82f6;
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.toggle input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.message-card {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: center;
}

.message-card.info {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.message-card.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.message-card.success {
  background: #f0fdf4;
  color: #059669;
  border: 1px solid #bbf7d0;
}

.error-hint {
  text-align: center;
  color: #ef4444;
  font-size: 13px;
  margin-bottom: 12px;
}

.locked-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.locked-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.locked-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.locked-desc {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 20px;
}

.gesture-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.gesture-hint {
  text-align: center;
  font-size: 15px;
  color: #374151;
  margin-bottom: 24px;
  font-weight: 500;
}

.gesture-hint.error {
  color: #ef4444;
}

.gesture-hint.success {
  color: #10b981;
}

.gesture-pad {
  position: relative;
  width: 300px;
  height: 300px;
  margin: 0 auto;
  touch-action: none;
  user-select: none;
}

.gesture-pad.small {
  width: auto;
  height: auto;
}

.gesture-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.gesture-point {
  position: absolute;
  width: 56px;
  height: 56px;
  margin-left: -28px;
  margin-top: -28px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;
}

.gesture-point.small {
  width: 36px;
  height: 36px;
  margin-left: -18px;
  margin-top: -18px;
  border-width: 1.5px;
}

.point-inner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #d1d5db;
  transition: all 0.2s ease;
}

.gesture-point.small .point-inner {
  width: 10px;
  height: 10px;
}

.gesture-point.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.gesture-point.selected .point-inner {
  background: #3b82f6;
  transform: scale(1.2);
}

.gesture-point.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.gesture-point.error .point-inner {
  background: #ef4444;
  transform: scale(1.2);
}

.gesture-point.success {
  border-color: #10b981;
  background: #f0fdf4;
}

.gesture-point.success .point-inner {
  background: #10b981;
  transform: scale(1.2);
}

.gesture-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: center;
}

.info-section {
  margin-bottom: 16px;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
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

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-outline {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.btn-outline:hover:not(:disabled) {
  background: #eff6ff;
}

.btn-full {
  width: 100%;
  padding: 12px 24px;
}

.tips-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tips-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tip-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.tip-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.tip-content {
  flex: 1;
  min-width: 0;
}

.tip-title {
  font-size: 14px;
  font-weight: 500;
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
}

.modal-content {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 340px;
  text-align: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.modal-desc {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 20px;
}

.modal-gesture {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.reset-message {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.reset-message.error {
  color: #ef4444;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 375px) {
  .container {
    padding: 0 16px;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .subtitle {
    font-size: 12px;
  }

  .status-card {
    padding: 16px;
    gap: 10px;
  }

  .status-icon {
    font-size: 28px;
  }

  .status-label {
    font-size: 14px;
  }

  .status-description {
    font-size: 11px;
  }

  .gesture-pad {
    width: 260px;
    height: 260px;
  }

  .gesture-point {
    width: 48px;
    height: 48px;
    margin-left: -24px;
    margin-top: -24px;
  }

  .point-inner {
    width: 12px;
    height: 12px;
  }

  .gesture-section {
    padding: 20px 12px;
  }

  .gesture-hint {
    font-size: 14px;
    margin-bottom: 20px;
  }

  .tips-section {
    padding: 16px;
  }

  .tip-item {
    padding: 10px;
  }

  .locked-card {
    padding: 24px 16px;
  }

  .locked-icon {
    font-size: 40px;
  }
}
</style>
