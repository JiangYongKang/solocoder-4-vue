<template>
  <div class="growth-level">
    <div class="container">
      <header class="page-header">
        <h1>我的成长等级</h1>
        <p class="subtitle">完成任务获取经验，解锁更多专属权益</p>
      </header>

      <div v-if="expiringBenefits.length > 0 || expiringTasks.length > 0" class="expiration-banner">
        <span class="expiration-icon">⏰</span>
        <div class="expiration-content">
          <div v-if="expiringTasks.length > 0" class="expiration-row">
            <span class="expiration-label task">任务提醒：</span>
            <span class="expiration-text">
              有 {{ expiringTasks.length }} 个任务即将过期（共 {{ expiringTasksTotalExp }} 经验），
              <button class="link-btn" @click="scrollToTasks">快去完成</button>
            </span>
          </div>
          <div v-if="expiringBenefits.length > 0" class="expiration-row">
            <span class="expiration-label benefit">权益提醒：</span>
            <span class="expiration-text">
              有 {{ expiringBenefits.length }} 个权益即将过期，
              <button class="link-btn" @click="scrollToBenefits">快去领取</button>
            </span>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="main-content">
          <div class="level-card" :style="{ borderColor: levelColor }">
            <div class="level-header">
              <div class="level-icon">{{ levelIcon }}</div>
              <div class="level-info">
                <div class="level-name">
                  <span class="level-badge" :style="{ backgroundColor: levelColor }">Lv.{{ levelInfo.level }}</span>
                  <span class="level-title">{{ levelName }}</span>
                </div>
                <div class="level-exp">
                  <span class="exp-current">{{ levelInfo.currentExp }}</span>
                  <span class="exp-separator">/</span>
                  <span class="exp-target">{{ levelInfo.isMaxLevel ? '已满级' : levelInfo.nextLevelExp }}</span>
                  <span class="exp-unit">经验</span>
                </div>
              </div>
              <div v-if="!levelInfo.isMaxLevel" class="level-next">
                <div class="next-label">下一等级</div>
                <div class="next-level">{{ nextLevelName }}</div>
                <div class="next-exp">还差 {{ levelInfo.expToNext }} 经验</div>
              </div>
              <div v-else class="level-max">
                <div class="max-icon">👑</div>
                <div class="max-text">已达最高等级</div>
              </div>
            </div>
            <div class="progress-section">
              <div class="progress-bar-container">
                <div
                  class="progress-bar"
                  :style="{
                    width: levelInfo.levelProgress + '%',
                    backgroundColor: levelColor
                  }"
                ></div>
              </div>
              <div class="progress-info">
                <span>当前进度 {{ levelInfo.levelProgress }}%</span>
                <span v-if="!levelInfo.isMaxLevel" class="upgrade-estimate">{{ upgradeEstimateText }}</span>
              </div>
            </div>
            <div v-if="upgradeTips.length > 0" class="tips-section">
              <div
                v-for="(tip, index) in upgradeTips"
                :key="index"
                class="tip-item"
                :class="tip.type"
              >
                <span class="tip-icon">{{ tip.type === 'success' ? '💪' : tip.type === 'warning' ? '💡' : 'ℹ️' }}</span>
                <span class="tip-text">{{ tip.message }}</span>
              </div>
            </div>
          </div>

          <div id="tasks-section" class="section-card">
            <div class="section-header">
              <h2>任务进度</h2>
              <div class="task-summary">
                <span class="summary-item">
                  已完成 {{ taskStats.completedCount }}/{{ taskStats.totalCount }}
                </span>
                <span class="summary-item exp">
                  可领 {{ taskStats.unclaimedExp }} 经验
                </span>
              </div>
            </div>
            <div class="task-tabs">
              <button
                v-for="tab in taskTabs"
                :key="tab.value"
                class="tab-btn"
                :class="{ active: activeTaskTab === tab.value }"
                @click="activeTaskTab = tab.value"
              >
                {{ tab.label }}
                <span v-if="getTaskCountByTab(tab.value) > 0" class="tab-badge">
                  {{ getTaskCountByTab(tab.value) }}
                </span>
              </button>
            </div>
            <div class="task-list">
              <div
                v-for="task in filteredTasks"
                :key="task.id"
                class="task-item"
                :class="getTaskStatus(task)"
              >
                <div class="task-icon">{{ getTaskTypeIcon(task.type) }}</div>
                <div class="task-content">
                  <div class="task-header">
                    <span class="task-title">{{ task.title }}</span>
                    <span class="task-type-tag">{{ getTaskTypeLabel(task.type) }}</span>
                  </div>
                  <div class="task-desc">{{ task.description }}</div>
                  <div class="task-progress-row">
                    <div class="task-progress-bar-container">
                      <div
                        class="task-progress-bar"
                        :style="{ width: getTaskProgressPercentage(task) + '%' }"
                      ></div>
                    </div>
                    <span class="task-progress-text">
                      {{ getTaskProgressText(task) }}
                    </span>
                  </div>
                  <div v-if="task.expiresAt" class="task-expiration" :class="{ expired: isTaskExpired(task) }">
                    {{ getTaskExpirationText(task) }}
                  </div>
                </div>
                <div class="task-reward">
                  <div class="reward-exp">+{{ task.rewardExp }}</div>
                  <button
                    class="task-action-btn"
                    :class="getTaskActionClass(task)"
                    :disabled="isTaskActionDisabled(task) || claimingTaskIds.has(task.id)"
                    @click="handleTaskAction(task)"
                  >
                    <span v-if="claimingTaskIds.has(task.id)" class="btn-spinner"></span>
                    {{ getTaskActionLabel(task) }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <div class="section-header">
              <h2>经验明细</h2>
              <div class="exp-summary">
                <span class="exp-gained">获得 +{{ expSummary.totalGained }}</span>
                <span class="exp-lost">扣除 -{{ expSummary.totalLost }}</span>
                <span class="exp-net">净收入 {{ expSummary.netExp > 0 ? '+' : '' }}{{ expSummary.netExp }}</span>
              </div>
            </div>
            <div class="exp-tabs">
              <button
                v-for="tab in expTabs"
                :key="tab.value"
                class="tab-btn"
                :class="{ active: activeExpTab === tab.value }"
                @click="activeExpTab = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>
            <div v-if="activeExpTab === 'grouped'" class="exp-grouped">
              <div
                v-for="group in groupedExpRecords"
                :key="group.source"
                class="exp-group-item"
              >
                <div class="exp-group-header">
                  <span class="exp-source-icon">{{ getExpSourceIcon(group.source) }}</span>
                  <span class="exp-source-name">{{ getExpSourceLabel(group.source) }}</span>
                  <span class="exp-group-count">{{ group.count }} 笔</span>
                  <span class="exp-group-total" :class="{ negative: group.totalExp < 0 }">
                    {{ group.totalExp > 0 ? '+' : '' }}{{ group.totalExp }}
                  </span>
                </div>
                <div class="exp-group-records">
                  <div
                    v-for="record in group.records"
                    :key="record.id"
                    class="exp-record-item"
                  >
                    <span class="record-desc">{{ record.description }}</span>
                    <span class="record-exp" :class="{ negative: record.exp < 0 }">
                      {{ record.exp > 0 ? '+' : '' }}{{ record.exp }}
                    </span>
                    <span class="record-time">{{ formatRecordTime(record.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="exp-list">
              <div
                v-for="record in sortedExpRecords"
                :key="record.id"
                class="exp-record-item"
              >
                <div class="record-icon">{{ getExpSourceIcon(record.source) }}</div>
                <div class="record-content">
                  <div class="record-source">{{ getExpSourceLabel(record.source) }}</div>
                  <div class="record-desc">{{ record.description }}</div>
                </div>
                <div class="record-exp-wrapper">
                  <span class="record-exp" :class="{ negative: record.exp < 0 }">
                    {{ record.exp > 0 ? '+' : '' }}{{ record.exp }}
                  </span>
                  <span class="record-time">{{ formatRecordTime(record.timestamp) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar">
          <div class="section-card">
            <div class="section-header">
              <h2>等级权益</h2>
              <div class="benefit-progress">
                已解锁 {{ benefitStats.unlocked }}/{{ benefitStats.total }}
              </div>
            </div>
            <div class="benefit-progress-bar-container">
              <div
                class="benefit-progress-bar"
                :style="{ width: benefitStats.unlockProgress + '%' }"
              ></div>
            </div>
            <div id="benefits-section" class="benefit-list">
              <div
                v-for="benefit in sortedBenefits"
                :key="benefit.id"
                class="benefit-item"
                :class="getBenefitStatus(benefit)"
              >
                <div class="benefit-icon">{{ getBenefitTypeIcon(benefit.type) }}</div>
                <div class="benefit-content">
                  <div class="benefit-header">
                    <span class="benefit-title">{{ benefit.title }}</span>
                    <span
                      class="benefit-status-tag"
                      :style="{ backgroundColor: getBenefitStatusColor(benefit) + '20', color: getBenefitStatusColor(benefit) }"
                    >
                      {{ getBenefitStatusLabel(benefit) }}
                    </span>
                  </div>
                  <div class="benefit-desc">{{ benefit.description }}</div>
                  <div class="benefit-meta">
                    <span v-if="benefit.requiredLevel > levelInfo.level" class="benefit-level">
                      🔒 Lv.{{ benefit.requiredLevel }} 解锁
                    </span>
                    <span v-else-if="benefit.expiresAt" class="benefit-expires" :class="{ expired: isBenefitExpired(benefit) }">
                      {{ getBenefitExpirationText(benefit) }}
                    </span>
                    <span v-if="benefit.cooldownHours && benefit.claimedAt" class="benefit-cooldown">
                      {{ getBenefitCooldownText(benefit) }}
                    </span>
                  </div>
                </div>
                <button
                  v-if="showBenefitAction(benefit)"
                  class="benefit-action-btn"
                  :class="getBenefitActionClass(benefit)"
                  :disabled="isBenefitActionDisabled(benefit)"
                  @click="handleClaimBenefit(benefit)"
                >
                  {{ getBenefitActionLabel(benefit) }}
                </button>
                <div v-else class="benefit-status-icon">
                  {{ getBenefitStatusIcon(benefit) }}
                </div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <div class="section-header">
              <h2>升级预估</h2>
            </div>
            <div class="upgrade-stats">
              <div class="stat-item">
                <div class="stat-value">{{ upgradeEstimate.dailyExpRate }}</div>
                <div class="stat-label">日均获得经验</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ displayDaysToUpgrade }}</div>
                <div class="stat-label">预计升级天数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ levelInfo.overallProgress }}%</div>
                <div class="stat-label">总进度</div>
              </div>
            </div>
            <div v-if="upgradeEstimate.estimatedDate.date" class="upgrade-date">
              <span class="date-icon">📅</span>
              预计 {{ formatEstimatedDate(upgradeEstimate.estimatedDate.date) }} 升级
            </div>
            <div v-if="upgradeEstimate.milestones.length > 0" class="upgrade-milestones">
              <div class="milestones-title">升级里程碑</div>
              <div
                v-for="milestone in upgradeEstimate.milestones.slice(0, 3)"
                :key="milestone.level"
                class="milestone-item"
              >
                <span class="milestone-level">Lv.{{ milestone.level }}</span>
                <span class="milestone-date">{{ formatEstimatedDate(milestone.estimatedDate) }}</span>
              </div>
            </div>
          </div>
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
  LEVEL_NAMES,
  LEVEL_COLORS,
  LEVEL_ICONS,
  EXP_SOURCE_LABELS,
  EXP_SOURCE_ICONS,
  BENEFIT_STATUS,
  BENEFIT_STATUS_LABELS,
  BENEFIT_TYPE_ICONS,
  TASK_STATUS,
  TASK_TYPE_LABELS,
  TASK_TYPES,
  DAILY_EXP_CAP
} from './constants.js'
import {
  calculateLevelInfo,
  groupExpRecordsBySource,
  calculateExpSummary,
  addExp
} from './levelCalculator.js'
import {
  calculateUpgradeEstimate,
  formatUpgradeEstimate,
  getExpEfficiencyTip
} from './upgradeEstimate.js'
import {
  getTaskProgress,
  getTaskStatus as getTaskStatusFn,
  canClaimTask,
  getTaskAction,
  checkTaskExpiration,
  formatTimeRemaining,
  sortTasksByPriority,
  filterTasksByStatus,
  calculateTaskRewards
} from './taskProgress.js'
import {
  getBenefitStatus as getBenefitStatusFn,
  canClaimBenefit,
  getBenefitStatusColor as getBenefitStatusColorByStatus,
  getBenefitStatusIcon as getBenefitStatusIconByStatus,
  sortBenefitsByPriority,
  checkExpiringBenefits,
  claimBenefit,
  calculateBenefitStats,
  formatCooldownRemaining
} from './benefitStatus.js'

const currentExp = ref(750)
const currentDailyExp = ref(150)
const lastClaimTimes = ref({})
const claimingTaskIds = ref(new Set())

const expRecords = ref([
  { id: 1, source: 'daily_login', exp: 10, description: '每日登录', timestamp: Date.now() - 1000 * 60 * 60 * 2 },
  { id: 2, source: 'task_complete', exp: 50, description: '完成新手任务-完善资料', timestamp: Date.now() - 1000 * 60 * 60 * 5 },
  { id: 3, source: 'task_complete', exp: 30, description: '完成每日任务-浏览资讯', timestamp: Date.now() - 1000 * 60 * 60 * 8 },
  { id: 4, source: 'content_contribute', exp: 100, description: '发布优质内容《Vue3进阶指南》', timestamp: Date.now() - 1000 * 60 * 60 * 24 },
  { id: 5, source: 'community_interact', exp: 20, description: '评论获得10个赞', timestamp: Date.now() - 1000 * 60 * 60 * 36 },
  { id: 6, source: 'task_complete', exp: 80, description: '完成每周任务-连续登录7天', timestamp: Date.now() - 1000 * 60 * 60 * 48 },
  { id: 7, source: 'achievement', exp: 200, description: '达成成就-首次发布内容', timestamp: Date.now() - 1000 * 60 * 60 * 72 },
  { id: 8, source: 'purchase', exp: 150, description: '消费订单 #ORD20240701001 满300元', timestamp: Date.now() - 1000 * 60 * 60 * 96 },
  {
    id: 9,
    source: 'penalty',
    exp: -50,
    description: '违反社区规范第3.2条-发布垃圾广告内容，违规ID：VIOL-20240701023',
    violationType: '垃圾广告',
    ruleReference: '社区规范第3.2条',
    timestamp: Date.now() - 1000 * 60 * 60 * 120
  },
  { id: 10, source: 'daily_login', exp: 10, description: '每日登录', timestamp: Date.now() - 1000 * 60 * 60 * 144 },
  { id: 11, source: 'task_complete', exp: 30, description: '完成每日任务-分享内容', timestamp: Date.now() - 1000 * 60 * 60 * 148 },
  {
    id: 12,
    source: 'correction',
    exp: 20,
    description: '经验计算错误修正-订单奖励漏发，更正单号：CORR-20240701008',
    correctionReason: '订单奖励系统漏发补回',
    ticketId: 'CORR-20240701008',
    timestamp: Date.now() - 1000 * 60 * 60 * 168
  }
])

const tasks = ref([
  {
    id: 1,
    type: TASK_TYPES.DAILY,
    title: '每日登录',
    description: '每天登录APP即可获得奖励',
    currentValue: 1,
    targetValue: 1,
    rewardExp: 10,
    claimedAt: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString()
  },
  {
    id: 2,
    type: TASK_TYPES.DAILY,
    title: '浏览资讯',
    description: '浏览5篇资讯文章',
    currentValue: 3,
    targetValue: 5,
    rewardExp: 30,
    claimedAt: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString()
  },
  {
    id: 3,
    type: TASK_TYPES.DAILY,
    title: '分享内容',
    description: '分享任意内容到社交平台',
    currentValue: 0,
    targetValue: 1,
    rewardExp: 20,
    claimedAt: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString()
  },
  {
    id: 4,
    type: TASK_TYPES.WEEKLY,
    title: '连续登录',
    description: '本周连续登录7天',
    currentValue: 4,
    targetValue: 7,
    rewardExp: 80,
    claimedAt: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString()
  },
  {
    id: 5,
    type: TASK_TYPES.WEEKLY,
    title: '发布内容',
    description: '本周发布3篇原创内容',
    currentValue: 1,
    targetValue: 3,
    rewardExp: 150,
    claimedAt: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString()
  },
  {
    id: 6,
    type: TASK_TYPES.ACHIEVEMENT,
    title: '社交达人',
    description: '累计获得100个赞',
    currentValue: 65,
    targetValue: 100,
    rewardExp: 200,
    claimedAt: null
  },
  {
    id: 7,
    type: TASK_TYPES.ACHIEVEMENT,
    title: '内容创作者',
    description: '累计发布10篇原创内容',
    currentValue: 3,
    targetValue: 10,
    rewardExp: 500,
    claimedAt: null
  },
  {
    id: 8,
    type: TASK_TYPES.SPECIAL,
    title: '限时挑战',
    description: '24小时内完成3个每日任务',
    currentValue: 2,
    targetValue: 3,
    rewardExp: 100,
    claimedAt: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 16).toISOString()
  }
])

const benefits = ref([
  {
    id: 1,
    type: 'discount',
    title: '95折专属折扣',
    description: '全场商品享受95折优惠',
    requiredLevel: 1,
    isOneTime: false,
    cooldownHours: 24,
    claimedAt: null,
    claimableFrom: null,
    expiresAt: null
  },
  {
    id: 2,
    type: 'free_shipping',
    title: '免邮券 x2',
    description: '每月可领取2张免邮券',
    requiredLevel: 2,
    isOneTime: false,
    cooldownHours: 720,
    claimedAt: null,
    claimableFrom: null,
    expiresAt: null
  },
  {
    id: 3,
    type: 'points_bonus',
    title: '积分1.2倍加成',
    description: '消费获得积分增加20%',
    requiredLevel: 3,
    isOneTime: false,
    cooldownHours: 168,
    claimedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    claimableFrom: null,
    expiresAt: null
  },
  {
    id: 4,
    type: 'exclusive_content',
    title: '专属教程',
    description: '解锁会员专属教程内容',
    requiredLevel: 4,
    isOneTime: true,
    cooldownHours: null,
    claimedAt: null,
    claimableFrom: null,
    expiresAt: null
  },
  {
    id: 5,
    type: 'priority_support',
    title: '优先客服',
    description: '客服排队优先处理',
    requiredLevel: 5,
    isOneTime: false,
    cooldownHours: 720,
    claimedAt: null,
    claimableFrom: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString()
  },
  {
    id: 6,
    type: 'early_access',
    title: '新功能优先体验',
    description: '抢先体验新功能',
    requiredLevel: 6,
    isOneTime: true,
    cooldownHours: null,
    claimedAt: null,
    claimableFrom: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    expiresAt: null
  },
  {
    id: 7,
    type: 'custom_badge',
    title: '专属徽章',
    description: '获得限定等级徽章',
    requiredLevel: 7,
    isOneTime: true,
    cooldownHours: null,
    claimedAt: null,
    claimableFrom: null,
    expiresAt: null
  },
  {
    id: 8,
    type: 'invite_code',
    title: '邀请码特权',
    description: '每月可生成3个专属邀请码',
    requiredLevel: 8,
    isOneTime: false,
    cooldownHours: 720,
    claimedAt: null,
    claimableFrom: null,
    expiresAt: null
  }
])

const activeTaskTab = ref('all')
const activeExpTab = ref('grouped')
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const taskTabs = [
  { label: '全部', value: 'all' },
  { label: '可领取', value: 'claimable' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' }
]

const expTabs = [
  { label: '按来源', value: 'grouped' },
  { label: '按时间', value: 'timeline' }
]

const levelInfo = computed(() => calculateLevelInfo(currentExp.value))
const levelName = computed(() => LEVEL_NAMES[levelInfo.value.level] || '')
const levelColor = computed(() => LEVEL_COLORS[levelInfo.value.level] || '#9ca3af')
const levelIcon = computed(() => LEVEL_ICONS[levelInfo.value.level] || '🌱')
const nextLevelName = computed(() => LEVEL_NAMES[levelInfo.value.level + 1] || '')

const upgradeEstimate = computed(() =>
  calculateUpgradeEstimate(currentExp.value, expRecords.value, DAILY_EXP_CAP)
)
const upgradeEstimateText = computed(() => formatUpgradeEstimate(upgradeEstimate.value))
const upgradeTips = computed(() =>
  getExpEfficiencyTip(currentExp.value, upgradeEstimate.value.dailyExpRate, DAILY_EXP_CAP)
)
const displayDaysToUpgrade = computed(() => {
  const { daysToUpgrade, isMaxLevel } = upgradeEstimate.value
  if (isMaxLevel) return '已满级'
  if (!daysToUpgrade.canEstimate) return '-'
  if (!isFinite(daysToUpgrade.days)) return '-'
  return daysToUpgrade.days
})

const taskStats = computed(() => calculateTaskRewards(tasks.value, true))
const sortedTasks = computed(() => sortTasksByPriority(tasks.value))
const filteredTasks = computed(() => {
  if (activeTaskTab.value === 'all') {
    return sortedTasks.value
  }
  if (activeTaskTab.value === 'claimable') {
    return sortedTasks.value.filter(task => canClaimTask(task, task.claimedAt))
  }
  if (activeTaskTab.value === 'in_progress') {
    return filterTasksByStatus(tasks.value, TASK_STATUS.IN_PROGRESS)
  }
  if (activeTaskTab.value === 'completed') {
    return filterTasksByStatus(tasks.value, TASK_STATUS.COMPLETED).concat(
      filterTasksByStatus(tasks.value, TASK_STATUS.CLAIMED)
    )
  }
  return sortedTasks.value
})

const expiringBenefits = computed(() =>
  checkExpiringBenefits(benefits.value, levelInfo.value.level, 24)
)
const expiringTasks = computed(() => {
  const now = new Date()
  const threshold = now.getTime() + 24 * 60 * 60 * 1000
  return tasks.value.filter(task => {
    if (!task.expiresAt) return false
    if (task.claimedAt) return false
    const expiresAt = new Date(task.expiresAt).getTime()
    return expiresAt > now.getTime() && expiresAt <= threshold
  }).sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt))
})
const expiringTasksTotalExp = computed(() => {
  return expiringTasks.value.reduce((sum, task) => sum + (task.rewardExp || 0), 0)
})
const benefitStats = computed(() =>
  calculateBenefitStats(benefits.value, levelInfo.value.level)
)
const sortedBenefits = computed(() =>
  sortBenefitsByPriority(benefits.value, levelInfo.value.level)
)

const groupedExpRecords = computed(() => groupExpRecordsBySource(expRecords.value))
const sortedExpRecords = computed(() =>
  [...expRecords.value].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
)
const expSummary = computed(() => calculateExpSummary(expRecords.value))

function getTaskCountByTab(tab) {
  if (tab === 'claimable') {
    return tasks.value.filter(task => canClaimTask(task, task.claimedAt)).length
  }
  if (tab === 'in_progress') {
    return filterTasksByStatus(tasks.value, TASK_STATUS.IN_PROGRESS).length
  }
  if (tab === 'completed') {
    return filterTasksByStatus(tasks.value, TASK_STATUS.COMPLETED).length +
           filterTasksByStatus(tasks.value, TASK_STATUS.CLAIMED).length
  }
  return tasks.value.length
}

function getTaskStatus(task) {
  return getTaskStatusFn(task, task.claimedAt)
}

function getTaskProgressPercentage(task) {
  return getTaskProgress(task).percentage
}

function getTaskProgressText(task) {
  const progress = getTaskProgress(task)
  return `${progress.progress}/${progress.target}`
}

function getTaskTypeLabel(type) {
  return TASK_TYPE_LABELS[type] || type
}

function getTaskTypeIcon(type) {
  const icons = {
    [TASK_TYPES.DAILY]: '📅',
    [TASK_TYPES.WEEKLY]: '📆',
    [TASK_TYPES.ACHIEVEMENT]: '🏆',
    [TASK_TYPES.SPECIAL]: '🎯'
  }
  return icons[type] || '📋'
}

function getTaskActionLabel(task) {
  return getTaskAction(task, task.claimedAt).label
}

function getTaskActionClass(task) {
  const action = getTaskAction(task, task.claimedAt)
  return {
    [action.action]: true,
    disabled: action.disabled
  }
}

function isTaskActionDisabled(task) {
  return getTaskAction(task, task.claimedAt).disabled
}

function isTaskExpired(task) {
  return checkTaskExpiration(task).isExpired
}

function getTaskExpirationText(task) {
  const { isExpired, timeRemaining } = checkTaskExpiration(task)
  if (isExpired) return '已过期'
  return `有效期：${formatTimeRemaining(timeRemaining)}`
}

async function handleTaskAction(task) {
  if (claimingTaskIds.value.has(task.id)) {
    return
  }

  const status = getTaskStatus(task)
  const { isExpired } = checkTaskExpiration(task)

  if (isExpired) {
    showToastMessage('任务已过期', 'error')
    return
  }

  if (status !== TASK_STATUS.COMPLETED) {
    showToastMessage(`任务进行中，继续加油！`, 'info')
    return
  }

  if (task.claimedAt) {
    showToastMessage('该任务奖励已领取', 'info')
    return
  }

  try {
    claimingTaskIds.value.add(task.id)

    await new Promise(resolve => setTimeout(resolve, 300))

    const freshTask = tasks.value.find(t => t.id === task.id)
    if (!freshTask) {
      showToastMessage('任务不存在', 'error')
      return
    }
    if (freshTask.claimedAt) {
      showToastMessage('该任务奖励已领取', 'info')
      return
    }

    const result = addExp(currentExp.value, freshTask.rewardExp, DAILY_EXP_CAP, currentDailyExp.value)
    currentExp.value = result.newExp
    currentDailyExp.value += result.addedExp
    freshTask.claimedAt = new Date().toISOString()

    expRecords.value.unshift({
      id: Date.now(),
      source: 'task_complete',
      exp: result.addedExp,
      description: `完成任务-${freshTask.title}`,
      timestamp: Date.now()
    })

    if (result.leveledUp) {
      showToastMessage(`恭喜升级到 Lv.${result.newLevel}！`, 'success')
    } else if (result.cappedExp > 0) {
      showToastMessage(`领取成功！获得 ${result.addedExp} 经验（${result.cappedExp} 经验因今日上限被截断）`, 'success')
    } else {
      showToastMessage(`领取成功！获得 ${result.addedExp} 经验`, 'success')
    }
  } finally {
    claimingTaskIds.value.delete(task.id)
  }
}

function getBenefitStatus(benefit) {
  return getBenefitStatusFn(benefit, levelInfo.value.level)
}

function getBenefitStatusLabel(benefit) {
  return BENEFIT_STATUS_LABELS[getBenefitStatus(benefit)] || ''
}

function getBenefitTypeIcon(type) {
  return BENEFIT_TYPE_ICONS[type] || '🎁'
}

function getBenefitStatusColor(benefit) {
  return getBenefitStatusColorByStatus(getBenefitStatus(benefit))
}

function getBenefitStatusIcon(benefit) {
  return getBenefitStatusIconByStatus(getBenefitStatus(benefit))
}

function isBenefitExpired(benefit) {
  return getBenefitStatus(benefit) === BENEFIT_STATUS.EXPIRED
}

function getBenefitExpirationText(benefit) {
  if (!benefit.expiresAt) return ''
  const now = new Date()
  const expiresAt = new Date(benefit.expiresAt)
  const diff = expiresAt - now
  if (diff <= 0) return '已过期'
  return `有效期至 ${expiresAt.toLocaleDateString('zh-CN')}`
}

function getBenefitCooldownText(benefit) {
  const lastClaim = lastClaimTimes.value[benefit.id] || benefit.claimedAt
  if (!lastClaim || !benefit.cooldownHours) return ''

  const cooldownMs = benefit.cooldownHours * 60 * 60 * 1000
  const timeSinceLastClaim = Date.now() - new Date(lastClaim).getTime()
  const remainingMs = cooldownMs - timeSinceLastClaim

  if (remainingMs <= 0) return ''
  return formatCooldownRemaining(remainingMs)
}

function showBenefitAction(benefit) {
  const status = getBenefitStatus(benefit)
  return status === BENEFIT_STATUS.CLAIMABLE || status === BENEFIT_STATUS.LOCKED
}

function getBenefitActionLabel(benefit) {
  const status = getBenefitStatus(benefit)
  if (status === BENEFIT_STATUS.CLAIMABLE) return '领取'
  if (status === BENEFIT_STATUS.LOCKED) return `Lv.${benefit.requiredLevel}解锁`
  return ''
}

function getBenefitActionClass(benefit) {
  const status = getBenefitStatus(benefit)
  return {
    claimable: status === BENEFIT_STATUS.CLAIMABLE,
    locked: status === BENEFIT_STATUS.LOCKED
  }
}

function isBenefitActionDisabled(benefit) {
  const status = getBenefitStatus(benefit)
  if (status === BENEFIT_STATUS.CLAIMABLE) {
    const { canClaim } = canClaimBenefit(
      benefit,
      levelInfo.value.level,
      lastClaimTimes.value[benefit.id]
    )
    return !canClaim
  }
  return status === BENEFIT_STATUS.LOCKED
}

function handleClaimBenefit(benefit) {
  const status = getBenefitStatus(benefit)

  if (status === BENEFIT_STATUS.LOCKED) {
    showToastMessage(`等级达到 Lv.${benefit.requiredLevel} 后解锁`, 'info')
    return
  }

  const result = claimBenefit(
    benefit,
    levelInfo.value.level,
    lastClaimTimes.value[benefit.id]
  )

  if (!result.success) {
    if (result.remainingCooldown) {
      showToastMessage(formatCooldownRemaining(result.remainingCooldown), 'info')
    } else {
      showToastMessage(result.reason, 'error')
    }
    return
  }

  const index = benefits.value.findIndex(b => b.id === benefit.id)
  if (index !== -1) {
    benefits.value[index] = result.benefit
  }
  lastClaimTimes.value[benefit.id] = new Date().toISOString()

  showToastMessage(`成功领取：${benefit.title}`, 'success')
}

function getExpSourceLabel(source) {
  return EXP_SOURCE_LABELS[source] || source
}

function getExpSourceIcon(source) {
  return EXP_SOURCE_ICONS[source] || '📝'
}

function formatRecordTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN')
}

function formatEstimatedDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function showToastMessage(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

function scrollToBenefits() {
  const element = document.getElementById('benefits-section')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function scrollToTasks() {
  const element = document.getElementById('tasks-section')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

onMounted(() => {
  setTimeout(() => {
    const messages = []
    if (expiringTasks.value.length > 0) {
      messages.push(`${expiringTasks.value.length} 个任务即将过期（共 ${expiringTasksTotalExp.value} 经验）`)
    }
    if (expiringBenefits.value.length > 0) {
      messages.push(`${expiringBenefits.value.length} 个权益即将过期`)
    }
    if (messages.length > 0) {
      showToastMessage(`提醒：${messages.join('，')}，请注意！`, 'info')
    }
  }, 1000)
})
</script>

<style scoped>
.growth-level {
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

.expiration-banner {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.expiration-icon {
  font-size: 20px;
  flex-shrink: 0;
  padding-top: 2px;
}

.expiration-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expiration-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.expiration-label {
  font-weight: 600;
  font-size: 13px;
}

.expiration-label.task {
  color: #b45309;
}

.expiration-label.benefit {
  color: #92400e;
}

.expiration-text {
  color: #92400e;
  font-size: 14px;
}

.link-btn {
  background: none;
  border: none;
  color: #d97706;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
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

.level-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 32px;
  border: 2px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.level-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.level-icon {
  font-size: 64px;
  flex-shrink: 0;
}

.level-info {
  flex: 1;
  min-width: 0;
}

.level-name {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.level-badge {
  padding: 4px 12px;
  border-radius: 12px;
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
}

.level-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.level-exp {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: #6b7280;
}

.exp-current {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
}

.exp-separator {
  font-size: 16px;
}

.exp-target {
  font-size: 16px;
}

.exp-unit {
  font-size: 14px;
  margin-left: 4px;
}

.level-next {
  text-align: right;
  flex-shrink: 0;
}

.next-label {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.next-level {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.next-exp {
  font-size: 12px;
  color: #6b7280;
}

.level-max {
  text-align: center;
  flex-shrink: 0;
}

.max-icon {
  font-size: 40px;
  margin-bottom: 4px;
}

.max-text {
  font-size: 14px;
  font-weight: 600;
  color: #f59e0b;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-bar-container {
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
}

.upgrade-estimate {
  color: #3b82f6;
  font-weight: 500;
}

.tips-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
}

.tip-item.success {
  background: #dcfce7;
  color: #166534;
}

.tip-item.warning {
  background: #fef9c3;
  color: #854d0e;
}

.tip-item.info {
  background: #dbeafe;
  color: #1e40af;
}

.tip-icon {
  flex-shrink: 0;
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
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

.task-summary {
  display: flex;
  gap: 16px;
  font-size: 13px;
}

.summary-item {
  color: #6b7280;
}

.summary-item.exp {
  color: #f59e0b;
  font-weight: 600;
}

.task-tabs,
.exp-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
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

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s;
}

.task-item:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.task-item.claimed {
  opacity: 0.6;
}

.task-item.completed {
  border-color: #10b981;
  background: #f0fdf4;
}

.task-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.task-title {
  font-weight: 600;
  color: #111827;
}

.task-type-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 10px;
}

.task-desc {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.task-progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.task-progress-bar-container {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.task-progress-bar {
  height: 100%;
  background: #3b82f6;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.task-item.completed .task-progress-bar {
  background: #10b981;
}

.task-progress-text {
  font-size: 12px;
  color: #6b7280;
  min-width: 60px;
  text-align: right;
}

.task-expiration {
  font-size: 12px;
  color: #f59e0b;
}

.task-expiration.expired {
  color: #ef4444;
}

.task-reward {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 8px;
}

.reward-exp {
  font-size: 18px;
  font-weight: 700;
  color: #f59e0b;
}

.task-action-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  white-space: nowrap;
}

.task-action-btn.claim {
  background: #3b82f6;
  color: #ffffff;
}

.task-action-btn.claim:hover:not(:disabled) {
  background: #2563eb;
}

.task-action-btn.continue,
.task-action-btn.start {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.task-action-btn.continue:hover:not(:disabled),
.task-action-btn.start:hover:not(:disabled) {
  background: #e5e7eb;
}

.task-action-btn.claimed,
.task-action-btn.expired {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.task-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  margin-right: 6px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.exp-summary {
  display: flex;
  gap: 16px;
  font-size: 13px;
}

.exp-gained {
  color: #10b981;
  font-weight: 600;
}

.exp-lost {
  color: #ef4444;
  font-weight: 600;
}

.exp-net {
  color: #3b82f6;
  font-weight: 600;
}

.exp-grouped {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exp-group-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.exp-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f9fafb;
  font-size: 14px;
}

.exp-source-icon {
  font-size: 18px;
}

.exp-source-name {
  flex: 1;
  font-weight: 500;
  color: #374151;
}

.exp-group-count {
  color: #9ca3af;
  font-size: 12px;
}

.exp-group-total {
  font-weight: 700;
  color: #10b981;
}

.exp-group-total.negative {
  color: #ef4444;
}

.exp-group-records {
  padding: 0;
}

.exp-list,
.exp-group-records {
  display: flex;
  flex-direction: column;
}

.exp-record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.exp-group-records .exp-record-item:last-child,
.exp-list .exp-record-item:last-child {
  border-bottom: none;
}

.record-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.record-content {
  flex: 1;
  min-width: 0;
}

.record-source {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
  margin-bottom: 2px;
}

.record-desc {
  font-size: 12px;
  color: #6b7280;
}

.exp-group-records .record-desc {
  font-size: 13px;
  flex: 1;
}

.record-exp-wrapper {
  text-align: right;
  flex-shrink: 0;
}

.record-exp {
  font-weight: 600;
  color: #10b981;
  font-size: 15px;
  display: block;
}

.record-exp.negative {
  color: #ef4444;
}

.record-time {
  font-size: 11px;
  color: #9ca3af;
}

.exp-group-records .record-exp {
  font-size: 14px;
}

.exp-group-records .record-time {
  margin-left: 12px;
}

.benefit-progress {
  font-size: 13px;
  color: #6b7280;
}

.benefit-progress-bar-container {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 16px;
}

.benefit-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.benefit-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s;
  align-items: flex-start;
}

.benefit-item:hover {
  border-color: #d1d5db;
}

.benefit-item.claimable {
  border-color: #3b82f6;
  background: #eff6ff;
}

.benefit-item.expired {
  opacity: 0.5;
}

.benefit-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.benefit-content {
  flex: 1;
  min-width: 0;
}

.benefit-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.benefit-title {
  font-weight: 600;
  color: #111827;
  font-size: 14px;
}

.benefit-status-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.benefit-desc {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.benefit-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
}

.benefit-level {
  color: #9ca3af;
}

.benefit-expires {
  color: #f59e0b;
}

.benefit-expires.expired {
  color: #ef4444;
}

.benefit-cooldown {
  color: #6b7280;
}

.benefit-action-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  flex-shrink: 0;
  white-space: nowrap;
}

.benefit-action-btn.claimable {
  background: #3b82f6;
  color: #ffffff;
}

.benefit-action-btn.claimable:hover:not(:disabled) {
  background: #2563eb;
}

.benefit-action-btn.locked {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.benefit-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.benefit-status-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.upgrade-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px 8px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
}

.upgrade-date {
  text-align: center;
  padding: 12px;
  background: #eff6ff;
  border-radius: 8px;
  color: #1e40af;
  font-size: 13px;
  margin-bottom: 16px;
}

.date-icon {
  margin-right: 4px;
}

.upgrade-milestones {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.milestones-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.milestone-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
}

.milestone-level {
  font-weight: 600;
  color: #3b82f6;
}

.milestone-date {
  color: #6b7280;
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
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .level-header {
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
  }

  .level-next,
  .level-max {
    width: 100%;
    text-align: center;
  }

  .progress-info {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
}

@media (max-width: 375px) {
  .container {
    padding: 0 16px;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .level-card {
    padding: 20px 16px;
  }

  .level-icon {
    font-size: 48px;
  }

  .level-title {
    font-size: 20px;
  }

  .exp-current {
    font-size: 28px;
  }

  .section-card {
    padding: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .task-tabs,
  .exp-tabs {
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none;
  }

  .task-tabs::-webkit-scrollbar,
  .exp-tabs::-webkit-scrollbar {
    display: none;
  }

  .task-item {
    flex-direction: column;
    gap: 12px;
  }

  .task-reward {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .benefit-item {
    flex-direction: column;
    gap: 10px;
  }

  .benefit-action-btn {
    align-self: stretch;
    text-align: center;
  }

  .upgrade-stats {
    gap: 8px;
  }

  .stat-value {
    font-size: 20px;
  }

  .exp-record-item {
    flex-wrap: wrap;
  }

  .exp-group-header {
    flex-wrap: wrap;
    gap: 6px;
  }

  .exp-group-records .exp-record-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .exp-group-records .record-exp {
    align-self: flex-end;
  }
}
</style>
