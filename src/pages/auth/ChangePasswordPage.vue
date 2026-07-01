<template>
  <div class="auth-form-wrapper">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-icon">🔒</div>
        <h1 class="auth-title">修改密码</h1>
        <p class="auth-subtitle">修改密码后需要重新登录</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label for="change-current" class="field-label">当前密码</label>
          <input
            id="change-current"
            v-model="formData.currentPassword"
            :type="showCurrentPassword ? 'text' : 'password'"
            class="field-input"
            :class="{ 'has-error': errors.currentPassword || submitError }"
            placeholder="请输入当前密码"
            @blur="validateField('currentPassword')"
            @input="clearError('currentPassword')"
          />
          <button type="button" class="toggle-password toggle-1" @click="showCurrentPassword = !showCurrentPassword">
            {{ showCurrentPassword ? '🙈' : '👁️' }}
          </button>
          <div v-if="errors.currentPassword" class="field-error">{{ errors.currentPassword }}</div>
        </div>

        <div class="form-field">
          <label for="change-new" class="field-label">新密码</label>
          <input
            id="change-new"
            v-model="formData.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            class="field-input"
            :class="{ 'has-error': errors.newPassword || submitError }"
            placeholder="至少8位，包含大小写字母和数字"
            @blur="validateField('newPassword')"
            @input="clearError('newPassword')"
          />
          <button type="button" class="toggle-password toggle-2" @click="showNewPassword = !showNewPassword">
            {{ showNewPassword ? '🙈' : '👁️' }}
          </button>
          <div v-if="errors.newPassword" class="field-error">{{ errors.newPassword }}</div>
          <div class="password-hint">密码需包含大小写字母和数字</div>
        </div>

        <div class="form-field">
          <label for="change-confirm" class="field-label">确认新密码</label>
          <input
            id="change-confirm"
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
            @click="handleCancel"
          >
            取消
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting || !canSubmit"
          >
            <span v-if="isSubmitting" class="btn-spinner"></span>
            {{ isSubmitting ? '修改中...' : '确认修改' }}
          </button>
        </div>
      </form>

      <div v-if="submitSuccess" class="submit-success">
        <div class="success-icon">✅</div>
        <div class="success-title">密码修改成功</div>
        <div class="success-desc">会话已失效，正在跳转到登录页...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { AUTH_ROUTES } from './constants.js'
import {
  validateChangePasswordForm,
  validateCurrentPassword,
  validateNewPassword,
  validateConfirmPassword
} from './formValidation.js'
import { changePassword } from './authState.js'

const emit = defineEmits(['navigate', 'logout'])

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)

const formData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const errors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const canSubmit = computed(() => {
  return (
    formData.currentPassword !== '' &&
    formData.newPassword !== '' &&
    formData.confirmPassword !== ''
  )
})

function validateField(field) {
  if (field === 'currentPassword') {
    const result = validateCurrentPassword(formData.currentPassword)
    errors.currentPassword = result.valid ? '' : result.message
    return result.valid
  }
  if (field === 'newPassword') {
    const result = validateNewPassword(formData.newPassword)
    errors.newPassword = result.valid ? '' : result.message
    return result.valid
  }
  if (field === 'confirmPassword') {
    const result = validateConfirmPassword(formData.newPassword, formData.confirmPassword)
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

function validateAll() {
  const { isValid, errors: validationErrors } = validateChangePasswordForm(formData)
  Object.assign(errors, validationErrors)
  return isValid
}

function handleCancel() {
  emit('navigate', AUTH_ROUTES.PROFILE)
}

async function handleSubmit() {
  submitError.value = ''
  submitSuccess.value = false

  if (!validateAll()) {
    return
  }

  isSubmitting.value = true
  await new Promise(resolve => setTimeout(resolve, 600))

  const result = changePassword(formData.currentPassword, formData.newPassword)

  isSubmitting.value = false

  if (result.success) {
    submitSuccess.value = true
    emit('logout')
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
  align-items: flex-start;
  justify-content: center;
  padding: 24px 16px;
}

.auth-card {
  width: 100%;
  max-width: 480px;
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
  color: #ef4444;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  padding-right: 42px;
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
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.toggle-1 {
  top: 50%;
  transform: translateY(-50%);
  margin-top: 8px;
}

.toggle-2 {
  top: 50%;
  transform: translateY(-50%);
  margin-top: 8px;
}

.field-error {
  font-size: 12px;
  color: #ef4444;
}

.password-hint {
  font-size: 11px;
  color: #9ca3af;
  margin-top: -4px;
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
  margin-top: 24px;
  padding: 32px 24px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  text-align: center;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.success-title {
  font-size: 18px;
  font-weight: 700;
  color: #059669;
  margin-bottom: 8px;
}

.success-desc {
  font-size: 13px;
  color: #6b7280;
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
  background: #f59e0b;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #d97706;
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
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
