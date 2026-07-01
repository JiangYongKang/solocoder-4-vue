<template>
  <div class="auth-form-wrapper">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-icon">✨</div>
        <h1 class="auth-title">创建账号</h1>
        <p class="auth-subtitle">加入我们，开启全新体验</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label for="register-username" class="field-label">用户名</label>
          <input
            id="register-username"
            v-model="formData.username"
            type="text"
            class="field-input"
            :class="{ 'has-error': errors.username || submitError }"
            placeholder="字母、数字、下划线，3-20个字符"
            @blur="validateField('username')"
            @input="clearError('username')"
          />
          <div v-if="errors.username" class="field-error">{{ errors.username }}</div>
        </div>

        <div class="form-field">
          <label for="register-email" class="field-label">邮箱</label>
          <input
            id="register-email"
            v-model="formData.email"
            type="email"
            class="field-input"
            :class="{ 'has-error': errors.email || submitError }"
            placeholder="请输入邮箱地址"
            @blur="validateField('email')"
            @input="clearError('email')"
          />
          <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
        </div>

        <div class="form-field">
          <label for="register-password" class="field-label">密码</label>
          <input
            id="register-password"
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
          <div class="password-hint">密码需包含大小写字母和数字</div>
        </div>

        <div class="form-field">
          <label for="register-confirm" class="field-label">确认密码</label>
          <input
            id="register-confirm"
            v-model="formData.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            type="password"
            class="field-input"
            :class="{ 'has-error': errors.confirmPassword || submitError }"
            placeholder="请再次输入密码"
            @blur="validateField('confirmPassword')"
            @input="clearError('confirmPassword')"
          />
          <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
            {{ showConfirmPassword ? '🙈' : '👁️' }}
          </button>
          <div v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</div>
        </div>

        <div v-if="submitError" class="submit-error">
          ⚠️ {{ submitError }}
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting || !canSubmit"
          >
            <span v-if="isSubmitting" class="btn-spinner"></span>
            {{ isSubmitting ? '注册中...' : '注册' }}
          </button>
        </div>

        <div class="form-links">
          <button type="button" class="link-btn" @click="$emit('navigate', AUTH_ROUTES.LOGIN)">
            已有账号？立即登录
          </button>
        </div>
      </form>

      <div v-if="submitSuccess" class="submit-success">
        ✅ 注册成功，正在跳转到登录页...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { AUTH_ROUTES } from './constants.js'
import { validateRegisterForm, validateUsername, validateEmail, validateStrongPassword, validateConfirmPassword } from './formValidation.js'
import { registerUser } from './authState.js'

const emit = defineEmits(['navigate'])

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)

const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const canSubmit = computed(() => {
  return (
    formData.username.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.password !== '' &&
    formData.confirmPassword !== ''
  )
})

function validateField(field) {
  if (field === 'username') {
    const result = validateUsername(formData.username)
    errors.username = result.valid ? '' : result.message
    return result.valid
  }
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

function validateAll() {
  const { isValid, errors: validationErrors } = validateRegisterForm(formData)
  Object.assign(errors, validationErrors)
  return isValid
}

async function handleSubmit() {
  submitError.value = ''
  submitSuccess.value = false

  if (!validateAll()) {
    return
  }

  isSubmitting.value = true
  await new Promise(resolve => setTimeout(resolve, 600))

  const result = registerUser(
    formData.username.trim(),
    formData.email.trim(),
    formData.password
  )

  isSubmitting.value = false

  if (result.success) {
    submitSuccess.value = true
    setTimeout(() => {
      emit('navigate', AUTH_ROUTES.LOGIN)
    }, 800)
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
  margin-top: 16px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #059669;
  font-size: 13px;
  text-align: center;
}

.form-actions {
  margin-top: 8px;
}

.btn {
  width: 100%;
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
  background: #10b981;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #059669;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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
}
</style>
