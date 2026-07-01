<template>
  <div class="auth-form-wrapper">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-icon">🔑</div>
        <h1 class="auth-title">找回密码</h1>
        <p class="auth-subtitle">输入您的邮箱，我们将发送验证码</p>
      </div>

      <form v-if="!step2" class="auth-form" @submit.prevent="handleSendCode">
        <div class="form-field">
          <label for="forgot-email" class="field-label">邮箱</label>
          <input
            id="forgot-email"
            v-model="formData.email"
            type="email"
            class="field-input"
            :class="{ 'has-error': errors.email || submitError }"
            placeholder="请输入注册时使用的邮箱"
            @blur="validateField('email')"
            @input="clearError('email')"
          />
          <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
        </div>

        <div v-if="submitError" class="submit-error">
          ⚠️ {{ submitError }}
        </div>

        <div v-if="submitSuccess" class="submit-success">
          ✅ 验证码已发送！请查收邮件：<strong>{{ mockCode }}</strong>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting || !canSendCode"
          >
            <span v-if="isSubmitting" class="btn-spinner"></span>
            {{ isSubmitting ? '发送中...' : '发送验证码' }}
          </button>
        </div>

        <div class="form-links">
          <button type="button" class="link-btn" @click="$emit('navigate', AUTH_ROUTES.LOGIN)">
            返回登录
          </button>
        </div>
      </form>

      <form v-else class="auth-form" @submit.prevent="handleResetPassword">
        <div class="step-hint">
          验证码已发送至 <strong>{{ formData.email }}</strong>
        </div>

        <div class="form-field">
          <label for="reset-code" class="field-label">验证码</label>
          <input
            id="reset-code"
            v-model="formData.code"
            type="text"
            class="field-input code-input"
            :class="{ 'has-error': errors.code || submitError }"
            placeholder="请输入6位验证码"
            maxlength="6"
            @input="clearError('code')"
          />
          <div v-if="errors.code" class="field-error">{{ errors.code }}</div>
          <div class="resend-hint">
            提示：验证码 <strong>{{ mockCode }}</strong>
            <button
              v-if="resendCountdown <= 0"
              type="button"
              class="resend-btn"
              @click="handleResendCode"
            >重新发送</button>
            <span v-else class="countdown">{{ resendCountdown }}s 后可重发</span>
          </div>
        </div>

        <div class="form-field">
          <label for="reset-password" class="field-label">新密码</label>
          <input
            id="reset-password"
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            class="field-input"
            :class="{ 'has-error': errors.password || submitError }"
            placeholder="至少8位，包含大小写字母和数字"
            @blur="validateField('password')"
            @input="clearError('password')"
          />
          <button type="button" class="toggle-password" @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
          <div v-if="errors.password" class="field-error">{{ errors.password }}</div>
        </div>

        <div class="form-field">
          <label for="reset-confirm" class="field-label">确认新密码</label>
          <input
            id="reset-confirm"
            v-model="formData.confirmPassword"
            type="password"
            class="field-input"
            :class="{ 'has-error': errors.confirmPassword || submitError }"
            placeholder="请再次输入新密码"
            @blur="validateField('confirmPassword')"
            @input="clearError('confirmPassword')"
          />
          <div v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</div>
        </div>

        <div v-if="submitError" class="submit-error">
          ⚠️ {{ submitError }}
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="isSubmitting"
            @click="goBack"
          >
            返回上一步
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting || !canReset"
          >
            <span v-if="isSubmitting" class="btn-spinner"></span>
            {{ isSubmitting ? '重置中...' : '重置密码' }}
          </button>
        </div>
      </form>

      <div v-if="resetSuccess" class="reset-success">
        <div class="success-icon">🎉</div>
        <div class="success-title">密码重置成功</div>
        <div class="success-desc">正在跳转到登录页，请使用新密码登录</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue'
import { AUTH_ROUTES } from './constants.js'
import {
  validateForgotPasswordForm,
  validateResetPasswordForm,
  validateEmail,
  validateStrongPassword,
  validateConfirmPassword
} from './formValidation.js'
import { requestPasswordReset, resetPassword } from './authState.js'

const emit = defineEmits(['navigate'])

const showPassword = ref(false)
const step2 = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)
const resetSuccess = ref(false)
const mockCode = ref('')
const resendCountdown = ref(0)
let countdownTimer = null

const formData = reactive({
  email: '',
  code: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  email: '',
  code: '',
  password: '',
  confirmPassword: ''
})

const canSendCode = computed(() => formData.email.trim() !== '')
const canReset = computed(() => {
  return (
    formData.code.trim() !== '' &&
    formData.password !== '' &&
    formData.confirmPassword !== ''
  )
})

function validateField(field) {
  if (field === 'email') {
    const result = validateEmail(formData.email)
    errors.email = result.valid ? '' : result.message
    return result.valid
  }
  if (field === 'password') {
    const result = validateStrongPassword(formData.password)
    errors.password = result.valid ? '' : result.message
    return result.valid
  }
  if (field === 'confirmPassword') {
    const result = validateConfirmPassword(formData.password, formData.confirmPassword)
    errors.confirmPassword = result.valid ? '' : result.message
    return result.valid
  }
  return true
}

function clearError(field) {
  if (errors[field]) {
    errors[field] = ''
  }
  if (submitError.value) {
    submitError.value = ''
  }
}

function startCountdown() {
  resendCountdown.value = 60
  countdownTimer = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})

async function handleSendCode() {
  submitError.value = ''
  submitSuccess.value = false

  const { isValid, errors: validationErrors } = validateForgotPasswordForm(formData)
  Object.assign(errors, validationErrors)
  if (!isValid) {
    return
  }

  isSubmitting.value = true
  await new Promise(resolve => setTimeout(resolve, 600))

  const result = requestPasswordReset(formData.email.trim())
  isSubmitting.value = false

  if (result.success) {
    mockCode.value = result.data.code
    submitSuccess.value = true
    startCountdown()
    setTimeout(() => {
      step2.value = true
      submitSuccess.value = false
    }, 1500)
  } else {
    submitError.value = result.error
  }
}

async function handleResendCode() {
  submitError.value = ''
  submitSuccess.value = false

  isSubmitting.value = true
  await new Promise(resolve => setTimeout(resolve, 400))

  const result = requestPasswordReset(formData.email.trim())
  isSubmitting.value = false

  if (result.success) {
    mockCode.value = result.data.code
    startCountdown()
  }
}

function goBack() {
  step2.value = false
  formData.code = ''
  formData.password = ''
  formData.confirmPassword = ''
  errors.code = ''
  errors.password = ''
  errors.confirmPassword = ''
  submitError.value = ''
}

async function handleResetPassword() {
  submitError.value = ''

  const { isValid, errors: validationErrors } = validateResetPasswordForm(formData)
  Object.assign(errors, validationErrors)
  if (!isValid) {
    return
  }

  isSubmitting.value = true
  await new Promise(resolve => setTimeout(resolve, 600))

  const result = resetPassword(
    formData.email.trim(),
    formData.code.trim().toUpperCase(),
    formData.password
  )

  isSubmitting.value = false

  if (result.success) {
    resetSuccess.value = true
    setTimeout(() => {
      emit('navigate', AUTH_ROUTES.LOGIN)
    }, 1500)
  } else {
    submitError.value = result.error
  }
}
</script>

<style scoped>
.auth-form-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.auth-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.step-hint {
  padding: 12px 16px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-size: 13px;
  color: #1d4ed8;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.field-input {
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  background: #ffffff;
}

.field-input.code-input {
  letter-spacing: 4px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-input.has-error {
  border-color: #ef4444;
  background: #fef2f2;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  margin-top: 8px;
}

.field-error {
  font-size: 12px;
  color: #ef4444;
}

.resend-hint {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.resend-btn {
  background: none;
  border: none;
  padding: 0;
  color: #3b82f6;
  cursor: pointer;
  font-size: 12px;
}

.resend-btn:hover {
  text-decoration: underline;
}

.countdown {
  color: #9ca3af;
}

.submit-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
}

.submit-success {
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #059669;
  font-size: 13px;
}

.form-actions {
  margin-top: 8px;
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

.form-links {
  display: flex;
  justify-content: center;
  margin-top: -8px;
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  color: #3b82f6;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
}

.link-btn:hover {
  text-decoration: underline;
}

.reset-success {
  margin-top: 24px;
  padding: 32px 24px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  text-align: center;
}

.success-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.success-title {
  font-size: 20px;
  font-weight: 700;
  color: #059669;
  margin-bottom: 8px;
}

.success-desc {
  font-size: 14px;
  color: #6b7280;
}

@media (max-width: 375px) {
  .auth-card {
    padding: 32px 20px;
    border-radius: 12px;
  }

  .auth-title {
    font-size: 20px;
  }

  .auth-subtitle {
    font-size: 13px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
