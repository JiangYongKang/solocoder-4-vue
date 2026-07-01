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

      <div v-if="errorCount > 0 && !isLocked && currentStatus !== SET" class="error-hint">
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
        <div class="gesture-hint" :class="{ 'error': hasError, 'success': hasSuccess }">
          {{ stepLabel }}
        </div>

        <div
          ref="gesturePad"
          class="gesture-pad"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="endDrawing"
          @mouseleave="handleMouseLeave"
          @touchstart.prevent="startDrawing"
          @touchmove.prevent="draw"
          @touchend.prevent="endDrawing"
        >
          <svg class="gesture-canvas" :width="canvasSize" :height="canvasSize">
            <line
              v-for="(line, index) in lines"
              :key="'line-' + index"
              :x1="line.x1"
              :y1="line.y1"
              :x2="line.x2"
              :y2="line.y2"
              :stroke="lineColor"
              stroke-width="4"
              stroke-linecap="round"
            />
            <line
              v-if="currentLine"
              :x1="currentLine.x1"
              :y1="currentLine.y1"
              :x2="currentLine.x2"
              :y2="currentLine.y2"
              :stroke="lineColor"
              stroke-width="4"
              stroke-linecap="round"
            />
          </svg>

          <div
            v-for="(point, index) in gesturePoints"
            :key="index"
            class="gesture-point"
            :class="{
              'selected': selectedPoints.includes(index),
              'error': hasError && selectedPoints.includes(index),
              'success': hasSuccess && selectedPoints.includes(index)
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
          <button v-if="canReset" class="btn btn-secondary" @click="showResetConfirm = true">
            重置手势
          </button>
        </div>
      </div>

      <div v-if="isEnabled && currentStatus === SET" class="info-section">
        <button class="btn btn-outline btn-full" @click="showResetConfirm = true">
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

      <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
        <div class="modal-content">
          <div class="modal-title">重置手势密码</div>
          <div class="modal-desc">请验证原手势密码以继续重置</div>
          <div class="modal-gesture">
            <div
              ref="resetPad"
              class="gesture-pad small"
              @mousedown="startResetDrawing"
              @mousemove="drawReset"
              @mouseup="endResetDrawing"
              @mouseleave="handleResetMouseLeave"
              @touchstart.prevent="startResetDrawing"
              @touchmove.prevent="drawReset"
              @touchend.prevent="endResetDrawing"
            >
              <svg class="gesture-canvas" :width="smallCanvasSize" :height="smallCanvasSize">
                <line
                  v-for="(line, index) in resetLines"
                  :key="'rline-' + index"
                  :x1="line.x1 / 1.6"
                  :y1="line.y1 / 1.6"
                  :x2="line.x2 / 1.6"
                  :y2="line.y2 / 1.6"
                  :stroke="resetLineColor"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <line
                  v-if="resetCurrentLine"
                  :x1="resetCurrentLine.x1 / 1.6"
                  :y1="resetCurrentLine.y1 / 1.6"
                  :x2="resetCurrentLine.x2 / 1.6"
                  :y2="resetCurrentLine.y2 / 1.6"
                  :stroke="resetLineColor"
                  stroke-width="3"
                  stroke-linecap="round"
                />
              </svg>

              <div
                v-for="(point, index) in smallGesturePoints"
                :key="index"
                class="gesture-point small"
                :class="{
                  'selected': resetSelectedPoints.includes(index),
                  'error': resetHasError && resetSelectedPoints.includes(index)
                }"
                :style="{ left: point.x + 'px', top: point.y + 'px' }"
              >
                <div class="point-inner"></div>
              </div>
            </div>
          </div>
          <div v-if="resetMessage" class="reset-message" :class="{ error: resetHasError }">
            {{ resetMessage }}
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
  MIN_POINTS,
  MAX_ERRORS,
  LOCK_DURATION,
  GESTURE_STATUS_LABELS,
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
  startReset,
  cancelReset,
  toggleGesture
} from './gestureState.js'

const OFF = GESTURE_STATUS.OFF
const DRAWING = GESTURE_STATUS.DRAWING
const CONFIRMING = GESTURE_STATUS.CONFIRMING
const SET = GESTURE_STATUS.SET
const VERIFYING = GESTURE_STATUS.VERIFYING
const LOCKED = GESTURE_STATUS.LOCKED

const FIRST_DRAW = GESTURE_STEP.FIRST_DRAW
const SECOND_DRAW = GESTURE_STEP.SECOND_DRAW
const IDLE = GESTURE_STEP.IDLE

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
const smallCanvasSize = computed(() => Math.floor(canvasSize.value / 1.6))
const pointRadius = 28
const smallPointRadius = Math.floor(pointRadius / 1.6)

const gesturePoints = ref([])
const smallGesturePoints = ref([])
const selectedPoints = ref([])
const lines = ref([])
const currentLine = ref(null)
const isDrawing = ref(false)
const hasError = ref(false)
const hasSuccess = ref(false)

const resetSelectedPoints = ref([])
const resetLines = ref([])
const resetCurrentLine = ref(null)
const isResetDrawing = ref(false)
const resetHasError = ref(false)
const showResetConfirm = ref(false)
const resetMessage = ref('')

const message = ref('')
const messageType = ref('info')
const lockTimer = ref(null)
const lockRemaining = ref(0)

const gesturePad = ref(null)
const resetPad = ref(null)

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
  if (hasError.value) return message.value
  if (hasSuccess.value) return message.value
  return getStepLabel(currentStep.value)
})

const lineColor = computed(() => {
  if (hasError.value) return '#ef4444'
  if (hasSuccess.value) return '#10b981'
  return '#3b82f6'
})

const resetLineColor = computed(() => {
  return resetHasError.value ? '#ef4444' : '#3b82f6'
})

const showGestureArea = computed(() => {
  return isEnabled.value && !isLocked.value && currentStatus.value !== OFF
})

const showActions = computed(() => {
  return currentStatus.value === DRAWING ||
         currentStatus.value === CONFIRMING ||
         currentStatus.value === SET
})

const canCancel = computed(() => {
  return currentStatus.value === DRAWING || currentStatus.value === CONFIRMING
})

const canReset = computed(() => {
  return currentStatus.value === SET
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

function initGesturePoints() {
  const padding = 40
  const usableSize = canvasSize.value - padding * 2
  const gap = usableSize / 2

  gesturePoints.value = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      gesturePoints.value.push({
        x: padding + col * gap,
        y: padding + row * gap,
        index: row * 3 + col
      })
    }
  }

  const smallPadding = Math.floor(padding / 1.6)
  const smallUsableSize = smallCanvasSize.value - smallPadding * 2
  const smallGap = smallUsableSize / 2

  smallGesturePoints.value = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      smallGesturePoints.value.push({
        x: smallPadding + col * smallGap,
        y: smallPadding + row * smallGap,
        index: row * 3 + col
      })
    }
  }
}

function getPointFromEvent(event, pad, points, radius) {
  const rect = pad.getBoundingClientRect()
  const clientX = event.touches ? event.touches[0].clientX : event.clientX
  const clientY = event.touches ? event.touches[0].clientY : event.clientY
  const x = clientX - rect.left
  const y = clientY - rect.top

  for (let i = 0; i < points.value.length; i++) {
    const point = points.value[i]
    const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2))
    if (distance <= radius) {
      return { index: i, x, y }
    }
  }

  return { index: -1, x, y }
}

function startDrawing(event) {
  if (!canDraw()) return
  isDrawing.value = true
  hasError.value = false
  hasSuccess.value = false
  message.value = ''
  selectedPoints.value = []
  lines.value = []
  currentLine.value = null

  const result = getPointFromEvent(event, gesturePad.value, gesturePoints, pointRadius)
  if (result.index !== -1) {
    addPoint(result.index)
  }
}

function draw(event) {
  if (!isDrawing.value) return

  const result = getPointFromEvent(event, gesturePad.value, gesturePoints, pointRadius)

  if (result.index !== -1 && !selectedPoints.value.includes(result.index)) {
    addPoint(result.index)
  }

  if (selectedPoints.value.length > 0) {
    const lastPoint = gesturePoints.value[selectedPoints.value[selectedPoints.value.length - 1]]
    currentLine.value = {
      x1: lastPoint.x,
      y1: lastPoint.y,
      x2: result.x,
      y2: result.y
    }
  }
}

function endDrawing() {
  if (!isDrawing.value) return
  isDrawing.value = false
  currentLine.value = null

  if (selectedPoints.value.length < MIN_POINTS) {
    showError(`至少需要连接 ${MIN_POINTS} 个点位`)
    return
  }

  handleGestureComplete(selectedPoints.value)
}

function handleMouseLeave() {
  if (isDrawing.value) {
    endDrawing()
  }
}

function addPoint(index) {
  const pointsArr = selectedPoints.value
  pointsArr.push(index)

  if (pointsArr.length > 1) {
    const prevIndex = pointsArr[pointsArr.length - 2]
    const prevPoint = gesturePoints.value[prevIndex]
    const currPoint = gesturePoints.value[index]
    lines.value.push({
      x1: prevPoint.x,
      y1: prevPoint.y,
      x2: currPoint.x,
      y2: currPoint.y
    })
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
      clearGesturePad()
    } else {
      showError(result.error)
    }
  } else if (status === CONFIRMING && step === SECOND_DRAW) {
    const result = confirmGesture(status, step, firstGesture.value, points)
    applyResult(result)
    if (result.success) {
      showSuccess('手势密码设置成功')
      setTimeout(clearGesturePad, 1500)
    } else {
      showError(result.error)
    }
  } else if (status === SET) {
    const result = verifyGesture(status, savedGesture.value, points, errorCount.value)
    applyResult(result)
    if (result.success) {
      showSuccess('验证成功')
      setTimeout(clearGesturePad, 1500)
    } else {
      showError(result.error)
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

function showError(msg) {
  hasError.value = true
  message.value = msg
  messageType.value = 'error'
  setTimeout(() => {
    if (!isLocked.value) {
      clearGesturePad()
    }
  }, 1500)
}

function showSuccess(msg) {
  hasSuccess.value = true
  message.value = msg
  messageType.value = 'success'
}

function clearGesturePad() {
  selectedPoints.value = []
  lines.value = []
  currentLine.value = null
  hasError.value = false
  hasSuccess.value = false
  if (!isLocked.value) {
    message.value = ''
  }
}

function handleToggle(event) {
  const enabled = event.target.checked
  const result = toggleGesture(enabled, currentStatus.value, state.value)
  applyResult(result)

  if (result.success) {
    if (!enabled) {
      clearGesturePad()
      showSuccess('手势密码已关闭')
    } else {
      clearGesturePad()
      message.value = '请绘制新手势密码'
    }
  } else {
    event.target.checked = isEnabled.value
    showError(result.error)
  }
}

function handleCancel() {
  const result = cancelReset(currentStatus.value)
  applyResult(result)
  clearGesturePad()
}

function handleUnlock() {
  const result = unlockAfterLock(currentStatus.value, lockStartTime.value, LOCK_DURATION)
  applyResult(result)
  if (result.success) {
    stopLockTimer()
    clearGesturePad()
    message.value = '请验证手势密码'
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

function startResetDrawing(event) {
  if (isLocked.value) return
  isResetDrawing.value = true
  resetHasError.value = false
  resetMessage.value = ''
  resetSelectedPoints.value = []
  resetLines.value = []
  resetCurrentLine.value = null

  const result = getPointFromEvent(event, resetPad.value, smallGesturePoints, smallPointRadius)
  if (result.index !== -1) {
    addResetPoint(result.index)
  }
}

function drawReset(event) {
  if (!isResetDrawing.value) return

  const result = getPointFromEvent(event, resetPad.value, smallGesturePoints, smallPointRadius)

  if (result.index !== -1 && !resetSelectedPoints.value.includes(result.index)) {
    addResetPoint(result.index)
  }

  if (resetSelectedPoints.value.length > 0) {
    const lastPoint = smallGesturePoints.value[resetSelectedPoints.value[resetSelectedPoints.value.length - 1]]
    resetCurrentLine.value = {
      x1: lastPoint.x * 1.6,
      y1: lastPoint.y * 1.6,
      x2: result.x * 1.6,
      y2: result.y * 1.6
    }
  }
}

function endResetDrawing() {
  if (!isResetDrawing.value) return
  isResetDrawing.value = false
  resetCurrentLine.value = null

  if (resetSelectedPoints.value.length < MIN_POINTS) {
    resetHasError.value = true
    resetMessage.value = `至少需要连接 ${MIN_POINTS} 个点位`
    setTimeout(clearResetPad, 1500)
    return
  }

  handleResetComplete(resetSelectedPoints.value)
}

function handleResetMouseLeave() {
  if (isResetDrawing.value) {
    endResetDrawing()
  }
}

function addResetPoint(index) {
  const pointsArr = resetSelectedPoints.value
  pointsArr.push(index)

  if (pointsArr.length > 1) {
    const prevIndex = pointsArr[pointsArr.length - 2]
    const prevPoint = smallGesturePoints.value[prevIndex]
    const currPoint = smallGesturePoints.value[index]
    resetLines.value.push({
      x1: prevPoint.x * 1.6,
      y1: prevPoint.y * 1.6,
      x2: currPoint.x * 1.6,
      y2: currPoint.y * 1.6
    })
  }
}

function handleResetComplete(points) {
  const result = startReset(currentStatus.value, savedGesture.value, points, errorCount.value)
  applyResult(result)

  if (result.success) {
    closeResetModal()
    clearGesturePad()
    showSuccess('验证成功，请绘制新手势')
  } else {
    resetHasError.value = true
    resetMessage.value = result.error
    if (result.isLocked) {
      setTimeout(closeResetModal, 1500)
    } else {
      setTimeout(clearResetPad, 1500)
    }
  }
}

function clearResetPad() {
  resetSelectedPoints.value = []
  resetLines.value = []
  resetCurrentLine.value = null
  resetHasError.value = false
  resetMessage.value = ''
}

function closeResetModal() {
  showResetConfirm.value = false
  clearResetPad()
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
  initGesturePoints()
}

watch(isLocked, (locked) => {
  if (locked && lockStartTime.value) {
    startLockTimer()
  } else {
    stopLockTimer()
  }
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
  width: 180px;
  height: 180px;
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
