<template>
  <div class="id-verification">
    <div class="container">
      <header class="page-header">
        <h1>账号实名认证</h1>
        <p class="subtitle">完成实名认证，解锁全部功能</p>
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

      <div v-if="status === REJECTED && rejectReason" class="reject-reason-card">
        <div class="reject-icon">⚠️</div>
        <div class="reject-content">
          <div class="reject-title">审核失败原因</div>
          <div class="reject-message">{{ rejectReason }}</div>
        </div>
      </div>

      <div class="content-grid">
        <div class="main-content">
          <div v-if="editable" class="certificate-type-section">
            <h2>选择证件类型</h2>
            <div class="certificate-types">
              <button
                v-for="certType in certificateTypesList"
                :key="certType.type"
                class="cert-type-btn"
                :class="{ active: selectedType === certType.type }"
                @click="selectCertificateType(certType.type)"
              >
                <div class="cert-type-icon">{{ getCertTypeIcon(certType.type) }}</div>
                <div class="cert-type-label">{{ certType.label }}</div>
                <div class="cert-type-desc">{{ certType.description }}</div>
              </button>
            </div>
          </div>

          <div class="form-section">
            <h2 v-if="editable">上传证件照片</h2>
            <h2 v-else>证件信息</h2>

            <div v-if="editable" class="upload-section">
              <div class="upload-hint">{{ currentConfig?.uploadHint }}</div>
              <div
                class="upload-area"
                :class="{ 'has-file': uploadedFile, 'uploading': isOCRProcessing }"
                @click="triggerFileUpload"
                @dragover.prevent
                @drop.prevent="handleFileDrop"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="file-input"
                  @change="handleFileSelect"
                />
                <div v-if="isOCRProcessing" class="uploading-state">
                  <div class="spinner"></div>
                  <div class="uploading-text">OCR识别中...</div>
                </div>
                <div v-else-if="uploadedFile" class="file-preview">
                  <div class="preview-icon">🖼️</div>
                  <div class="file-name">{{ uploadedFile.name }}</div>
                  <div class="file-size">{{ formatFileSize(uploadedFile.size) }}</div>
                  <button v-if="editable" class="change-btn" @click.stop="triggerFileUpload">
                    重新上传
                  </button>
                </div>
                <div v-else class="upload-placeholder">
                  <div class="upload-icon">📷</div>
                  <div class="upload-text">点击或拖拽上传证件照片</div>
                  <div class="upload-support">支持 JPG、PNG 格式，单张不超过 10MB</div>
                </div>
              </div>
              <div v-if="ocrError" class="ocr-error">{{ ocrError }}</div>
              <div v-if="ocrSuccess" class="ocr-success">
                ✅ OCR识别成功，请确认下方信息是否正确
              </div>
            </div>

            <div class="form-fields">
              <div
                v-for="field in currentFields"
                :key="field.key"
                class="form-field"
              >
                <label :for="field.key" class="field-label">
                  {{ field.label }}
                  <span v-if="field.required" class="required">*</span>
                </label>
                <input
                  v-if="editable"
                  :id="field.key"
                  v-model="formData[field.key]"
                  type="text"
                  class="field-input"
                  :class="{ 'has-error': fieldErrors[field.key] }"
                  :placeholder="field.placeholder"
                  @blur="validateField(field.key)"
                />
                <div v-else class="field-value">
                  {{ formData[field.key] || '-' }}
                </div>
                <div v-if="fieldErrors[field.key]" class="field-error">
                  {{ fieldErrors[field.key] }}
                </div>
              </div>
            </div>

            <div v-if="editable" class="form-actions">
              <button
                class="btn btn-primary"
                :disabled="isSubmitting || !canSubmit"
                @click="handleSubmit"
              >
                <span v-if="isSubmitting" class="btn-spinner"></span>
                {{ status === REJECTED ? '重新提交审核' : '提交审核' }}
              </button>
              <button
                v-if="status === NOT_SUBMITTED"
                class="btn btn-secondary"
                @click="resetForm"
              >
                重置
              </button>
            </div>
          </div>
        </div>

        <div class="sidebar">
          <div class="benefits-card">
            <h3>实名权益</h3>
            <div class="benefits-list">
              <div
                v-for="benefit in formattedBenefits.unlocked"
                :key="benefit.id"
                class="benefit-item unlocked"
              >
                <div class="benefit-icon">{{ benefit.icon }}</div>
                <div class="benefit-content">
                  <div class="benefit-title">{{ benefit.title }}</div>
                  <div class="benefit-desc">{{ benefit.description }}</div>
                </div>
                <div class="benefit-status">✓</div>
              </div>
            </div>
            <div v-if="formattedBenefits.locked.length > 0" class="locked-benefits">
              <div class="locked-title">完成认证后解锁</div>
              <div
                v-for="benefit in formattedBenefits.locked"
                :key="benefit.id"
                class="benefit-item locked"
              >
                <div class="benefit-icon">{{ benefit.icon }}</div>
                <div class="benefit-content">
                  <div class="benefit-title">{{ benefit.title }}</div>
                  <div class="benefit-desc">{{ benefit.description }}</div>
                </div>
                <div class="benefit-status">🔒</div>
              </div>
            </div>
          </div>

          <div v-if="status !== APPROVED" class="restrictions-card">
            <h3>未认证限制</h3>
            <div class="restrictions-list">
              <div
                v-for="restriction in restrictions"
                :key="restriction.id"
                class="restriction-item"
              >
                <div class="restriction-icon">{{ restriction.icon }}</div>
                <div class="restriction-content">
                  <div class="restriction-title">{{ restriction.title }}</div>
                  <div class="restriction-desc">{{ restriction.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  VERIFICATION_STATUS,
  CERTIFICATE_TYPES,
  STATUS_LABELS,
  CERTIFICATE_TYPE_LABELS
} from './constants.js'
import {
  getCertificateConfig,
  getCertificateFields,
  validateField as validateFieldRule,
  validateAllFields,
  getInitialFormData,
  CERTIFICATE_CONFIG
} from './certificateTypes.js'
import { simulateOCRRecognition, mergeOCRData } from './ocrService.js'
import {
  submitForReview,
  resubmitForReview,
  approveVerification,
  rejectVerification,
  isEditable,
  isViewOnly,
  canSubmit as canSubmitStatus,
  getStatusDescription,
  getStatusIcon,
  getStatusColor
} from './verificationState.js'
import { formatBenefitList, getRestrictionsByStatus } from './benefits.js'

const NOT_SUBMITTED = VERIFICATION_STATUS.NOT_SUBMITTED
const PENDING = VERIFICATION_STATUS.PENDING
const APPROVED = VERIFICATION_STATUS.APPROVED
const REJECTED = VERIFICATION_STATUS.REJECTED

const status = ref(NOT_SUBMITTED)
const selectedType = ref(CERTIFICATE_TYPES.ID_CARD)
const formData = ref(getInitialFormData(CERTIFICATE_TYPES.ID_CARD))
const fieldErrors = ref({})
const uploadedFile = ref(null)
const isOCRProcessing = ref(false)
const isSubmitting = ref(false)
const ocrError = ref('')
const ocrSuccess = ref(false)
const rejectReason = ref('')
const resubmitCount = ref(0)

const fileInput = ref(null)

const certificateTypesList = computed(() => {
  return Object.values(CERTIFICATE_CONFIG).map(config => ({
    type: config.type,
    label: config.label,
    description: config.description
  }))
})

const currentConfig = computed(() => getCertificateConfig(selectedType.value))
const currentFields = computed(() => getCertificateFields(selectedType.value))

const statusLabel = computed(() => STATUS_LABELS[status.value])
const statusDescription = computed(() => getStatusDescription(status.value))
const statusIcon = computed(() => getStatusIcon(status.value))
const statusColor = computed(() => getStatusColor(status.value))

const editable = computed(() => isEditable(status.value))
const viewOnly = computed(() => isViewOnly(status.value))
const canSubmit = computed(() => {
  if (!canSubmitStatus(status.value)) return false
  const { isValid } = validateAllFields(selectedType.value, formData.value)
  return isValid && uploadedFile.value !== null
})

const formattedBenefits = computed(() => formatBenefitList(status.value))
const restrictions = computed(() => getRestrictionsByStatus(status.value))

function getCertTypeIcon(type) {
  const icons = {
    [CERTIFICATE_TYPES.ID_CARD]: '🪪',
    [CERTIFICATE_TYPES.PASSPORT]: '🛂',
    [CERTIFICATE_TYPES.HK_MACAU_PASS]: '🎫'
  }
  return icons[type] || '📄'
}

function selectCertificateType(type) {
  selectedType.value = type
  formData.value = getInitialFormData(type)
  fieldErrors.value = {}
  uploadedFile.value = null
  ocrError.value = ''
  ocrSuccess.value = false
}

function triggerFileUpload() {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (file) {
    processFile(file)
  }
}

function handleFileDrop(event) {
  const file = event.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

async function processFile(file) {
  if (!file.type.startsWith('image/')) {
    ocrError.value = '请上传图片文件'
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    ocrError.value = '文件大小不能超过10MB'
    return
  }

  uploadedFile.value = file
  ocrError.value = ''
  ocrSuccess.value = false
  isOCRProcessing.value = true

  try {
    const result = await simulateOCRRecognition(selectedType.value, file, 0.15)
    if (result.success) {
      formData.value = mergeOCRData(formData.value, result.data)
      ocrSuccess.value = true
    } else {
      ocrError.value = result.error
    }
  } catch (e) {
    ocrError.value = '识别失败，请重试'
  } finally {
    isOCRProcessing.value = false
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function validateField(fieldKey) {
  const result = validateFieldRule(selectedType.value, fieldKey, formData.value[fieldKey])
  if (result.valid) {
    delete fieldErrors.value[fieldKey]
  } else {
    fieldErrors.value[fieldKey] = result.message
  }
  return result.valid
}

function validateAll() {
  const { isValid, errors } = validateAllFields(selectedType.value, formData.value)
  fieldErrors.value = errors
  return isValid
}

async function handleSubmit() {
  if (!validateAll()) {
    return
  }

  if (!uploadedFile.value) {
    ocrError.value = '请上传证件照片'
    return
  }

  isSubmitting.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1000))

    let result
    if (status.value === REJECTED) {
      result = resubmitForReview(status.value, resubmitCount.value)
      if (result.success) {
        resubmitCount.value = result.resubmitCount
      }
    } else {
      result = submitForReview(status.value)
    }

    if (result.success) {
      status.value = result.newStatus
      rejectReason.value = ''

      setTimeout(() => {
        const mockApproved = Math.random() > 0.3
        if (mockApproved) {
          const approveResult = approveVerification(status.value)
          if (approveResult.success) {
            status.value = approveResult.newStatus
          }
        } else {
          const reasons = [
            '证件照片模糊，请重新上传清晰的照片',
            '证件信息填写有误，请核对后重新提交',
            '证件类型与上传照片不匹配'
          ]
          const randomReason = reasons[Math.floor(Math.random() * reasons.length)]
          const rejectResult = rejectVerification(status.value, randomReason)
          if (rejectResult.success) {
            status.value = rejectResult.newStatus
            rejectReason.value = rejectResult.rejectReason
          }
        }
      }, 3000)
    }
  } catch (e) {
    ocrError.value = '提交失败，请重试'
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  formData.value = getInitialFormData(selectedType.value)
  fieldErrors.value = {}
  uploadedFile.value = null
  ocrError.value = ''
  ocrSuccess.value = false
}

watch(selectedType, (newType) => {
  formData.value = getInitialFormData(newType)
  fieldErrors.value = {}
})
</script>

<style scoped>
.id-verification {
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

.reject-reason-card {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.reject-icon {
  font-size: 24px;
}

.reject-title {
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 4px;
}

.reject-message {
  color: #991b1b;
  font-size: 14px;
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

.certificate-type-section,
.form-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.certificate-type-section h2,
.form-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #111827;
}

.certificate-types {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.cert-type-btn {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.cert-type-btn:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.cert-type-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.cert-type-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.cert-type-label {
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.cert-type-desc {
  font-size: 12px;
  color: #6b7280;
}

.upload-hint {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #f9fafb;
}

.upload-area.has-file {
  border-style: solid;
  border-color: #10b981;
  background: #f0fdf4;
}

.upload-area.uploading {
  pointer-events: none;
  opacity: 0.7;
}

.file-input {
  display: none;
}

.upload-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.upload-text {
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.upload-support {
  font-size: 12px;
  color: #9ca3af;
}

.uploading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.uploading-text {
  color: #3b82f6;
  font-weight: 500;
}

.file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preview-icon {
  font-size: 36px;
}

.file-name {
  font-weight: 500;
  color: #111827;
}

.file-size {
  font-size: 12px;
  color: #6b7280;
}

.change-btn {
  margin-top: 8px;
  padding: 6px 16px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.change-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.ocr-error {
  margin-top: 12px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 13px;
}

.ocr-success {
  margin-top: 12px;
  padding: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  color: #059669;
  font-size: 13px;
}

.form-fields {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.required {
  color: #ef4444;
  margin-left: 2px;
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

.field-value {
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 6px;
  color: #374151;
  font-size: 14px;
}

.field-error {
  font-size: 12px;
  color: #ef4444;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
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

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.benefits-card,
.restrictions-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.benefits-card h3,
.restrictions-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #111827;
}

.benefits-list,
.restrictions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.benefit-item,
.restriction-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.benefit-item.unlocked {
  background: #f0fdf4;
}

.benefit-item.locked {
  background: #f9fafb;
  opacity: 0.6;
}

.restriction-item {
  background: #fef2f2;
}

.benefit-icon,
.restriction-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.benefit-content,
.restriction-content {
  flex: 1;
  min-width: 0;
}

.benefit-title,
.restriction-title {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 2px;
}

.benefit-desc,
.restriction-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.benefit-status {
  flex-shrink: 0;
  font-size: 14px;
}

.benefit-item.unlocked .benefit-status {
  color: #10b981;
}

.locked-benefits {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.locked-title {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
  font-weight: 500;
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .certificate-types {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 375px) {
  .container {
    padding: 0 16px;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .status-card {
    padding: 16px;
    flex-direction: column;
    text-align: center;
  }

  .status-icon {
    font-size: 32px;
  }

  .certificate-type-section,
  .form-section {
    padding: 16px;
  }

  .upload-area {
    padding: 20px 16px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .benefits-card,
  .restrictions-card {
    padding: 16px;
  }
}
</style>
