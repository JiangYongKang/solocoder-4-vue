<template>
  <div class="auth-form-wrapper">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-icon">🔐</div>
        <h1 class="auth-title">欢迎回来</h1>
        <p class="auth-subtitle">登录您的账号继续使用</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label for="login-username" class="field-label">用户名</label>
          <input
            id="login-username"
            v-model="formData.username"
            type="text"
            class="field-input"
            :class="{ 'has-error': errors.username || submitError }"
            placeholder="请输入用户名"
            @blur="validateField('username')"
            @input="clearError('username')"
          />
          <div v-if="errors.username" class="field-error">{{ errors.username }}</div>
        </div>

        <div class="form-field">
          <label for="login-password" class="field-label">密码</label>
          <input
            id="login-password"
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            class="field-input"
            :class="{ 'has-error': errors.password || submitError }"
            placeholder="请输入密码"
            @blur="validateField('password')"
            @input="clearError('password')"
          />
          <button type="button" class="toggle-password" @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
          <div v-if="errors.password" class="field-error">{{ errors.password }}</div>
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
            {{ isSubmitting ? '登录中...' : '登录' }}
          </button>
        </div>

        <div class="form-links">
          <button type="button" class="link-btn" @click="$emit('navigate', AUTH_ROUTES.FORGOT_PASSWORD)">
            忘记密码？
          </button>
          <button type="button" class="link-btn" @click="$emit('navigate', AUTH_ROUTES.REGISTER)">
            没有账号？立即注册
          </button>
        </div>
      </form>

      <div v-if="submitSuccess" class="submit-success">
        ✅ 登录成功，正在跳转...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { AUTH_ROUTES } from './constants.js'
import { validateLoginForm, validateUsername, validatePassword } from './formValidation.js'
import { loginUser } from './authState.js'

const emit = defineEmits(['navigate', 'loginSuccess'])

const showPassword = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)

const formData = reactive({
  username: '',
  password: ''
})

const errors = reactive({
  username: '',
  password: ''
})

const canSubmit = computed(() => {
  return formData.username.trim() !== '' && formData.password !== ''
})

function validateField(field) {
  if (field === 'username') {
    const result = validateUsername(formData.username)
    errors.username = result.valid ? '' : result.message
    return result.valid
  }
  if (field === 'password') {
    const result = validatePassword(formData.password)
    errors.password = result.valid ? '' : result.message
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
  const { isValid, errors: validationErrors } = validateLoginForm(formData)
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

  const result = loginUser(formData.username.trim(), formData.password)

  isSubmitting.value = false

  if (result.success) {
    submitSuccess.value = true
    setTimeout(() => {
      emit('loginSuccess', result.data)
      emit('navigate', AUTH_ROUTES.PROFILE)
    }, 500)
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
  max-width: 420px;
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
  gap: 20px;
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
  background: #3b82f6;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
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
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
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
