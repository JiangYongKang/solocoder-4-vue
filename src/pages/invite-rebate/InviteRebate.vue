<template>
  <div class="invite-rebate">
    <div class="container">
      <header class="page-header">
        <h1>邀请返利</h1>
        <p class="subtitle">邀请好友加入，享受双重好礼，奖励源源不断</p>
      </header>

      <div v-if="freezeSummary.totalCount > 0" class="freeze-alert-banner">
        <span class="alert-icon">⚠️</span>
        <span class="alert-text">
          您有 {{ freezeSummary.totalCount }} 笔奖励被冻结（{{ formatCurrency(freezeSummary.totalAmount) }}），
          <button class="link-btn" @click="scrollToFreezeRecords">查看详情</button>
        </span>
      </div>

      <div class="content-grid">
        <div class="main-content">
          <section class="section-card invite-card-section">
            <div class="section-header">
              <h2>我的邀请码</h2>
              <div class="invite-stats-mini">
                <span>已邀请 <strong>{{ inviteRecords.length }}</strong> 人</span>
              </div>
            </div>

            <div class="invite-code-display">
              <div class="invite-code-main">
                <div class="code-label">邀请码</div>
                <div class="code-value">{{ formattedInviteCode }}</div>
              </div>
              <div class="invite-code-qr">
                <div class="qr-container">
                  <img
                    :src="qrCodeUrl"
                    alt="邀请二维码"
                    class="qr-image"
                    @error="handleQrError"
                  />
                  <div v-if="qrLoadFailed" class="qr-fallback">
                    <span class="qr-icon">📱</span>
                    <span class="qr-text">扫码加入</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="invite-link-row">
              <div class="invite-link-input">
                <span class="link-icon">🔗</span>
                <span class="link-text">{{ inviteLink }}</span>
              </div>
              <button class="copy-link-btn" @click="copyInviteLink" :class="{ copied: linkCopied }">
                {{ linkCopied ? '✓ 已复制' : '复制链接' }}
              </button>
            </div>

            <div class="share-channels">
              <div class="share-label">分享到</div>
              <div class="share-buttons">
                <button
                  v-for="channel in shareChannelsList"
                  :key="channel.id"
                  class="share-btn"
                  :class="{ active: lastSharedChannel === channel.id }"
                  @click="shareTo(channel.id)"
                  :title="channel.label"
                >
                  <span class="share-icon">{{ channel.icon }}</span>
                  <span class="share-text">{{ channel.label }}</span>
                </button>
              </div>
            </div>
          </section>

          <section class="section-card">
            <div class="section-header">
              <h2>邀请记录</h2>
              <div class="record-stats">
                <span class="stat-tag converted">
                  已转化 {{ recordsStats.convertedCount }}
                </span>
                <span class="stat-tag pending">
                  进行中 {{ recordsStats.pendingCount }}
                </span>
              </div>
            </div>

            <div class="record-tabs">
              <button
                v-for="tab in recordTabs"
                :key="tab.value"
                class="tab-btn"
                :class="{ active: activeRecordTab === tab.value }"
                @click="activeRecordTab = tab.value"
              >
                {{ tab.label }}
                <span v-if="getRecordCountByTab(tab.value) > 0" class="tab-badge">
                  {{ getRecordCountByTab(tab.value) }}
                </span>
              </button>
            </div>

            <div class="invite-records-list">
              <div v-if="filteredRecords.length === 0" class="empty-state">
                <span class="empty-icon">📭</span>
                <span class="empty-text">暂无邀请记录</span>
              </div>
              <div
                v-for="record in filteredRecords"
                :key="record.id"
                class="invite-record-item"
              >
                <div class="invitee-avatar">
                  {{ getAvatarInitial(record.inviteeName) }}
                </div>
                <div class="invitee-info">
                  <div class="invitee-header">
                    <span class="invitee-name">{{ record.inviteeName }}</span>
                    <span
                      class="status-tag"
                      :style="{
                        backgroundColor: getInviteStatusColor(record.status) + '20',
                        color: getInviteStatusColor(record.status)
                      }"
                    >
                      {{ getInviteStatusIcon(record.status) }} {{ getInviteStatusLabel(record.status) }}
                    </span>
                  </div>
                  <div class="invitee-meta">
                    <span class="invite-time">📅 {{ formatInviteTime(record.invitedAt) }}</span>
                    <span v-if="record.phone" class="invite-phone">📞 {{ maskPhone(record.phone) }}</span>
                  </div>
                  <div class="reward-row">
                    <span class="reward-amount">
                      奖励：<strong>{{ formatCurrency(calculateSingleInviteReward(record)) }}</strong>
                    </span>
                    <span
                      class="settlement-tag"
                      :style="{
                        backgroundColor: getSettlementStatusColor(record.settlementStatus) + '20',
                        color: getSettlementStatusColor(record.settlementStatus)
                      }"
                    >
                      {{ getSettlementStatusIcon(record.settlementStatus) }} {{ getSettlementStatusLabel(record.settlementStatus) }}
                    </span>
                  </div>
                  <div v-if="record.settlementStatus === 'pending' && record.conversionDate" class="freeze-info">
                    <span class="freeze-info-text">
                      🔒 还需 {{ calculateFreezeDaysRemaining(record.conversionDate) }} 天解冻
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="section-card freeze-section">
            <div class="section-header">
              <h2>异常冻结记录</h2>
              <div class="freeze-summary-info">
                <span class="freeze-count">共 {{ freezeSummary.totalCount }} 笔</span>
                <span class="freeze-amount">{{ formatCurrency(freezeSummary.totalAmount) }}</span>
              </div>
            </div>

            <div v-if="frozenRecords.length === 0" class="empty-state">
              <span class="empty-icon">✅</span>
              <span class="empty-text">暂无异常冻结记录，继续保持！</span>
            </div>

            <div v-else class="freeze-records-list">
              <div
                v-for="record in frozenRecords"
                :key="record.id"
                class="freeze-record-item"
              >
                <div class="freeze-header">
                  <div class="freeze-info-main">
                    <span class="freeze-amount-tag">
                      -{{ formatCurrency(record.rewardAmount || calculateSingleInviteReward(record)) }}
                    </span>
                    <span
                      class="severity-tag"
                      :style="{
                        backgroundColor: getFreezeSeverityColor(record.freezeReason) + '20',
                        color: getFreezeSeverityColor(record.freezeReason)
                      }"
                    >
                      {{ getFreezeSeverityLabel(record.freezeReason) }}
                    </span>
                  </div>
                  <span class="freeze-time">
                    {{ formatFreezeTime(record.frozenAt || record.updatedAt) }}
                  </span>
                </div>

                <div class="freeze-reason-title">
                  <span class="reason-label">冻结原因：</span>
                  <strong>{{ getFreezeReasonLabel(record.freezeReason) }}</strong>
                  <span class="invitee-name-inline">（{{ record.inviteeName }}）</span>
                </div>

                <div class="freeze-description">
                  📌 {{ getFreezeReasonDescription(record.freezeReason) }}
                </div>

                <div class="freeze-suggestion">
                  💡 {{ getFreezeReasonSuggestion(record.freezeReason) }}
                </div>

                <div v-if="getAppealInstructions(record.freezeReason)" class="appeal-steps">
                  <div class="appeal-title">📋 申诉步骤：</div>
                  <ol class="appeal-list">
                    <li v-for="(step, idx) in getAppealInstructions(record.freezeReason)" :key="idx">
                      {{ step }}
                    </li>
                  </ol>
                </div>

                <div class="freeze-actions">
                  <button v-if="canAppealFreeze(record.freezeReason)" class="appeal-btn">
                    📞 联系客服申诉
                  </button>
                  <button class="rule-btn" @click="activeTab = 'rules'">
                    📖 查看规则
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="sidebar">
          <section class="section-card withdraw-card-section">
            <div class="section-header">
              <h2>奖励概览</h2>
            </div>

            <div class="amount-cards-grid">
              <div class="amount-card available">
                <div class="amount-label">可提现金额</div>
                <div class="amount-value">{{ formatCurrency(totalRewards.settledRewards) }}</div>
                <div class="amount-hint">实时到账</div>
              </div>
              <div class="amount-card pending">
                <div class="amount-label">待到账金额</div>
                <div class="amount-value">{{ formatCurrency(totalRewards.pendingRewards) }}</div>
                <div class="amount-hint">{{ SETTLEMENT_RULES.FREEZE_DAYS }}天冻结期</div>
              </div>
              <div class="amount-card frozen">
                <div class="amount-label">冻结金额</div>
                <div class="amount-value">{{ formatCurrency(totalRewards.frozenRewards) }}</div>
                <div class="amount-hint">需处理异常</div>
              </div>
            </div>

            <div class="total-rewards-row">
              <span class="total-label">累计获得奖励</span>
              <span class="total-value">{{ formatCurrency(totalRewards.totalRewards) }}</span>
            </div>

            <div class="tier-progress-section">
              <div class="tier-info-header">
                <span class="tier-title">🎯 阶梯奖励进度</span>
                <span class="tier-current">
                  已转化 {{ totalRewards.convertedCount }} 人
                </span>
              </div>
              <div class="tier-progress-bar-container">
                <div
                  class="tier-progress-bar"
                  :style="{ width: nextTierInfo.progress + '%' }"
                ></div>
              </div>
              <div v-if="!nextTierInfo.reached" class="tier-next-info">
                再邀请 <strong>{{ nextTierInfo.invitesNeeded }}</strong> 人，
                额外获得 <strong>{{ formatCurrency(nextTierInfo.nextBonus) }}</strong> 奖励
              </div>
              <div v-else class="tier-max-info">
                🎉 已达成最高阶梯奖励！
              </div>
            </div>

            <div class="withdraw-section">
              <button
                class="withdraw-btn"
                :class="{ disabled: !withdrawalCheck.available }"
                :disabled="!withdrawalCheck.available"
                @click="handleWithdraw"
              >
                {{ withdrawalCheck.available ? '💰 立即提现' : getWithdrawalStatusLabel(withdrawalCheck.status) }}
              </button>
              <div v-if="!withdrawalCheck.available" class="withdraw-disabled-reason">
                {{ withdrawalCheck.suggestion }}
              </div>
            </div>

            <div class="withdraw-rules-mini">
              <div class="rule-item-mini">
                <span class="rule-dot">•</span>
                最低提现：{{ formatCurrency(SETTLEMENT_RULES.MIN_WITHDRAWAL_AMOUNT) }}
              </div>
              <div class="rule-item-mini">
                <span class="rule-dot">•</span>
                手续费：0.6%（最低¥1）
              </div>
              <div class="rule-item-mini">
                <span class="rule-dot">•</span>
                到账时间：实时~3工作日
              </div>
            </div>
          </section>

          <section class="section-card rules-section">
            <div class="section-header">
              <h2>奖励规则</h2>
            </div>

            <div class="rules-list">
              <div class="rule-item">
                <div class="rule-icon">🎁</div>
                <div class="rule-content">
                  <div class="rule-title">新人注册奖</div>
                  <div class="rule-desc">
                    被邀请人完成注册，邀请人立得 {{ formatCurrency(REWARD_RULES.NEW_USER_BONUS) }}
                  </div>
                </div>
              </div>

              <div class="rule-item">
                <div class="rule-icon">🛒</div>
                <div class="rule-content">
                  <div class="rule-title">首单消费奖</div>
                  <div class="rule-desc">
                    被邀请人首单消费，邀请人获得 {{ (REWARD_RULES.FIRST_PURCHASE_PERCENT * 100).toFixed(0) }}% 返利，
                    最高 {{ formatCurrency(REWARD_RULES.FIRST_PURCHASE_MAX) }}
                  </div>
                </div>
              </div>

              <div class="rule-item">
                <div class="rule-icon">🔄</div>
                <div class="rule-content">
                  <div class="rule-title">持续消费奖</div>
                  <div class="rule-desc">
                    后续 {{ REWARD_RULES.RECURRING_MONTHS }} 个月内每月消费，
                    邀请人获得 {{ (REWARD_RULES.RECURRING_PERCENT * 100).toFixed(0) }}% 返利，
                    月最高 {{ formatCurrency(REWARD_RULES.RECURRING_MAX) }}
                  </div>
                </div>
              </div>

              <div class="rule-item">
                <div class="rule-icon">🏆</div>
                <div class="rule-content">
                  <div class="rule-title">阶梯额外奖</div>
                  <div class="rule-desc">
                    <div v-for="tier in REWARD_RULES.TIER_BONUS" :key="tier.invites" class="tier-row">
                      邀请满 <strong>{{ tier.invites }}</strong> 人，
                      额外 <strong>{{ formatCurrency(tier.bonus) }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rule-item">
                <div class="rule-icon">⏰</div>
                <div class="rule-content">
                  <div class="rule-title">结算周期</div>
                  <div class="rule-desc">
                    奖励转化后进入 {{ SETTLEMENT_RULES.FREEZE_DAYS }} 天冻结观察期，
                    每月{{ SETTLEMENT_RULES.SETTLEMENT_DAY }}日统一结算上月奖励
                  </div>
                </div>
              </div>

              <div class="rule-item">
                <div class="rule-icon">🔒</div>
                <div class="rule-content">
                  <div class="rule-title">冻结规则</div>
                  <div class="rule-desc">
                    出现退款、违规、异常账号等情况，对应奖励将被冻结或扣除。
                    具体冻结原因见异常记录说明。
                  </div>
                </div>
              </div>

              <div class="rule-item">
                <div class="rule-icon">💸</div>
                <div class="rule-content">
                  <div class="rule-title">提现限制</div>
                  <div class="rule-desc">
                    单笔最低 {{ formatCurrency(SETTLEMENT_RULES.MIN_WITHDRAWAL_AMOUNT) }}，
                    最高 {{ formatCurrency(SETTLEMENT_RULES.MAX_WITHDRAWAL_AMOUNT) }}，
                    两次提现间隔需满 {{ SETTLEMENT_RULES.WITHDRAWAL_COOLDOWN_HOURS }} 小时
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div v-if="showToast" class="toast" :class="toastType">
        <span class="toast-icon">{{ toastType === 'success' ? '✅' : toastType === 'error' ? '❌' : 'ℹ️' }}</span>
        <span class="toast-message">{{ toastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  INVITE_STATUS,
  INVITE_STATUS_LABELS,
  INVITE_STATUS_ICONS,
  INVITE_STATUS_COLORS,
  SETTLEMENT_STATUS,
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_ICONS,
  SETTLEMENT_STATUS_COLORS,
  SETTLEMENT_RULES,
  REWARD_RULES,
  SHARE_CHANNELS,
  SHARE_CHANNEL_LABELS,
  SHARE_CHANNEL_ICONS
} from './constants.js'
import {
  generateInviteCode,
  validateInviteCode,
  generateInviteLink,
  formatInviteCode
} from './inviteCode.js'
import {
  calculateNewUserBonus,
  calculateFirstPurchaseReward,
  calculateRecurringPurchaseReward,
  calculateTierBonus,
  calculateNextTierBonus,
  calculateSingleInviteReward,
  calculateTotalRewards,
  calculateFreezeReleaseDate,
  calculateFreezeDaysRemaining,
  formatCurrency
} from './rewardCalculator.js'
import {
  getSettlementStatusLabel,
  getSettlementStatusIcon,
  getSettlementStatusColor,
  determineSettlementStatus
} from './settlementStatus.js'
import {
  getFreezeReasonLabel,
  getFreezeReasonDescription,
  getFreezeReasonSuggestion,
  getFreezeSeverity,
  getSeverityLabel,
  getSeverityColor,
  canAppeal,
  getAppealInstructions,
  calculateFreezeSummary
} from './freezeReason.js'
import {
  getWithdrawalStatusLabel,
  checkWithdrawalAvailability,
  calculateWithdrawalFee,
  calculateActualReceive
} from './withdrawalAvailability.js'

const rawInviteCode = ref(generateInviteCode(8))
const activeRecordTab = ref('all')
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const linkCopied = ref(false)
const lastSharedChannel = ref(null)
const activeTab = ref('records')
const qrLoadFailed = ref(false)

const isIdentityVerified = ref(true)
const isAccountRestricted = ref(false)
const lastWithdrawalAt = ref(null)

const inviteRecords = ref([
  {
    id: 1,
    inviteeName: '张小明',
    phone: '13800138001',
    status: INVITE_STATUS.CONVERTED,
    invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    conversionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    firstPurchaseAmount: 299,
    recurringPurchases: [
      { amount: 150, month: 1 },
      { amount: 200, month: 2 }
    ],
    rewardStatus: 'settled',
    settlementStatus: SETTLEMENT_STATUS.SETTLED
  },
  {
    id: 2,
    inviteeName: '李小红',
    phone: '13900139002',
    status: INVITE_STATUS.CONVERTED,
    invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    conversionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    firstPurchaseAmount: 599,
    recurringPurchases: [
      { amount: 300, month: 1 }
    ],
    rewardStatus: 'pending',
    settlementStatus: SETTLEMENT_STATUS.PENDING
  },
  {
    id: 3,
    inviteeName: '王大伟',
    phone: '13700137003',
    status: INVITE_STATUS.CONVERTED,
    invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    conversionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
    firstPurchaseAmount: 899,
    recurringPurchases: [],
    rewardStatus: 'frozen',
    settlementStatus: SETTLEMENT_STATUS.FROZEN,
    freezeReason: 'refunded_order',
    frozenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    rewardAmount: 99.9
  },
  {
    id: 4,
    inviteeName: '赵美丽',
    phone: '13600136004',
    status: INVITE_STATUS.ACTIVE,
    invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    firstPurchaseAmount: 0,
    rewardStatus: null,
    settlementStatus: SETTLEMENT_STATUS.PENDING
  },
  {
    id: 5,
    inviteeName: '孙小强',
    phone: '13500135005',
    status: INVITE_STATUS.REGISTERED,
    invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    rewardStatus: null,
    settlementStatus: SETTLEMENT_STATUS.PENDING
  },
  {
    id: 6,
    inviteeName: '周建国',
    phone: '13400134006',
    status: INVITE_STATUS.CONVERTED,
    invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    conversionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
    firstPurchaseAmount: 1299,
    recurringPurchases: [
      { amount: 450, month: 1 },
      { amount: 380, month: 2 },
      { amount: 520, month: 3 }
    ],
    rewardStatus: 'settled',
    settlementStatus: SETTLEMENT_STATUS.SETTLED
  },
  {
    id: 7,
    inviteeName: '吴芳芳',
    phone: '13300133007',
    status: INVITE_STATUS.CONVERTED,
    invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    conversionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    firstPurchaseAmount: 199,
    recurringPurchases: [],
    rewardStatus: 'frozen',
    settlementStatus: SETTLEMENT_STATUS.FROZEN,
    freezeReason: 'suspicious_activity',
    frozenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    rewardAmount: 29.9
  },
  {
    id: 8,
    inviteeName: '郑小龙',
    phone: '13200132008',
    status: INVITE_STATUS.PENDING,
    invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString()
  }
])

const recordTabs = [
  { label: '全部', value: 'all' },
  { label: '已转化', value: 'converted' },
  { label: '进行中', value: 'active' },
  { label: '已冻结', value: 'frozen' }
]

const shareChannelsList = computed(() =>
  Object.values(SHARE_CHANNELS).map(id => ({
    id,
    label: SHARE_CHANNEL_LABELS[id],
    icon: SHARE_CHANNEL_ICONS[id]
  }))
)

const formattedInviteCode = computed(() => {
  const validation = validateInviteCode(rawInviteCode.value)
  if (validation.valid) {
    return formatInviteCode(validation.normalizedCode, '-', 4)
  }
  return rawInviteCode.value
})

const inviteLink = computed(() => {
  return generateInviteLink(rawInviteCode.value, 'https://example.com/invite', {
    utm_source: 'invite',
    utm_medium: 'share'
  }) || ''
})

const qrCodeUrl = computed(() => {
  const encodedLink = encodeURIComponent(inviteLink.value)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodedLink}`
})

const shareText = computed(() => {
  return `快来加入我们！使用我的邀请码 ${rawInviteCode.value}，注册即得好礼，邀请好友还能赚返利~`
})

const totalRewards = computed(() => calculateTotalRewards(inviteRecords.value))

const nextTierInfo = computed(() => calculateNextTierBonus(totalRewards.value.convertedCount))

const filteredRecords = computed(() => {
  const sorted = [...inviteRecords.value].sort(
    (a, b) => new Date(b.invitedAt) - new Date(a.invitedAt)
  )

  if (activeRecordTab.value === 'all') return sorted
  if (activeRecordTab.value === 'converted') {
    return sorted.filter(r => r.status === INVITE_STATUS.CONVERTED)
  }
  if (activeRecordTab.value === 'active') {
    return sorted.filter(
      r => r.status === INVITE_STATUS.PENDING ||
           r.status === INVITE_STATUS.REGISTERED ||
           r.status === INVITE_STATUS.ACTIVE
    )
  }
  if (activeRecordTab.value === 'frozen') {
    return sorted.filter(r => r.settlementStatus === SETTLEMENT_STATUS.FROZEN)
  }
  return sorted
})

const frozenRecords = computed(() =>
  inviteRecords.value.filter(r => r.settlementStatus === SETTLEMENT_STATUS.FROZEN)
)

const freezeSummary = computed(() => calculateFreezeSummary(inviteRecords.value))

const recordsStats = computed(() => ({
  convertedCount: inviteRecords.value.filter(r => r.status === INVITE_STATUS.CONVERTED).length,
  pendingCount: inviteRecords.value.filter(
    r => r.status === INVITE_STATUS.PENDING ||
         r.status === INVITE_STATUS.REGISTERED ||
         r.status === INVITE_STATUS.ACTIVE
  ).length
}))

const withdrawalCheck = computed(() =>
  checkWithdrawalAvailability({
    availableBalance: totalRewards.value.settledRewards,
    isIdentityVerified: isIdentityVerified.value,
    isAccountRestricted: isAccountRestricted.value,
    lastWithdrawalAt: lastWithdrawalAt.value
  })
)

function getRecordCountByTab(tab) {
  if (tab === 'all') return inviteRecords.value.length
  if (tab === 'converted') return recordsStats.value.convertedCount
  if (tab === 'active') return recordsStats.value.pendingCount
  if (tab === 'frozen') return frozenRecords.value.length
  return 0
}

function getInviteStatusLabel(status) {
  return INVITE_STATUS_LABELS[status] || '未知'
}

function getInviteStatusIcon(status) {
  return INVITE_STATUS_ICONS[status] || '❓'
}

function getInviteStatusColor(status) {
  return INVITE_STATUS_COLORS[status] || '#6b7280'
}

function formatInviteTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function formatFreezeTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function maskPhone(phone) {
  if (!phone || phone.length < 11) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

function getAvatarInitial(name) {
  if (!name) return '?'
  return name.charAt(0)
}

function getFreezeSeverityLabel(reason) {
  return getSeverityLabel(getFreezeSeverity(reason))
}

function getFreezeSeverityColor(reason) {
  return getSeverityColor(getFreezeSeverity(reason))
}

function canAppealFreeze(reason) {
  return canAppeal(reason)
}

async function copyInviteLink() {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(inviteLink.value)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = inviteLink.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    linkCopied.value = true
    showToastMessage('邀请链接已复制到剪贴板', 'success')
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  } catch {
    showToastMessage('复制失败，请手动复制', 'error')
  }
}

function handleQrError() {
  qrLoadFailed.value = true
}

function shareTo(channelId) {
  lastSharedChannel.value = channelId
  const channelLabel = SHARE_CHANNEL_LABELS[channelId] || channelId

  if (channelId === SHARE_CHANNELS.COPY) {
    const validation = validateInviteCode(rawInviteCode.value)
    if (validation.valid) {
      const codeToCopy = validation.normalizedCode
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codeToCopy).then(() => {
          showToastMessage(`邀请码 ${codeToCopy} 已复制`, 'success')
        })
      } else {
        showToastMessage(`邀请码：${codeToCopy}`, 'info')
      }
    }
  } else if (channelId === SHARE_CHANNELS.LINK) {
    copyInviteLink()
  } else if (channelId === SHARE_CHANNELS.QRCODE) {
    showToastMessage('请使用微信扫描二维码，或长按图片保存后分享', 'info')
  } else if (channelId === SHARE_CHANNELS.WEIBO) {
    const shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(inviteLink.value)}&title=${encodeURIComponent(shareText.value)}&pic=&sudaref=`
    window.open(shareUrl, '_blank', 'width=700,height=580,scrollbars=yes')
    showToastMessage(`正在跳转${channelLabel}分享页面...`, 'info')
  } else if (channelId === SHARE_CHANNELS.QQ) {
    const shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(inviteLink.value)}&title=${encodeURIComponent(shareText.value)}&desc=${encodeURIComponent(shareText.value)}&pics=&summary=`
    window.open(shareUrl, '_blank', 'width=700,height=580,scrollbars=yes')
    showToastMessage(`正在跳转${channelLabel}分享页面...`, 'info')
  } else if (channelId === SHARE_CHANNELS.WECHAT) {
    if (navigator.share && /MicroMessenger/i.test(navigator.userAgent)) {
      navigator.share({
        title: '邀请返利 - 好友加入得好礼',
        text: shareText.value,
        url: inviteLink.value
      }).then(() => {
        showToastMessage('微信分享成功', 'success')
      }).catch(() => {
        showToastMessage('请保存二维码图片，在微信中发送给好友', 'info')
      })
    } else {
      showToastMessage('请保存二维码图片，在微信中扫描或发送给好友', 'info')
    }
  } else {
    if (navigator.share) {
      navigator.share({
        title: '邀请返利 - 好友加入得好礼',
        text: shareText.value,
        url: inviteLink.value
      }).then(() => {
        showToastMessage('分享成功', 'success')
      }).catch(() => {
        showToastMessage(`正在唤起${channelLabel}分享...`, 'info')
      })
    } else {
      showToastMessage(`正在唤起${channelLabel}分享...`, 'info')
    }
  }

  setTimeout(() => {
    lastSharedChannel.value = null
  }, 1500)
}

function handleWithdraw() {
  if (!withdrawalCheck.value.available) {
    showToastMessage(withdrawalCheck.value.suggestion, 'info')
    return
  }
  showToastMessage(
    `可提现 ${formatCurrency(totalRewards.value.settledRewards)}，扣除手续费 ${formatCurrency(calculateWithdrawalFee(totalRewards.value.settledRewards))} 后，实得 ${formatCurrency(calculateActualReceive(totalRewards.value.settledRewards))}`,
    'success'
  )
}

function showToastMessage(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

function scrollToFreezeRecords() {
  activeRecordTab.value = 'frozen'
  setTimeout(() => {
    const freezeSection = document.querySelector('.freeze-section')
    if (freezeSection) {
      freezeSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
}

onMounted(() => {
  if (totalRewards.value.settledRewards >= SETTLEMENT_RULES.MIN_WITHDRAWAL_AMOUNT) {
    setTimeout(() => {
      showToastMessage(
        `当前可提现 ${formatCurrency(totalRewards.value.settledRewards)}，快去提现吧！`,
        'info'
      )
    }, 1500)
  }
})
</script>

<style scoped>
.invite-rebate {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
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

.freeze-alert-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.alert-text {
  color: #991b1b;
  font-size: 14px;
}

.link-btn {
  background: none;
  border: none;
  color: #dc2626;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  font-weight: 600;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

.invite-stats-mini {
  font-size: 13px;
  color: #6b7280;
}

.invite-stats-mini strong {
  color: #3b82f6;
  font-weight: 700;
}

.invite-card-section {
  background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
  border: 1px solid #bfdbfe;
}

.invite-code-display {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.invite-code-main {
  flex: 1;
  min-width: 0;
}

.code-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.code-value {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 4px;
  color: #1d4ed8;
  font-family: 'Courier New', monospace;
  user-select: all;
}

.invite-code-qr {
  flex-shrink: 0;
}

.qr-container {
  width: 100px;
  height: 100px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.qr-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: #ffffff;
  border: 2px dashed #93c5fd;
  border-radius: 8px;
}

.qr-icon {
  font-size: 36px;
}

.qr-text {
  font-size: 11px;
  color: #6b7280;
}

.invite-link-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.invite-link-input {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.link-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.link-text {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-link-btn {
  padding: 10px 20px;
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.copy-link-btn:hover {
  background: #2563eb;
}

.copy-link-btn.copied {
  background: #10b981;
}

.share-channels {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.share-label {
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}

.share-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.share-btn.active {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.share-icon {
  font-size: 18px;
}

.record-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.stat-tag.converted {
  background: #dcfce7;
  color: #166534;
}

.stat-tag.pending {
  background: #fef3c7;
  color: #92400e;
}

.record-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
  overflow-x: auto;
}

.tab-btn {
  padding: 8px 16px;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.tab-btn:hover {
  background: #f3f4f6;
}

.tab-btn.active {
  background: #eff6ff;
  color: #3b82f6;
  font-weight: 500;
}

.tab-badge {
  background: #dbeafe;
  color: #2563eb;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 8px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #9ca3af;
}

.invite-records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invite-record-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s;
}

.invite-record-item:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.invitee-avatar {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}

.invitee-info {
  flex: 1;
  min-width: 0;
}

.invitee-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.invitee-name {
  font-weight: 600;
  color: #111827;
  font-size: 15px;
}

.status-tag {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.invitee-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.reward-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.reward-amount {
  font-size: 14px;
  color: #374151;
}

.reward-amount strong {
  color: #f59e0b;
  font-weight: 700;
}

.settlement-tag {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.freeze-info {
  margin-top: 6px;
}

.freeze-info-text {
  font-size: 12px;
  color: #f59e0b;
}

.freeze-section {
  background: #fefaf5;
  border: 1px solid #fed7aa;
}

.freeze-summary-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.freeze-count {
  color: #6b7280;
}

.freeze-amount {
  color: #dc2626;
  font-weight: 700;
}

.freeze-records-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.freeze-record-item {
  background: #ffffff;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 16px;
}

.freeze-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.freeze-info-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.freeze-amount-tag {
  padding: 4px 10px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 6px;
  font-weight: 700;
  font-size: 14px;
}

.severity-tag {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.freeze-time {
  font-size: 12px;
  color: #9ca3af;
}

.freeze-reason-title {
  font-size: 14px;
  color: #374151;
  margin-bottom: 8px;
}

.reason-label {
  color: #6b7280;
}

.invitee-name-inline {
  color: #9ca3af;
  font-weight: 400;
  font-size: 13px;
}

.freeze-description {
  font-size: 13px;
  color: #4b5563;
  padding: 10px 12px;
  background: #fef3c7;
  border-radius: 6px;
  margin-bottom: 8px;
  line-height: 1.5;
}

.freeze-suggestion {
  font-size: 13px;
  color: #065f46;
  padding: 10px 12px;
  background: #d1fae5;
  border-radius: 6px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.appeal-steps {
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  margin-bottom: 12px;
}

.appeal-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.appeal-list {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #4b5563;
  line-height: 1.8;
}

.freeze-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.appeal-btn,
.rule-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.appeal-btn {
  background: #ef4444;
  color: #ffffff;
}

.appeal-btn:hover {
  background: #dc2626;
}

.rule-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.rule-btn:hover {
  background: #e5e7eb;
}

.withdraw-card-section {
  background: linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%);
}

.amount-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.amount-card {
  padding: 14px 10px;
  border-radius: 10px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.amount-card.available {
  border-color: #86efac;
  background: #f0fdf4;
}

.amount-card.pending {
  border-color: #fde68a;
  background: #fefce8;
}

.amount-card.frozen {
  border-color: #fca5a5;
  background: #fef2f2;
}

.amount-label {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 6px;
}

.amount-value {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.amount-card.available .amount-value {
  color: #166534;
}

.amount-card.pending .amount-value {
  color: #92400e;
}

.amount-card.frozen .amount-value {
  color: #991b1b;
}

.amount-hint {
  font-size: 10px;
  color: #9ca3af;
}

.total-rewards-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px dashed #e5e7eb;
  border-bottom: 1px dashed #e5e7eb;
  margin-bottom: 16px;
}

.total-label {
  font-size: 13px;
  color: #6b7280;
}

.total-value {
  font-size: 20px;
  font-weight: 800;
  color: #8b5cf6;
}

.tier-progress-section {
  margin-bottom: 20px;
}

.tier-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 4px;
}

.tier-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.tier-current {
  font-size: 12px;
  color: #6b7280;
}

.tier-progress-bar-container {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.tier-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.tier-next-info,
.tier-max-info {
  font-size: 12px;
  color: #4b5563;
}

.tier-next-info strong {
  color: #3b82f6;
}

.tier-max-info {
  color: #f59e0b;
  font-weight: 600;
}

.withdraw-section {
  margin-bottom: 16px;
}

.withdraw-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.withdraw-btn:hover:not(.disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.withdraw-btn.disabled,
.withdraw-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  font-weight: 600;
  font-size: 14px;
}

.withdraw-disabled-reason {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  padding: 8px 10px;
  background: #f3f4f6;
  border-radius: 6px;
  line-height: 1.5;
}

.withdraw-rules-mini {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.rule-item-mini {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.8;
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.rule-dot {
  color: #9ca3af;
  flex-shrink: 0;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rule-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s;
}

.rule-item:hover {
  background: #f3f4f6;
}

.rule-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.rule-content {
  flex: 1;
  min-width: 0;
}

.rule-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.rule-desc {
  font-size: 12px;
  color: #4b5563;
  line-height: 1.6;
  word-break: break-word;
}

.tier-row {
  font-size: 12px;
  line-height: 1.8;
}

.tier-row strong {
  color: #8b5cf6;
}

.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideDown 0.3s ease;
  max-width: 90vw;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toast.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.toast.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.toast.info {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.toast-icon {
  font-size: 18px;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .invite-code-display {
    justify-content: center;
    text-align: center;
  }

  .invite-code-main {
    text-align: center;
  }
}

@media (max-width: 640px) {
  .container {
    padding: 0 16px;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .section-card {
    padding: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .invite-code-display {
    flex-direction: column;
    gap: 16px;
  }

  .code-value {
    font-size: 24px;
    letter-spacing: 3px;
  }

  .invite-link-row {
    flex-direction: column;
  }

  .copy-link-btn {
    width: 100%;
  }

  .share-channels {
    flex-direction: column;
    align-items: flex-start;
  }

  .amount-cards-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .record-tabs {
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none;
  }

  .record-tabs::-webkit-scrollbar {
    display: none;
  }

  .invite-record-item {
    flex-direction: column;
    gap: 12px;
  }

  .freeze-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .freeze-actions {
    flex-direction: column;
  }

  .appeal-btn,
  .rule-btn {
    width: 100%;
  }
}

@media (max-width: 375px) {
  .container {
    padding: 0 12px;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .subtitle {
    font-size: 12px;
  }

  .section-card {
    padding: 14px;
    border-radius: 10px;
  }

  .section-header h2 {
    font-size: 16px;
  }

  .code-value {
    font-size: 20px;
    letter-spacing: 2px;
  }

  .share-btn {
    padding: 6px 10px;
    font-size: 12px;
  }

  .share-text {
    display: none;
  }

  .share-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .share-btn {
    flex: 1;
    justify-content: center;
  }

  .invite-record-item {
    padding: 12px;
  }

  .invitee-name {
    font-size: 14px;
  }

  .reward-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .freeze-record-item {
    padding: 12px;
  }

  .freeze-description,
  .freeze-suggestion {
    font-size: 12px;
    padding: 8px 10px;
  }

  .amount-value {
    font-size: 16px;
  }

  .withdraw-btn {
    padding: 12px;
    font-size: 15px;
  }

  .rule-item {
    padding: 10px;
    gap: 10px;
  }

  .rule-icon {
    font-size: 24px;
  }

  .rule-title {
    font-size: 13px;
  }

  .rule-desc {
    font-size: 11px;
  }

  .record-stats,
  .invite-stats-mini {
    font-size: 12px;
  }

  .freeze-summary-info {
    font-size: 12px;
  }
}
</style>
