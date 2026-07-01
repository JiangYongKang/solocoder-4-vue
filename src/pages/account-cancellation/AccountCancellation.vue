<template>
  <div class="account-cancellation">
    <div class="container">
      <header class="page-header">
        <h1>账号注销申请</h1>
        <p class="subtitle">请谨慎操作，账号注销后部分数据将永久清除且不可恢复</p>
      </header>

      <div class="status-card" :style="{ borderColor: statusColor }">
        <div class="status-icon">{{ statusIcon }}</div>
        <div class="status-info">
          <div class="status-label" :style="{ color: statusColor }">
            {{ statusLabel }}
          </div>
          <div class="status-description">{{ statusDescription }}</div>
        </div>
      </div>

      <div v-if="status === NOT_APPLIED || status === REVOKED" class="content-flow">

        <section class="card">
          <div class="card-header">
            <h2>注销影响说明</h2>
            <span class="step-badge">第 1 步 / 共 3 步</span>
          </div>

          <div class="risk-banner">
            <span class="risk-icon">⚠️</span>
            <div class="risk-content">
              <strong>高风险操作提示：</strong>
              账号注销是不可逆操作，请确保已备份所有重要数据、转出所有资产后再继续。
            </div>
          </div>

          <div class="impact-tabs">
            <button
              v-for="tab in impactTabs"
              :key="tab.id"
              class="impact-tab"
              :class="{ active: activeImpactTab === tab.id }"
              @click="activeImpactTab = tab.id"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          </div>

          <div class="impact-list">
            <div v-for="category in currentImpactData" :key="category.id" class="impact-category">
              <div class="category-header" :class="{ 'high-risk': category.warningLevel === 'high' }">
                <span class="category-icon">{{ category.icon }}</span>
                <div class="category-info">
                  <div class="category-title">{{ category.title }}</div>
                  <div class="category-desc">{{ category.description }}</div>
                </div>
                <span v-if="category.warningLevel === 'high'" class="risk-tag">高风险</span>
              </div>
              <div class="item-list">
                <div v-for="(item, idx) in category.items" :key="idx" class="item-row">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-scope" :class="'scope-' + item.scope">
                    {{ getScopeLabel(item.scope) }}
                  </span>
                  <span v-if="item.irreversible" class="irreversible-tag">不可逆</span>
                </div>
                <div v-for="(item, idx) in category.items.filter(i => i.note || i.retentionDesc)" :key="'note-' + idx" class="item-note">
                  📌 {{ item.note || item.retentionDesc }}
                </div>
              </div>
            </div>
          </div>

          <div class="irreversible-risks">
            <h3>不可逆风险确认</h3>
            <div class="risk-grid">
              <div v-for="risk in irreversibleRisks" :key="risk.id" class="risk-card">
                <div class="risk-card-icon">{{ risk.icon }}</div>
                <div class="risk-card-content">
                  <div class="risk-card-title">{{ risk.title }}</div>
                  <div class="risk-card-desc">{{ risk.description }}</div>
                </div>
              </div>
            </div>
          </div>

          <label class="ack-checkbox">
            <input type="checkbox" v-model="acknowledgedImpacts" />
            <span class="checkmark"></span>
            <span class="ack-text">
              我已仔细阅读并知晓以上 <strong>{{ dataItemCount.irreversible }}</strong> 项不可逆操作及全部影响，
              确认已备份所需数据并处理完所有资产。
            </span>
          </label>
        </section>

        <section class="card" :class="{ disabled: !acknowledgedImpacts }">
          <div class="card-header">
            <h2>身份二次验证</h2>
            <span class="step-badge">第 2 步 / 共 3 步</span>
          </div>

          <div v-if="!acknowledgedImpacts" class="blocked-hint">
            请先完成上方的注销影响确认
          </div>

          <div v-else>
            <div class="method-tabs">
              <button
                v-for="method in verificationMethods"
                :key="method.value"
                class="method-tab"
                :class="{ active: selectedMethod === method.value }"
                @click="selectVerificationMethod(method.value)"
              >
                <span class="method-icon">{{ method.icon }}</span>
                <div class="method-info">
                  <div class="method-label">{{ method.label }}</div>
                  <div class="method-desc">{{ method.desc }}</div>
                </div>
              </button>
            </div>

            <div class="verification-form">
              <div v-if="selectedMethod === PASSWORD" class="form-field">
                <label class="field-label">登录密码</label>
                <input
                  v-model="verificationValue"
                  type="password"
                  class="field-input"
                  :class="{ 'has-error': verificationError }"
                  placeholder="请输入登录密码"
                  @input="clearVerificationError"
                />
              </div>

              <div v-else class="form-field">
                <div class="code-field-row">
                  <div class="code-input-wrap">
                    <label class="field-label">
                      {{ selectedMethod === SMS_CODE ? '手机号' : '邮箱' }}
                    </label>
                    <div class="masked-contact">
                      {{ selectedMethod === SMS_CODE ? maskedPhone : maskedEmail }}
                    </div>
                  </div>
                  <button
                    class="send-code-btn"
                    :disabled="sendingCode || codeCountdown > 0 || verificationLocked"
                    @click="handleSendCode"
                  >
                    <span v-if="sendingCode">发送中...</span>
                    <span v-else-if="codeCountdown > 0">{{ codeCountdown }}s 后重发</span>
                    <span v-else>发送验证码</span>
                  </button>
                </div>
                <label class="field-label">验证码</label>
                <input
                  v-model="verificationValue"
                  type="text"
                  class="field-input code-input"
                  :class="{ 'has-error': verificationError }"
                  :placeholder="`请输入${codeLength}位验证码`"
                  :maxlength="codeLength"
                  @input="clearVerificationError"
                />
              </div>

              <div v-if="verificationError" class="error-message">
                ❌ {{ verificationError }}
              </div>

              <div v-if="verificationAttempts > 0 && !verificationLocked" class="attempts-hint">
                剩余验证次数：{{ maxAttempts - verificationAttempts }}
              </div>

              <div v-if="verificationLocked" class="locked-hint">
                🔒 验证失败次数过多，请稍后再试
              </div>

              <button
                class="btn btn-primary verify-btn"
                :disabled="!canVerify || verifying"
                @click="handleVerify"
              >
                <span v-if="verifying" class="btn-spinner"></span>
                {{ verifying ? '验证中...' : '确认身份' }}
              </button>
            </div>
          </div>
        </section>

        <section class="card" :class="{ disabled: !identityVerified }">
          <div class="card-header">
            <h2>提交注销申请</h2>
            <span class="step-badge">第 3 步 / 共 3 步</span>
          </div>

          <div v-if="!identityVerified" class="blocked-hint">
            请先完成身份二次验证
          </div>

          <div v-else>
            <div class="summary-box">
              <div class="summary-item">
                <span class="summary-label">冷静期时长</span>
                <span class="summary-value">{{ coolingPeriodDays }} 天</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">冷静期内操作</span>
                <span class="summary-value">可随时撤销申请</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">冷静期结束</span>
                <span class="summary-value">账号注销自动生效</span>
              </div>
            </div>

            <label class="ack-checkbox">
              <input type="checkbox" v-model="finalConfirmation" />
              <span class="checkmark"></span>
              <span class="ack-text">
                最终确认：我已明确知晓所有风险，自愿申请注销账号，并同意在冷静期内可撤销申请。
              </span>
            </label>

            <button
              class="btn btn-danger submit-btn"
              :disabled="!finalConfirmation || submitting"
              @click="handleSubmitCancellation"
            >
              <span v-if="submitting" class="btn-spinner"></span>
              {{ submitting ? '提交中...' : '提交注销申请' }}
            </button>
          </div>
        </section>
      </div>

      <div v-if="status === COOLING_PERIOD" class="content-flow">

        <section class="card">
          <div class="card-header">
            <h2>冷静期进度</h2>
          </div>

          <div class="countdown-display">
            <div class="countdown-label">距离注销完成还剩</div>
            <div class="countdown-values">
              <div class="countdown-block">
                <span class="countdown-num">{{ remainingTime.days }}</span>
                <span class="countdown-unit">天</span>
              </div>
              <div class="countdown-sep">:</div>
              <div class="countdown-block">
                <span class="countdown-num">{{ padZero(remainingTime.hours) }}</span>
                <span class="countdown-unit">时</span>
              </div>
              <div class="countdown-sep">:</div>
              <div class="countdown-block">
                <span class="countdown-num">{{ padZero(remainingTime.minutes) }}</span>
                <span class="countdown-unit">分</span>
              </div>
              <div class="countdown-sep">:</div>
              <div class="countdown-block">
                <span class="countdown-num">{{ padZero(remainingTime.seconds) }}</span>
                <span class="countdown-unit">秒</span>
              </div>
            </div>
          </div>

          <div class="progress-container">
            <div class="progress-bar-wrap">
              <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
            </div>
            <div class="progress-meta">
              <span>进度 {{ progressPercentage }}%</span>
              <span>{{ progressStageLabel }}</span>
            </div>
          </div>

          <div class="milestones">
            <div
              v-for="milestone in milestones"
              :key="milestone.id"
              class="milestone-item"
              :class="{ active: isMilestoneReached(milestone) }"
            >
              <div class="milestone-dot">
                <div class="dot-inner"></div>
              </div>
              <div class="milestone-line" v-if="milestone.offset < 100"></div>
              <div class="milestone-content">
                <div class="milestone-label">{{ milestone.label }}</div>
                <div class="milestone-date">{{ formatDate(milestone.date) }}</div>
                <div class="milestone-desc">{{ milestone.description }}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <h2>数据清除范围</h2>
          </div>

          <div class="clear-scope-tabs">
            <button
              v-for="scope in clearScopes"
              :key="scope.value"
              class="scope-tab"
              :class="{ active: activeClearScope === scope.value }"
              @click="activeClearScope = scope.value"
            >
              {{ scope.label }}
            </button>
          </div>

          <div class="scope-detail">
            <div class="scope-note" :class="'scope-note-' + activeClearScope">
              {{ getScopeNote(activeClearScope) }}
            </div>

            <div v-if="currentClearData.length === 0" class="empty-scope">
              此范围暂无需要清除的数据
            </div>

            <div v-else class="scope-list">
              <div v-for="category in currentClearData" :key="category.id" class="scope-category">
                <div class="scope-cat-header">
                  <span class="scope-cat-icon">{{ category.icon }}</span>
                  <span class="scope-cat-title">{{ category.title }}</span>
                </div>
                <ul class="scope-items">
                  <li v-for="(item, idx) in category.items" :key="idx">{{ item.name }}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section class="card danger-card">
          <div class="card-header">
            <h2>撤销注销申请</h2>
          </div>

          <div class="revoke-intro">
            <div class="revoke-icon">↩️</div>
            <div class="revoke-info">
              在冷静期内，您可以随时撤销本次注销申请。撤销后账号将恢复正常使用，所有数据和权益保持不变。
            </div>
          </div>

          <div v-if="!showRevokeConfirm" class="revoke-actions">
            <button class="btn btn-primary" @click="showRevokeConfirm = true">
              撤销注销申请
            </button>
          </div>

          <div v-else class="revoke-confirm-panel">
            <div class="confirm-header">请确认撤销原因</div>
            <div class="reason-list">
              <label
                v-for="reason in revokeReasons"
                :key="reason.id"
                class="reason-option"
                :class="{ selected: selectedRevokeReason === reason.id }"
                @click="selectedRevokeReason = reason.id"
              >
                <input type="radio" v-model="selectedRevokeReason" :value="reason.id" />
                <span class="radio-custom"></span>
                <span class="reason-label">{{ reason.label }}</span>
              </label>
            </div>

            <label class="ack-checkbox">
              <input type="checkbox" v-model="revokeConfirmation" />
              <span class="checkmark"></span>
              <span class="ack-text">
                我确认撤销本次注销申请，账号恢复正常使用。
              </span>
            </label>

            <div class="confirm-actions">
              <button
                class="btn btn-secondary"
                :disabled="revoking"
                @click="cancelRevoke"
              >
                取消
              </button>
              <button
                class="btn btn-primary"
                :disabled="!canRevokeConfirm || revoking"
                @click="handleRevokeCancellation"
              >
                <span v-if="revoking" class="btn-spinner"></span>
                {{ revoking ? '撤销中...' : '确认撤销' }}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div v-if="status === REVOKED" class="content-flow">
        <section class="card success-card">
          <div class="success-display">
            <div class="success-icon">↩️</div>
            <h2 class="success-title">注销申请已撤销</h2>
            <p class="success-desc">
              您的账号已恢复正常使用，所有数据和权益保持不变。
            </p>
            <div class="revoke-timeline">
              <div class="timeline-item">
                <span class="timeline-dot submitted"></span>
                <div class="timeline-content">
                  <div class="timeline-label">申请提交时间</div>
                  <div class="timeline-value">{{ formatDate(submittedAt) }}</div>
                </div>
              </div>
              <div class="timeline-item">
                <span class="timeline-dot revoked"></span>
                <div class="timeline-content">
                  <div class="timeline-label">申请撤销时间</div>
                  <div class="timeline-value">{{ formatDate(revokedAt) }}</div>
                </div>
              </div>
              <div v-if="selectedRevokeReason" class="timeline-item">
                <span class="timeline-dot reason"></span>
                <div class="timeline-content">
                  <div class="timeline-label">撤销原因</div>
                  <div class="timeline-value">{{ getRevokeReasonLabel(selectedRevokeReason) }}</div>
                </div>
              </div>
            </div>

            <button class="btn btn-primary reapply-btn" @click="handleResetToApply">
              重新申请注销
            </button>
          </div>
        </section>
      </div>

      <div v-if="status === COMPLETED" class="content-flow">
        <section class="card success-card">
          <div class="success-display">
            <div class="success-icon">✅</div>
            <h2 class="success-title">账号注销已完成</h2>
            <p class="success-desc">
              您的账号已完成注销流程，相关数据已按照《隐私政策》规定的范围清除。
            </p>
            <div class="complete-timeline">
              <div class="timeline-item">
                <span class="timeline-dot submitted"></span>
                <div class="timeline-content">
                  <div class="timeline-label">申请提交时间</div>
                  <div class="timeline-value">{{ formatDate(submittedAt) }}</div>
                </div>
              </div>
              <div class="timeline-item">
                <span class="timeline-dot completed"></span>
                <div class="timeline-content">
                  <div class="timeline-label">注销完成时间</div>
                  <div class="timeline-value">{{ formatDate(completedAt || coolingEndAt) }}</div>
                </div>
              </div>
            </div>
            <div class="contact-support">
              如有疑问，请 <a href="#contact">联系客服</a>。
            </div>
          </div>
        </section>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  CANCELLATION_STATUS,
  VERIFICATION_METHOD,
  DATA_CLEAR_SCOPE,
  STATUS_LABELS,
  COOLING_PERIOD_DAYS,
  SMS_CODE_LENGTH,
  EMAIL_CODE_LENGTH,
  MAX_VERIFICATION_ATTEMPTS,
  VERIFICATION_ERRORS
} from './constants.js'
import {
  DATA_IMPACTS,
  IRREVERSIBLE_RISKS,
  getDataImpactsByScope,
  getIrreversibleItems,
  countDataItems,
  getScopeLabel,
  getHighRiskCategories
} from './dataImpact.js'
import {
  performVerificationWithAttempts,
  generateVerificationCode,
  sendVerificationCodeAsync,
  verifyIdentityAsync,
  getCodeExpirationTime,
  isCodeExpired,
  getMaskedPhone,
  getMaskedEmail
} from './identityVerification.js'
import {
  getRemainingTime,
  formatRemainingTime,
  getProgressPercentage,
  getProgressStage,
  getMilestoneEvents,
  formatDateString
} from './coolingPeriod.js'
import {
  submitCancellation,
  revokeCancellation,
  getStatusDescription,
  getStatusIcon,
  getStatusColor,
  computeActualStatus,
  getRevokeReasons
} from './cancellationState.js'

const NOT_APPLIED = CANCELLATION_STATUS.NOT_APPLIED
const COOLING_PERIOD = CANCELLATION_STATUS.COOLING_PERIOD
const REVOKED = CANCELLATION_STATUS.REVOKED
const COMPLETED = CANCELLATION_STATUS.COMPLETED

const PASSWORD = VERIFICATION_METHOD.PASSWORD
const SMS_CODE = VERIFICATION_METHOD.SMS_CODE
const EMAIL_CODE = VERIFICATION_METHOD.EMAIL_CODE

const status = ref(NOT_APPLIED)
const submittedAt = ref(null)
const revokedAt = ref(null)
const completedAt = ref(null)
const coolingEndAt = ref(null)
const selectedRevokeReason = ref(null)

const acknowledgedImpacts = ref(false)
const identityVerified = ref(false)
const finalConfirmation = ref(false)
const submitting = ref(false)
const revoking = ref(false)

const activeImpactTab = ref('all')
const verificationMethods = [
  { value: PASSWORD, label: '密码验证', desc: '使用登录密码验证', icon: '🔐' },
  { value: SMS_CODE, label: '短信验证', desc: '接收手机验证码', icon: '📱' },
  { value: EMAIL_CODE, label: '邮箱验证', desc: '接收邮箱验证码', icon: '📧' }
]
const selectedMethod = ref(PASSWORD)
const verificationValue = ref('')
const verificationError = ref('')
const verificationAttempts = ref(0)
const verificationLocked = ref(false)
const verifying = ref(false)

const sendingCode = ref(false)
const codeCountdown = ref(0)
const codeExpirationAt = ref(null)
const generatedCode = ref(null)
let countdownTimer = null

const maskPhone = '13800138000'
const maskEmail = 'user@example.com'
const maskedPhone = computed(() => getMaskedPhone(maskPhone))
const maskedEmail = computed(() => getMaskedEmail(maskEmail))

const maxAttempts = MAX_VERIFICATION_ATTEMPTS
const codeLength = computed(() => {
  if (selectedMethod.value === SMS_CODE) return SMS_CODE_LENGTH
  if (selectedMethod.value === EMAIL_CODE) return EMAIL_CODE_LENGTH
  return 0
})

const showRevokeConfirm = ref(false)
const revokeConfirmation = ref(false)

const activeClearScope = ref(DATA_CLEAR_SCOPE.IMMEDIATE)

const dataItemCount = countDataItems()
const irreversibleRisks = IRREVERSIBLE_RISKS

const impactTabs = [
  { id: 'all', label: '全部影响', icon: '📋' },
  { id: 'irreversible', label: '不可逆项', icon: '🔴' },
  { id: 'high_risk', label: '高风险类', icon: '⚠️' }
]

const currentImpactData = computed(() => {
  if (activeImpactTab.value === 'irreversible') {
    return getIrreversibleItems()
  }
  if (activeImpactTab.value === 'high_risk') {
    return getHighRiskCategories()
  }
  return DATA_IMPACTS
})

const statusLabel = computed(() => STATUS_LABELS[status.value])
const statusDescription = computed(() => getStatusDescription(status.value))
const statusIcon = computed(() => getStatusIcon(status.value))
const statusColor = computed(() => getStatusColor(status.value))

const canVerify = computed(() => {
  return verificationValue.value.length > 0 &&
    !verificationLocked.value &&
    !verifying.value
})

const canRevokeConfirm = computed(() => {
  return selectedRevokeReason.value && revokeConfirmation.value && !revoking.value
})

const revokeReasons = getRevokeReasons()

const coolingPeriodDays = COOLING_PERIOD_DAYS

let tickInterval = null
const currentTick = ref(new Date().toISOString())

const remainingTime = computed(() => {
  if (!coolingEndAt.value) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 }
  }
  return getRemainingTime(coolingEndAt.value, currentTick.value) || {
    expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0
  }
})

const progressPercentage = computed(() => {
  if (!submittedAt.value) return 0
  return getProgressPercentage(submittedAt.value, currentTick.value, COOLING_PERIOD_DAYS)
})

const progressStageLabel = computed(() => {
  return getProgressStage(progressPercentage.value).label
})

const milestones = computed(() => {
  if (!submittedAt.value) return []
  return getMilestoneEvents(submittedAt.value, COOLING_PERIOD_DAYS)
})

const clearScopes = [
  { value: DATA_CLEAR_SCOPE.IMMEDIATE, label: getScopeLabel(DATA_CLEAR_SCOPE.IMMEDIATE) },
  { value: DATA_CLEAR_SCOPE.COOLING_PERIOD_END, label: getScopeLabel(DATA_CLEAR_SCOPE.COOLING_PERIOD_END) },
  { value: DATA_CLEAR_SCOPE.RETAINED, label: getScopeLabel(DATA_CLEAR_SCOPE.RETAINED) }
]

const currentClearData = computed(() => {
  return getDataImpactsByScope(activeClearScope.value)
})

function padZero(num) {
  return num.toString().padStart(2, '0')
}

function formatDate(dateStr) {
  return formatDateString(dateStr)
}

function isMilestoneReached(milestone) {
  return progressPercentage.value >= milestone.offset
}

function getScopeNote(scope) {
  const notes = {
    [DATA_CLEAR_SCOPE.IMMEDIATE]: '以下数据将在提交注销申请后立即进入清除队列，撤销后将恢复。',
    [DATA_CLEAR_SCOPE.COOLING_PERIOD_END]: '以下数据将在冷静期结束后永久清除，期间撤销可恢复。',
    [DATA_CLEAR_SCOPE.RETAINED]: '以下数据因法律法规要求需保留，不会被清除，保留期满后将自动删除。'
  }
  return notes[scope] || ''
}

function getRevokeReasonLabel(reasonId) {
  const reason = revokeReasons.find(r => r.id === reasonId)
  return reason ? reason.label : ''
}

function selectVerificationMethod(method) {
  selectedMethod.value = method
  verificationValue.value = ''
  verificationError.value = ''
  codeCountdown.value = 0
  codeExpirationAt.value = null
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function clearVerificationError() {
  verificationError.value = ''
}

async function handleSendCode() {
  if (sendingCode.value || codeCountdown.value > 0 || verificationLocked.value) return

  sendingCode.value = true
  verificationError.value = ''

  try {
    const contact = selectedMethod.value === SMS_CODE ? maskPhone : maskEmail
    const code = await sendVerificationCodeAsync(selectedMethod.value, contact)
    generatedCode.value = code
    codeExpirationAt.value = getCodeExpirationTime(5)
    codeCountdown.value = 60

    countdownTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error) {
    verificationError.value = error.message || VERIFICATION_ERRORS.NETWORK_ERROR
  } finally {
    sendingCode.value = false
  }
}

async function handleVerify() {
  if (!canVerify.value) return

  verifying.value = true
  verificationError.value = ''

  try {
    if (selectedMethod.value !== PASSWORD) {
      if (!generatedCode.value) {
        verificationError.value = '请先获取验证码'
        return
      }
      if (codeExpirationAt.value && isCodeExpired(codeExpirationAt.value)) {
        verificationError.value = '验证码已过期，请重新获取'
        return
      }
    }

    const result = await verifyIdentityAsync(
      selectedMethod.value,
      verificationValue.value,
      verificationAttempts.value,
      generatedCode.value
    )

    verificationAttempts.value = result.attempts
    verificationLocked.value = result.locked

    if (result.valid) {
      identityVerified.value = true
      verificationError.value = ''
    } else {
      verificationError.value = result.error
    }
  } catch (error) {
    verificationError.value = error.message || VERIFICATION_ERRORS.NETWORK_ERROR
  } finally {
    verifying.value = false
  }
}

async function handleSubmitCancellation() {
  if (!finalConfirmation.value || submitting.value) return

  submitting.value = true
  await new Promise(r => setTimeout(r, 1000))

  const result = submitCancellation(status.value, identityVerified.value)
  if (result.success) {
    status.value = result.newStatus
    submittedAt.value = result.submittedAt
    coolingEndAt.value = result.coolingEndAt
    startTick()
  } else {
    verificationError.value = result.error
  }

  submitting.value = false
}

function cancelRevoke() {
  showRevokeConfirm.value = false
  selectedRevokeReason.value = null
  revokeConfirmation.value = false
}

async function handleRevokeCancellation() {
  if (!canRevokeConfirm.value || revoking.value) return

  revoking.value = true
  await new Promise(r => setTimeout(r, 1000))

  const result = revokeCancellation(status.value, submittedAt.value)
  if (result.success) {
    status.value = result.newStatus
    revokedAt.value = result.revokedAt
    stopTick()
  }

  revoking.value = false
  showRevokeConfirm.value = false
}

function handleResetToApply() {
  status.value = NOT_APPLIED
  acknowledgedImpacts.value = false
  identityVerified.value = false
  finalConfirmation.value = false
  verificationValue.value = ''
  verificationError.value = ''
  verificationAttempts.value = 0
  verificationLocked.value = false
  submittedAt.value = null
  revokedAt.value = null
  coolingEndAt.value = null
  selectedRevokeReason.value = null
  revokeConfirmation.value = false
  showRevokeConfirm.value = false
}

function startTick() {
  if (tickInterval) return
  tickInterval = setInterval(() => {
    currentTick.value = new Date().toISOString()
  }, 1000)
}

function stopTick() {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
}

function updateStatusByTime() {
  if (submittedAt.value && !revokedAt.value) {
    const actual = computeActualStatus(submittedAt.value, null, currentTick.value)
    if (actual === COMPLETED && status.value === COOLING_PERIOD) {
      status.value = COMPLETED
      completedAt.value = coolingEndAt.value
      stopTick()
    }
  }
}

watch(currentTick, () => {
  updateStatusByTime()
})

onMounted(() => {
  if (status.value === COOLING_PERIOD) {
    startTick()
  }
})

onUnmounted(() => {
  stopTick()
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.account-cancellation {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24px 0;
}

.container {
  max-width: 960px;
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
  padding: 24px;
  border-left: 4px solid #6b7280;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.status-label {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.status-description {
  font-size: 14px;
  color: #6b7280;
}

.content-flow {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card.disabled {
  opacity: 0.55;
  pointer-events: none;
}

.card.danger-card {
  border: 1px solid #fecaca;
  background: #fef2f2;
}

.card.success-card {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

.step-badge {
  background: #eff6ff;
  color: #2563eb;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.risk-banner {
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.risk-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.risk-content {
  font-size: 14px;
  color: #92400e;
  line-height: 1.6;
}

.risk-content strong {
  color: #78350f;
}

.impact-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.impact-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.impact-tab:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.impact-tab.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: #ffffff;
}

.tab-icon {
  font-size: 14px;
}

.impact-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.impact-category {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
}

.category-header.high-risk {
  background: #fef2f2;
}

.category-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-title {
  font-weight: 600;
  color: #111827;
  font-size: 15px;
}

.category-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.risk-tag {
  background: #dc2626;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.item-list {
  padding: 12px 16px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 14px;
  flex-wrap: wrap;
}

.item-name {
  color: #374151;
  flex: 1;
  min-width: 140px;
}

.item-scope {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.item-scope.scope-immediate {
  background: #fee2e2;
  color: #dc2626;
}

.item-scope.scope-cooling_period_end {
  background: #fef3c7;
  color: #d97706;
}

.item-scope.scope-retained {
  background: #dbeafe;
  color: #2563eb;
}

.irreversible-tag {
  background: #dc2626;
  color: #ffffff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.item-note {
  font-size: 12px;
  color: #6b7280;
  padding: 6px 0 6px 4px;
  line-height: 1.5;
}

.irreversible-risks {
  margin-top: 24px;
}

.irreversible-risks h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.risk-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.risk-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.risk-card-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.risk-card-title {
  font-weight: 600;
  color: #991b1b;
  font-size: 14px;
  margin-bottom: 4px;
}

.risk-card-desc {
  font-size: 12px;
  color: #7f1d1d;
  line-height: 1.5;
}

.ack-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 24px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
  padding-left: 30px;
}

.ack-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  left: 0;
  top: 2px;
  height: 18px;
  width: 18px;
  z-index: 1;
}

.checkmark {
  position: absolute;
  top: 2px;
  left: 0;
  height: 18px;
  width: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  background: #ffffff;
  transition: all 0.2s;
}

.ack-checkbox input:checked ~ .checkmark {
  background: #3b82f6;
  border-color: #3b82f6;
}

.checkmark::after {
  content: '';
  position: absolute;
  display: none;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 10px;
  border: solid #ffffff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.ack-checkbox input:checked ~ .checkmark::after {
  display: block;
}

.ack-text {
  color: #374151;
}

.ack-text strong {
  color: #dc2626;
}

.blocked-hint {
  background: #f3f4f6;
  color: #6b7280;
  padding: 20px;
  text-align: center;
  border-radius: 8px;
  font-size: 14px;
}

.method-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.method-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.method-tab:hover {
  border-color: #3b82f6;
}

.method-tab.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.method-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.method-info {
  flex: 1;
  min-width: 0;
}

.method-label {
  font-weight: 600;
  color: #111827;
  font-size: 14px;
}

.method-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.verification-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.field-input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-input.has-error {
  border-color: #ef4444;
}

.field-input.code-input {
  letter-spacing: 4px;
  font-size: 18px;
  text-align: center;
  font-weight: 600;
}

.code-field-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 4px;
}

.code-input-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.masked-contact {
  padding: 10px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  font-family: monospace;
}

.send-code-btn {
  padding: 10px 16px;
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.send-code-btn:hover:not(:disabled) {
  background: #2563eb;
}

.send-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #9ca3af;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 10px 14px;
  border-radius: 6px;
  color: #dc2626;
  font-size: 13px;
}

.attempts-hint {
  font-size: 13px;
  color: #f59e0b;
}

.locked-hint {
  background: #fef3c7;
  border: 1px solid #fde68a;
  padding: 10px 14px;
  border-radius: 6px;
  color: #92400e;
  font-size: 13px;
}

.btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
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
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-danger {
  background: #dc2626;
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.verify-btn {
  width: 100%;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.summary-box {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #6b7280;
}

.summary-value {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.submit-btn {
  width: 100%;
  margin-top: 16px;
  padding: 14px 24px;
  font-size: 15px;
}

.countdown-display {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 12px;
  margin-bottom: 24px;
}

.countdown-label {
  font-size: 14px;
  color: #2563eb;
  margin-bottom: 12px;
  font-weight: 500;
}

.countdown-values {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.countdown-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #ffffff;
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 60px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.countdown-num {
  font-size: 28px;
  font-weight: 700;
  color: #1e40af;
  line-height: 1;
}

.countdown-unit {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.countdown-sep {
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}

.progress-container {
  margin-bottom: 32px;
}

.progress-bar-wrap {
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #ef4444);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
}

.milestones {
  position: relative;
  padding-left: 8px;
}

.milestone-item {
  position: relative;
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
  padding-bottom: 28px;
}

.milestone-item:last-child {
  padding-bottom: 0;
}

.milestone-dot {
  position: relative;
  width: 16px;
  height: 16px;
  background: #e5e7eb;
  border-radius: 50%;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.milestone-item.active .milestone-dot {
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
}

.dot-inner {
  width: 6px;
  height: 6px;
  background: #ffffff;
  border-radius: 50%;
}

.milestone-line {
  position: absolute;
  left: 15px;
  top: 20px;
  width: 2px;
  height: calc(100% - 8px);
  background: #e5e7eb;
}

.milestone-item.active .milestone-line {
  background: #10b981;
}

.milestone-content {
  padding-top: 0;
}

.milestone-label {
  font-weight: 600;
  color: #111827;
  font-size: 14px;
}

.milestone-item:not(.active) .milestone-label {
  color: #9ca3af;
}

.milestone-date {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.milestone-desc {
  font-size: 13px;
  color: #4b5563;
  margin-top: 4px;
  line-height: 1.5;
}

.milestone-item:not(.active) .milestone-desc {
  color: #9ca3af;
}

.clear-scope-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.scope-tab {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.scope-tab:hover {
  border-color: #3b82f6;
}

.scope-tab.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.scope-note {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
  line-height: 1.6;
}

.scope-note-immediate {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.scope-note-cooling_period_end {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.scope-note-retained {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.empty-scope {
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.scope-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scope-category {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
}

.scope-cat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f3f4f6;
}

.scope-cat-icon {
  font-size: 18px;
}

.scope-cat-title {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
}

.scope-items {
  margin: 0;
  padding: 12px 16px 12px 36px;
  list-style-type: disc;
}

.scope-items li {
  font-size: 13px;
  color: #4b5563;
  padding: 4px 0;
}

.revoke-intro {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.revoke-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.revoke-info {
  font-size: 14px;
  color: #7f1d1d;
  line-height: 1.6;
}

.revoke-actions {
  display: flex;
  justify-content: center;
}

.revoke-confirm-panel {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.confirm-header {
  font-weight: 600;
  font-size: 15px;
  color: #111827;
  margin-bottom: 14px;
}

.reason-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.reason-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  padding-left: 40px;
}

.reason-option:hover {
  border-color: #3b82f6;
}

.reason-option.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.reason-option input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  left: 12px;
  top: 14px;
  height: 16px;
  width: 16px;
  z-index: 1;
}

.radio-custom {
  position: absolute;
  left: 12px;
  top: 14px;
  height: 16px;
  width: 16px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  background: #ffffff;
}

.reason-option.selected .radio-custom {
  border-color: #3b82f6;
}

.radio-custom::after {
  content: '';
  position: absolute;
  display: none;
  left: 3px;
  top: 3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3b82f6;
}

.reason-option.selected .radio-custom::after {
  display: block;
}

.reason-label {
  font-size: 14px;
  color: #374151;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.confirm-actions .btn {
  flex: 1;
}

.success-display {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.success-title {
  font-size: 22px;
  font-weight: 700;
  color: #059669;
  margin: 0 0 8px 0;
}

.success-desc {
  font-size: 14px;
  color: #4b5563;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.revoke-timeline,
.complete-timeline {
  text-align: left;
  max-width: 420px;
  margin: 0 auto 28px auto;
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #bbf7d0;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 14px;
  position: relative;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.timeline-dot.submitted {
  background: #f59e0b;
}

.timeline-dot.revoked {
  background: #3b82f6;
}

.timeline-dot.completed {
  background: #10b981;
}

.timeline-dot.reason {
  background: #8b5cf6;
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.timeline-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 2px;
}

.timeline-value {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}

.reapply-btn {
  min-width: 200px;
}

.contact-support {
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
}

.contact-support a {
  color: #3b82f6;
  text-decoration: none;
}

.contact-support a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .card {
    padding: 16px;
  }

  .risk-grid {
    grid-template-columns: 1fr;
  }

  .method-tabs {
    grid-template-columns: 1fr;
  }

  .summary-box {
    grid-template-columns: 1fr;
  }

  .countdown-values {
    gap: 4px;
  }

  .countdown-block {
    padding: 8px 10px;
    min-width: 48px;
  }

  .countdown-num {
    font-size: 20px;
  }

  .countdown-unit {
    font-size: 10px;
  }

  .countdown-sep {
    font-size: 18px;
  }

  .code-field-row {
    flex-direction: column;
    align-items: stretch;
  }

  .send-code-btn {
    width: 100%;
  }
}

@media (max-width: 375px) {
  .container {
    padding: 0 12px;
  }

  .page-header {
    margin-bottom: 20px;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .status-card {
    padding: 16px;
    flex-direction: column;
    text-align: center;
  }

  .status-icon {
    font-size: 32px;
  }

  .card {
    padding: 14px;
    border-radius: 10px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .card-header h2 {
    font-size: 16px;
  }

  .risk-banner {
    padding: 12px;
    gap: 10px;
  }

  .risk-content {
    font-size: 13px;
  }

  .impact-tabs {
    gap: 6px;
  }

  .impact-tab {
    padding: 6px 10px;
    font-size: 12px;
  }

  .category-header {
    flex-wrap: wrap;
    padding: 12px;
  }

  .item-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 10px 0;
  }

  .item-name {
    min-width: 0;
  }

  .countdown-display {
    padding: 16px 12px;
  }

  .countdown-block {
    padding: 6px 8px;
    min-width: 40px;
  }

  .countdown-num {
    font-size: 18px;
  }

  .countdown-sep {
    font-size: 16px;
  }

  .milestones {
    padding-left: 0;
  }

  .milestone-item {
    grid-template-columns: 30px 1fr;
    gap: 10px;
    padding-bottom: 20px;
  }

  .milestone-line {
    left: 10px;
  }

  .reason-option {
    padding: 10px 12px;
    padding-left: 36px;
  }

  .reason-option input {
    left: 10px;
  }

  .radio-custom {
    left: 10px;
  }

  .revoke-timeline,
  .complete-timeline {
    padding: 16px;
  }

  .confirm-actions {
    flex-direction: column;
  }
}
</style>