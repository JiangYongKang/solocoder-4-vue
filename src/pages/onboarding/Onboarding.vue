<template>
  <div class="onboarding">
    <div class="onboarding-container">
      <header class="onboarding-header">
        <div class="logo-area">
          <span class="logo-icon">🚀</span>
          <h1 class="page-title">新手引导</h1>
        </div>
        <button
          v-if="showSkipButton"
          class="skip-btn"
          @click="handleSkipClick"
        >
          跳过引导
        </button>
      </header>

      <div v-if="!isTerminalStep" class="progress-section">
        <div class="step-progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progress.progressPercent + '%' }"
          ></div>
        </div>
        <div class="step-indicators">
          <div
            v-for="(step, idx) in visibleSteps"
            :key="step"
            class="step-item"
            :class="{
              active: currentStep === step,
              completed: isStepCompleted(step)
            }"
          >
            <div class="step-circle">
              <span v-if="isStepCompleted(step)" class="step-check">✓</span>
              <span v-else class="step-num">{{ idx + 1 }}</span>
            </div>
            <span class="step-label">{{ stepLabels[step] }}</span>
          </div>
        </div>
      </div>

      <main class="content-area">
        <section v-if="currentStep === ONBOARDING_STEPS.WELCOME" class="step-content welcome-step">
          <div class="welcome-hero">
            <div class="hero-icon">🎉</div>
            <h2 class="welcome-title">欢迎加入 SoloCoder</h2>
            <p class="welcome-subtitle">用 1 分钟完成基础配置，开启您的高效之旅</p>
          </div>
          <div class="feature-cards">
            <div class="feature-card">
              <div class="feature-icon">⚙️</div>
              <h3>个性化配置</h3>
              <p>定制主题、语言和通知偏好</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>示例数据</h3>
              <p>快速上手，体验完整功能</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎁</div>
              <h3>新手奖励</h3>
              <p>完成引导获取专属奖励</p>
            </div>
          </div>
        </section>

        <section v-if="currentStep === ONBOARDING_STEPS.PREFERENCES" class="step-content preferences-step">
          <div class="section-header">
            <h2>选择您的偏好设置</h2>
            <p class="section-desc">这些设置可以在账户设置中随时修改</p>
          </div>

          <div class="preference-group">
            <h3 class="group-title">界面主题</h3>
            <div class="option-grid theme-grid">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                class="option-card"
                :class="{ active: preferences.theme === option.value }"
                @click="updatePref('theme', option.value)"
              >
                <div class="option-icon">{{ option.icon }}</div>
                <div class="option-label">{{ option.label }}</div>
                <div class="option-desc">{{ option.description }}</div>
                <div v-if="preferences.theme === option.value" class="option-check">✓</div>
              </button>
            </div>
          </div>

          <div class="preference-group">
            <h3 class="group-title">显示语言</h3>
            <div class="option-grid language-grid">
              <button
                v-for="option in languageOptions"
                :key="option.value"
                class="option-card"
                :class="{ active: preferences.language === option.value }"
                @click="updatePref('language', option.value)"
              >
                <div class="option-icon">{{ option.icon }}</div>
                <div class="option-label">{{ option.label }}</div>
                <div v-if="preferences.language === option.value" class="option-check">✓</div>
              </button>
            </div>
          </div>

          <div class="preference-group">
            <h3 class="group-title">通知方式</h3>
            <div class="option-grid notification-grid">
              <button
                v-for="option in notificationOptions"
                :key="option.value"
                class="option-card"
                :class="{ active: preferences.notifications === option.value }"
                @click="updatePref('notifications', option.value)"
              >
                <div class="option-icon">{{ option.icon }}</div>
                <div class="option-label">{{ option.label }}</div>
                <div class="option-desc">{{ option.description }}</div>
                <div v-if="preferences.notifications === option.value" class="option-check">✓</div>
              </button>
            </div>
          </div>
        </section>

        <section v-if="currentStep === ONBOARDING_STEPS.EXAMPLE_DATA" class="step-content example-data-step">
          <div class="section-header">
            <h2>示例数据设置</h2>
            <p class="section-desc">启用示例数据可以帮助您快速了解系统功能</p>
          </div>

          <div class="example-card">
            <div class="example-header">
              <div class="example-icon">📊</div>
              <div class="example-info">
                <h3>加载示例数据</h3>
                <p>预置项目、任务和报表数据，快速体验完整功能</p>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="preferences.enableExampleData"
                  @change="toggleExampleData"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="example-features">
              <div class="example-feature-item">
                <span class="feature-bullet">✓</span>
                <span>3 个示例项目，涵盖不同工作流程</span>
              </div>
              <div class="example-feature-item">
                <span class="feature-bullet">✓</span>
                <span>15+ 条预设任务，了解任务管理逻辑</span>
              </div>
              <div class="example-feature-item">
                <span class="feature-bullet">✓</span>
                <span>示例报表数据，直观查看统计分析</span>
              </div>
              <div class="example-feature-item">
                <span class="feature-bullet">✓</span>
                <span>随时可在数据管理中清除示例数据</span>
              </div>
            </div>

            <div class="example-note" :class="{ enabled: preferences.enableExampleData }">
              <span class="note-icon">{{ preferences.enableExampleData ? '💡' : '⚠️' }}</span>
              <div class="note-content">
                <strong>{{ preferences.enableExampleData ? '已启用示例数据' : '未启用示例数据' }}</strong>
                <span v-if="preferences.enableExampleData">
                  ，您可以在熟悉系统后清除示例数据
                </span>
                <span v-else>
                  ，系统将以空状态启动，您可以从空白开始配置
                </span>
              </div>
            </div>
          </div>
        </section>

        <section v-if="currentStep === ONBOARDING_STEPS.CONFIRMATION" class="step-content confirmation-step">
          <div class="section-header">
            <h2>确认您的配置</h2>
            <p class="section-desc">请确认以下配置信息，提交后将应用到您的账户</p>
          </div>

          <div class="summary-card">
            <h3 class="summary-title">配置摘要</h3>
            <div class="summary-items">
              <div
                v-for="item in summary.items"
                :key="item.key"
                class="summary-item"
              >
                <span class="summary-icon">{{ item.icon }}</span>
                <div class="summary-details">
                  <span class="summary-label">{{ item.label }}</span>
                  <span class="summary-value">{{ item.value }}</span>
                </div>
                <button class="edit-btn" @click="goEdit(item.key)">修改</button>
              </div>
            </div>
          </div>

          <div class="reward-preview-card">
            <div class="reward-preview-header">
              <span class="reward-icon">🎁</span>
              <div>
                <h3>完成引导奖励</h3>
                <p>共 {{ completionSummary.rewardsCount }} 项奖励，总价值 {{ completionSummary.totalValue }} 积分</p>
              </div>
            </div>
            <div class="reward-preview-list">
              <div v-for="reward in completionRewards" :key="reward.id" class="reward-preview-item">
                <span class="rp-icon">{{ reward.icon }}</span>
                <span class="rp-name">{{ reward.name }}</span>
                <span v-if="reward.value" class="rp-value">+{{ reward.value }} 积分</span>
              </div>
            </div>
          </div>
        </section>

        <section v-if="currentStep === ONBOARDING_STEPS.SKIPPED" class="step-content skipped-step">
          <div class="skipped-hero">
            <div class="skipped-icon">⏭️</div>
            <h2>{{ skippedInfo.title }}</h2>
            <p class="skipped-subtitle">{{ skippedInfo.subtitle }}</p>
            <p class="skipped-desc">{{ skippedInfo.description }}</p>
          </div>

          <div class="skipped-suggestions">
            <h3 class="section-subtitle">后续建议操作</h3>
            <div class="suggestion-cards">
              <button
                v-for="suggestion in skippedInfo.suggestions"
                :key="suggestion.id"
                class="suggestion-card"
              >
                <span class="suggestion-icon">{{ suggestion.icon }}</span>
                <div class="suggestion-info">
                  <h4>{{ suggestion.title }}</h4>
                  <p>{{ suggestion.description }}</p>
                </div>
                <span class="suggestion-action">{{ suggestion.action }} →</span>
              </button>
            </div>
          </div>

          <div class="skipped-tips-card">
            <h3>💡 小贴士</h3>
            <ul class="tips-list">
              <li v-for="(tip, idx) in skippedInfo.tips" :key="idx">{{ tip }}</li>
            </ul>
          </div>
        </section>

        <section v-if="currentStep === ONBOARDING_STEPS.COMPLETED" class="step-content completed-step">
          <div class="completed-hero">
            <div class="completed-icon-wrap">
              <span class="completed-icon">🎉</span>
              <div class="sparkle sparkle-1">✨</div>
              <div class="sparkle sparkle-2">🌟</div>
              <div class="sparkle sparkle-3">✨</div>
            </div>
            <h2>引导完成，恭喜您！</h2>
            <p class="completed-subtitle">以下是为您准备的欢迎奖励和推荐任务</p>
          </div>

          <div class="quick-stats">
            <div
              v-for="stat in completionSummary.quickStats"
              :key="stat.label"
              class="stat-item"
            >
              <span class="stat-icon">{{ stat.icon }}</span>
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>

          <div class="rewards-section">
            <h3 class="section-subtitle">🎁 您已获得的奖励</h3>
            <div class="reward-cards">
              <div v-for="reward in completionRewards" :key="reward.id" class="reward-card unlocked">
                <div class="reward-top">
                  <span class="reward-card-icon">{{ reward.icon }}</span>
                  <span v-if="reward.value" class="reward-badge">+{{ reward.value }}</span>
                </div>
                <h4 class="reward-name">{{ reward.name }}</h4>
                <p class="reward-desc">{{ reward.description }}</p>
              </div>
            </div>
          </div>

          <div class="tasks-section">
            <div class="tasks-header">
              <h3 class="section-subtitle">📋 推荐完成的任务</h3>
              <div class="task-progress">
                <span>{{ taskProgress.completed }}/{{ taskProgress.total }} 已完成</span>
                <div class="mini-progress-bar">
                  <div
                    class="mini-progress-fill"
                    :style="{ width: taskProgress.progressPercent + '%' }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="task-cards">
              <button
                v-for="task in sortedTasks"
                :key="task.id"
                class="task-card"
                :class="task.status"
                @click="handleTaskClick(task)"
              >
                <div class="task-left">
                  <span class="task-icon">{{ task.icon }}</span>
                  <div class="task-info">
                    <div class="task-title-row">
                      <h4>{{ task.title }}</h4>
                      <span
                        class="priority-tag"
                        :style="{ backgroundColor: getPriorityColor(task.priority) }"
                      >{{ getPriorityLabel(task.priority) }}</span>
                    </div>
                    <p class="task-desc">{{ task.description }}</p>
                    <span class="task-estimate">⏱️ {{ task.estimate }}</span>
                  </div>
                </div>
                <div class="task-status-indicator">
                  <span v-if="task.status === 'completed'" class="status-done">✓</span>
                  <span v-else-if="task.status === 'in_progress'" class="status-progress">进行中</span>
                  <span v-else class="status-arrow">→</span>
                </div>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer v-if="!isTerminalStep" class="action-footer">
        <button
          v-if="canGoPrevious"
          class="action-btn btn-secondary"
          @click="handlePrevious"
        >
          ← 返回
        </button>
        <button
          v-else
          class="action-btn btn-ghost"
          disabled
        >
          已是第一步
        </button>

        <div class="footer-spacer"></div>

        <button
          v-if="canGoNext"
          class="action-btn btn-primary"
          @click="handleNext"
        >
          {{ isLastStep ? '确认并完成' : '下一步' }} →
        </button>
      </footer>

      <footer v-if="currentStep === ONBOARDING_STEPS.COMPLETED" class="action-footer completed-footer">
        <button
          class="action-btn btn-secondary"
          @click="handleRestart"
        >
          🔄 重新查看引导
        </button>
        <button
          class="action-btn btn-primary"
          @click="handleEnterSystem"
        >
          进入系统 →
        </button>
      </footer>

      <footer v-if="currentStep === ONBOARDING_STEPS.SKIPPED" class="action-footer skipped-footer">
        <button
          class="action-btn btn-secondary"
          @click="handleRestart"
        >
          🔄 继续完成引导
        </button>
        <button
          class="action-btn btn-primary"
          @click="handleEnterSystem"
        >
          进入系统 →
        </button>
      </footer>
    </div>

    <div v-if="showSkipDialog" class="modal-overlay" @click.self="cancelSkipDialog">
      <div class="modal-dialog skip-dialog">
        <div class="modal-header">
          <span class="modal-icon">⚠️</span>
          <h3>{{ skipWarningData.title }}</h3>
        </div>
        <div class="modal-body">
          <p class="modal-message">{{ skipWarningData.message }}</p>

          <div class="warning-list">
            <h4>跳过将导致：</h4>
            <ul>
              <li v-for="(warn, idx) in skipWarningData.warnings" :key="idx">
                <span class="warn-bullet">•</span> {{ warn.message }}
              </li>
            </ul>
          </div>

          <div class="continue-info">
            <h4>请放心，您可以：</h4>
            <div
              v-for="(info, idx) in skipWarningData.continueInfo"
              :key="idx"
              class="continue-info-item"
            >
              <span class="ci-icon">{{ info.icon }}</span>
              <div>
                <strong>{{ info.title }}</strong>
                <p>{{ info.description }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button
            class="action-btn btn-secondary"
            @click="cancelSkipDialog"
          >
            {{ skipWarningData.cancelText }}
          </button>
          <button
            class="action-btn btn-danger"
            @click="confirmSkipAction"
          >
            {{ skipWarningData.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  ONBOARDING_STEPS,
  STEP_LABELS,
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  NOTIFICATION_OPTIONS
} from './constants.js'
import {
  canGoNext as checkCanGoNext,
  canGoPrevious as checkCanGoPrevious,
  advanceStep,
  goBackStep,
  isLastStep as checkIsLastStep,
  isTerminalStep as checkIsTerminal,
  getProgress,
  getVisibleSteps,
  skipOnboarding,
  completeOnboarding
} from './stepFlow.js'
import {
  createDefaultPreferences,
  updatePreference,
  generatePreferenceSummary
} from './preferenceSummary.js'
import {
  createSkipWarning,
  getSkippedStateInfo,
  canSkip,
  confirmSkip,
  cancelSkip
} from './skipConfirmation.js'
import {
  getCompletionRewards,
  getCompletionSummary,
  getRecommendedTasksWithStatus,
  getPriorityLabel,
  getPriorityColor,
  sortTasksByPriority,
  startTask,
  completeTask,
  getTaskProgress
} from './completionReward.js'

const stepLabels = STEP_LABELS
const themeOptions = THEME_OPTIONS
const languageOptions = LANGUAGE_OPTIONS
const notificationOptions = NOTIFICATION_OPTIONS

const currentStep = ref(ONBOARDING_STEPS.WELCOME)
const preferences = ref(createDefaultPreferences())
const showSkipDialog = ref(false)
const taskStatuses = ref(getRecommendedTasksWithStatus())

const visibleSteps = computed(() => getVisibleSteps())
const isTerminalStep = computed(() => checkIsTerminal(currentStep.value))
const canGoNext = computed(() => checkCanGoNext(currentStep.value))
const canGoPrevious = computed(() => checkCanGoPrevious(currentStep.value))
const isLastStep = computed(() => checkIsLastStep(currentStep.value))
const progress = computed(() => getProgress(currentStep.value))
const showSkipButton = computed(() =>
  !isTerminalStep.value && currentStep.value !== ONBOARDING_STEPS.CONFIRMATION
)

const summary = computed(() => generatePreferenceSummary(preferences.value))
const skippedInfo = computed(() => getSkippedStateInfo())
const skipWarningData = computed(() => createSkipWarning(currentStep.value))
const completionRewards = computed(() => getCompletionRewards())
const completionSummary = computed(() => getCompletionSummary())
const sortedTasks = computed(() => sortTasksByPriority(taskStatuses.value))
const taskProgress = computed(() => getTaskProgress(taskStatuses.value))

function isStepCompleted(step) {
  const visible = visibleSteps.value
  const stepIndex = visible.indexOf(step)
  const currentIndex = visible.indexOf(currentStep.value)
  return stepIndex < currentIndex
}

function updatePref(key, value) {
  preferences.value = updatePreference(preferences.value, key, value)
}

function toggleExampleData(event) {
  preferences.value = updatePreference(preferences.value, 'enableExampleData', event.target.checked)
}

function handleNext() {
  if (isLastStep.value) {
    const result = completeOnboarding(currentStep.value)
    if (result.success) {
      currentStep.value = result.currentStep
    }
  } else {
    const result = advanceStep(currentStep.value)
    if (result.success) {
      currentStep.value = result.currentStep
    }
  }
}

function handlePrevious() {
  const result = goBackStep(currentStep.value)
  if (result.success) {
    currentStep.value = result.currentStep
  }
}

function goEdit(key) {
  const targetSteps = {
    theme: ONBOARDING_STEPS.PREFERENCES,
    language: ONBOARDING_STEPS.PREFERENCES,
    notifications: ONBOARDING_STEPS.PREFERENCES,
    enableExampleData: ONBOARDING_STEPS.EXAMPLE_DATA
  }
  const target = targetSteps[key]
  if (target) {
    currentStep.value = target
  }
}

function handleSkipClick() {
  if (canSkip(currentStep.value)) {
    showSkipDialog.value = true
  }
}

function cancelSkipDialog() {
  cancelSkip()
  showSkipDialog.value = false
}

function confirmSkipAction() {
  const result = confirmSkip(currentStep.value)
  if (result.success) {
    const skipResult = skipOnboarding(currentStep.value)
    if (skipResult.success) {
      currentStep.value = skipResult.currentStep
    }
  }
  showSkipDialog.value = false
}

function handleTaskClick(task) {
  if (task.status === 'pending') {
    const result = startTask(taskStatuses.value, task.id)
    if (result.success) {
      taskStatuses.value = result.tasks
    }
  } else if (task.status === 'in_progress') {
    const result = completeTask(taskStatuses.value, task.id)
    if (result.success) {
      taskStatuses.value = result.tasks
    }
  }
}

function handleRestart() {
  currentStep.value = ONBOARDING_STEPS.WELCOME
  taskStatuses.value = getRecommendedTasksWithStatus()
}

function handleEnterSystem() {
  console.log('进入系统')
}
</script>

<style scoped>
.onboarding {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #f0fdf4 100%);
  padding-bottom: 100px;
}

.onboarding-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.onboarding-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 32px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.skip-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.skip-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

.progress-section {
  margin-bottom: 32px;
}

.step-progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.step-indicators {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.step-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f3f4f6;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  color: #9ca3af;
  transition: all 0.3s;
  z-index: 1;
}

.step-item.active .step-circle {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.step-item.completed .step-circle {
  background: #10b981;
  border-color: #10b981;
  color: #fff;
}

.step-check {
  font-size: 14px;
}

.step-label {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  font-weight: 500;
}

.step-item.active .step-label {
  color: #3b82f6;
  font-weight: 600;
}

.step-item.completed .step-label {
  color: #10b981;
}

.content-area {
  min-height: 400px;
}

.step-content {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
}

.section-header {
  margin-bottom: 28px;
}

.section-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.section-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.section-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.welcome-step {
  text-align: center;
}

.welcome-hero {
  margin-bottom: 40px;
  padding: 20px 0;
}

.hero-icon {
  font-size: 64px;
  margin-bottom: 16px;
  display: inline-block;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.welcome-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.feature-card {
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.feature-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.feature-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 6px 0;
}

.feature-card p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.preference-group {
  margin-bottom: 28px;
}

.group-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.option-grid {
  display: grid;
  gap: 12px;
}

.theme-grid {
  grid-template-columns: repeat(3, 1fr);
}

.language-grid {
  grid-template-columns: repeat(2, 1fr);
}

.notification-grid {
  grid-template-columns: repeat(2, 1fr);
}

.option-card {
  position: relative;
  padding: 16px;
  background: #fafafa;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.option-card:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.option-card.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.option-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.option-label {
  font-weight: 600;
  color: #111827;
  font-size: 14px;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.option-check {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.example-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
  border: 1px solid #e0f2fe;
  border-radius: 12px;
  overflow: hidden;
}

.example-header {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #e0f2fe;
}

.example-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.example-info {
  flex: 1;
  min-width: 0;
}

.example-info h3 {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.example-info p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: 0.3s;
  border-radius: 28px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #3b82f6;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.example-features {
  padding: 20px 24px;
}

.example-feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  font-size: 14px;
  color: #374151;
}

.feature-bullet {
  color: #10b981;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
}

.example-note {
  margin: 0 24px 24px 24px;
  padding: 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.example-note.enabled {
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.note-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.note-content {
  font-size: 13px;
  color: #92400e;
  line-height: 1.5;
}

.example-note.enabled .note-content {
  color: #065f46;
}

.note-content strong {
  display: block;
  margin-bottom: 2px;
}

.summary-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}

.summary-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.summary-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
}

.summary-value {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.edit-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.edit-btn:hover {
  background: #eff6ff;
  border-color: #3b82f6;
}

.reward-preview-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #fcd34d;
}

.reward-preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.reward-icon {
  font-size: 32px;
}

.reward-preview-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 2px 0;
}

.reward-preview-header p {
  font-size: 13px;
  color: #b45309;
  margin: 0;
}

.reward-preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-preview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  font-size: 14px;
}

.rp-icon {
  font-size: 18px;
}

.rp-name {
  flex: 1;
  color: #78350f;
  font-weight: 500;
}

.rp-value {
  color: #d97706;
  font-weight: 600;
}

.skipped-step {
  text-align: center;
}

.skipped-hero {
  padding: 20px 0 32px 0;
}

.skipped-icon {
  font-size: 56px;
  display: block;
  margin-bottom: 16px;
}

.skipped-hero h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.skipped-subtitle {
  font-size: 15px;
  color: #f59e0b;
  font-weight: 500;
  margin: 0 0 8px 0;
}

.skipped-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

.skipped-suggestions {
  text-align: left;
  margin-bottom: 24px;
}

.suggestion-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.suggestion-card:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateX(4px);
}

.suggestion-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.suggestion-info {
  flex: 1;
  min-width: 0;
}

.suggestion-info h4 {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.suggestion-info p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.suggestion-action {
  color: #3b82f6;
  font-weight: 500;
  font-size: 13px;
  flex-shrink: 0;
}

.skipped-tips-card {
  background: #fefce8;
  border: 1px solid #fef08a;
  border-radius: 10px;
  padding: 20px;
  text-align: left;
}

.skipped-tips-card h3 {
  font-size: 15px;
  font-weight: 600;
  color: #854d0e;
  margin: 0 0 12px 0;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tips-list li {
  font-size: 13px;
  color: #713f12;
  line-height: 1.5;
}

.completed-step {
  text-align: center;
}

.completed-hero {
  padding: 20px 0 32px 0;
}

.completed-icon-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.completed-icon {
  font-size: 64px;
  display: inline-block;
  animation: pop 0.6s ease;
}

@keyframes pop {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.sparkle {
  position: absolute;
  font-size: 20px;
  animation: sparkle 1.5s infinite;
}

.sparkle-1 { top: 0; left: -10px; animation-delay: 0s; }
.sparkle-2 { top: -20px; left: 40px; animation-delay: 0.3s; }
.sparkle-3 { top: 5px; right: -15px; animation-delay: 0.6s; }

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1); }
}

.completed-hero h2 {
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.completed-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}

.stat-item {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 10px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid #e2e8f0;
}

.stat-icon {
  font-size: 22px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
}

.rewards-section {
  text-align: left;
  margin-bottom: 32px;
}

.reward-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.reward-card {
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  transition: all 0.3s;
}

.reward-card.unlocked {
  background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 50%, #dcfce7 100%);
  border-color: #84cc16;
  box-shadow: 0 4px 12px rgba(132, 204, 22, 0.15);
}

.reward-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.reward-card-icon {
  font-size: 32px;
}

.reward-badge {
  background: #84cc16;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
}

.reward-name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.reward-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.tasks-section {
  text-align: left;
}

.tasks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.tasks-header .section-subtitle {
  margin: 0;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #6b7280;
}

.mini-progress-bar {
  width: 100px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: #10b981;
  border-radius: 3px;
  transition: width 0.3s;
}

.task-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.task-card:hover:not(.completed) {
  border-color: #3b82f6;
  background: #f8fafc;
  transform: translateX(4px);
}

.task-card.completed {
  background: #f0fdf4;
  border-color: #bbf7d0;
  opacity: 0.8;
}

.task-card.in_progress {
  background: #eff6ff;
  border-color: #93c5fd;
}

.task-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.task-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.task-title-row h4 {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.priority-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
}

.task-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.task-estimate {
  font-size: 11px;
  color: #9ca3af;
}

.task-status-indicator {
  flex-shrink: 0;
}

.status-done {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #10b981;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.status-progress {
  padding: 4px 10px;
  background: #3b82f6;
  color: #fff;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-arrow {
  color: #9ca3af;
  font-size: 18px;
  font-weight: 700;
}

.action-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.06);
  z-index: 50;
}

.action-footer .action-btn {
  max-width: 420px;
}

.footer-spacer {
  flex: 1;
  max-width: 420px;
}

.completed-footer,
.skipped-footer {
  justify-content: center;
}

.action-btn {
  padding: 12px 28px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
}

.btn-secondary {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-ghost {
  background: transparent;
  color: #9ca3af;
  border: none;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-dialog {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  font-size: 28px;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  flex: 1;
}

.modal-body {
  padding: 24px;
}

.modal-message {
  font-size: 14px;
  color: #374151;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.warning-list {
  background: #fef2f2;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.warning-list h4,
.continue-info h4 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 10px 0;
}

.warning-list h4 {
  color: #dc2626;
}

.continue-info h4 {
  color: #059669;
}

.warning-list ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.warning-list li {
  font-size: 13px;
  color: #991b1b;
  display: flex;
  gap: 8px;
}

.warn-bullet {
  color: #ef4444;
}

.continue-info {
  background: #f0fdf4;
  border-radius: 8px;
  padding: 16px;
}

.continue-info-item {
  display: flex;
  gap: 12px;
  padding: 8px 0;
}

.continue-info-item + .continue-info-item {
  border-top: 1px solid #bbf7d0;
}

.ci-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.continue-info-item strong {
  display: block;
  font-size: 13px;
  color: #065f46;
  margin-bottom: 2px;
}

.continue-info-item p {
  margin: 0;
  font-size: 12px;
  color: #047857;
  line-height: 1.4;
}

.modal-actions {
  padding: 16px 24px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #f3f4f6;
}

.modal-actions .action-btn {
  flex: 1;
  justify-content: center;
}

@media (max-width: 900px) {
  .feature-cards {
    grid-template-columns: 1fr;
  }

  .notification-grid {
    grid-template-columns: 1fr;
  }

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .reward-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .step-label {
    display: none;
  }

  .step-indicators {
    gap: 4px;
  }

  .theme-grid {
    grid-template-columns: 1fr;
  }

  .language-grid {
    grid-template-columns: 1fr;
  }

  .step-content {
    padding: 20px 16px;
    border-radius: 12px;
  }

  .feature-cards {
    gap: 12px;
  }

  .feature-card {
    padding: 16px;
  }

  .preference-group {
    margin-bottom: 20px;
  }

  .example-header {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .example-header .toggle-switch {
    align-self: flex-end;
  }

  .section-header h2 {
    font-size: 19px;
  }

  .welcome-title {
    font-size: 22px;
  }

  .hero-icon {
    font-size: 48px;
  }

  .summary-item {
    flex-wrap: wrap;
  }

  .edit-btn {
    width: 100%;
    justify-content: center;
    order: 3;
  }

  .skipped-hero h2,
  .completed-hero h2 {
    font-size: 20px;
  }

  .task-card {
    flex-direction: column;
    align-items: stretch;
  }

  .task-status-indicator {
    align-self: flex-end;
  }
}

@media (max-width: 375px) {
  .onboarding-container {
    padding: 16px 12px;
  }

  .onboarding-header {
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 20px;
  }

  .logo-icon {
    font-size: 26px;
  }

  .skip-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .progress-section {
    margin-bottom: 20px;
  }

  .step-circle {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }

  .section-header h2 {
    font-size: 17px;
  }

  .section-desc {
    font-size: 13px;
  }

  .step-content {
    padding: 16px 12px;
  }

  .welcome-hero {
    margin-bottom: 24px;
    padding: 8px 0;
  }

  .welcome-subtitle {
    font-size: 13px;
  }

  .option-card {
    padding: 12px;
  }

  .option-icon {
    font-size: 22px;
  }

  .option-label {
    font-size: 13px;
  }

  .option-desc {
    font-size: 11px;
  }

  .option-check {
    width: 18px;
    height: 18px;
    font-size: 11px;
    top: 8px;
    right: 8px;
  }

  .example-header {
    padding: 16px;
    gap: 12px;
  }

  .example-icon {
    font-size: 32px;
  }

  .example-info h3 {
    font-size: 15px;
  }

  .example-info p {
    font-size: 12px;
  }

  .example-features {
    padding: 14px 16px;
  }

  .example-feature-item {
    font-size: 12px;
    padding: 6px 0;
  }

  .example-note {
    margin: 0 16px 16px 16px;
    padding: 12px;
  }

  .note-content {
    font-size: 12px;
  }

  .summary-card {
    padding: 16px;
  }

  .summary-item {
    padding: 10px;
    gap: 10px;
  }

  .summary-icon {
    font-size: 20px;
  }

  .summary-label {
    font-size: 11px;
  }

  .summary-value {
    font-size: 13px;
  }

  .reward-preview-card {
    padding: 14px;
  }

  .reward-preview-header {
    gap: 10px;
  }

  .reward-icon {
    font-size: 24px;
  }

  .reward-preview-header h3 {
    font-size: 14px;
  }

  .reward-preview-header p {
    font-size: 12px;
  }

  .reward-preview-item {
    padding: 8px 10px;
    font-size: 12px;
  }

  .skipped-hero,
  .completed-hero {
    padding: 8px 0 20px 0;
  }

  .skipped-icon {
    font-size: 42px;
  }

  .completed-icon {
    font-size: 48px;
  }

  .quick-stats {
    gap: 8px;
    margin-bottom: 20px;
  }

  .stat-item {
    padding: 12px 8px;
  }

  .stat-icon {
    font-size: 18px;
  }

  .stat-value {
    font-size: 15px;
  }

  .stat-label {
    font-size: 10px;
  }

  .reward-card {
    padding: 14px;
  }

  .reward-card-icon {
    font-size: 26px;
  }

  .reward-name {
    font-size: 13px;
  }

  .reward-desc {
    font-size: 11px;
  }

  .suggestion-card {
    padding: 14px;
    gap: 12px;
  }

  .suggestion-icon {
    font-size: 24px;
  }

  .suggestion-info h4 {
    font-size: 13px;
  }

  .suggestion-info p {
    font-size: 11px;
  }

  .skipped-tips-card {
    padding: 14px;
  }

  .tips-list li {
    font-size: 12px;
  }

  .task-card {
    padding: 14px;
  }

  .task-icon {
    font-size: 26px;
  }

  .task-title-row h4 {
    font-size: 13px;
  }

  .priority-tag {
    font-size: 10px;
  }

  .task-desc {
    font-size: 11px;
  }

  .action-footer {
    padding: 12px 16px;
    gap: 8px;
  }

  .action-btn {
    padding: 10px 20px;
    font-size: 13px;
  }

  .modal-actions {
    padding: 12px 16px 20px 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-icon {
    font-size: 22px;
  }

  .modal-header h3 {
    font-size: 15px;
  }
}
</style>