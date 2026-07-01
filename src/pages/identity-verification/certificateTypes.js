import { CERTIFICATE_TYPES } from './constants.js'

const ID_CARD_FIELDS = [
  {
    key: 'name',
    label: '姓名',
    placeholder: '请输入真实姓名',
    required: true,
    pattern: /^[\u4e00-\u9fa5]{2,10}$/,
    errorMessage: '请输入2-10个中文字符'
  },
  {
    key: 'idNumber',
    label: '身份证号',
    placeholder: '请输入18位身份证号码',
    required: true,
    pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
    errorMessage: '请输入有效的18位身份证号码'
  },
  {
    key: 'address',
    label: '住址',
    placeholder: '请输入身份证上的住址',
    required: true,
    pattern: /^[\u4e00-\u9fa5A-Za-z0-9]{5,100}$/,
    errorMessage: '请输入5-100个字符的住址'
  },
  {
    key: 'issueDate',
    label: '签发日期',
    placeholder: 'YYYY-MM-DD',
    required: true,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    errorMessage: '请输入正确的日期格式'
  }
]

const PASSPORT_FIELDS = [
  {
    key: 'name',
    label: '姓名（中文）',
    placeholder: '请输入真实姓名',
    required: true,
    pattern: /^[\u4e00-\u9fa5]{2,10}$/,
    errorMessage: '请输入2-10个中文字符'
  },
  {
    key: 'nameEn',
    label: '姓名（英文）',
    placeholder: '请输入拼音姓名，如 ZHANG SAN',
    required: true,
    pattern: /^[A-Z\s]{2,50}$/,
    errorMessage: '请输入大写英文字母，最多50个字符'
  },
  {
    key: 'passportNumber',
    label: '护照号码',
    placeholder: '请输入护照号码',
    required: true,
    pattern: /^[EeGg]\d{8}$/,
    errorMessage: '请输入有效的护照号码（E/G开头+8位数字）'
  },
  {
    key: 'nationality',
    label: '国籍',
    placeholder: '请输入国籍',
    required: true,
    pattern: /^[\u4e00-\u9fa5]{2,20}$/,
    errorMessage: '请输入2-20个中文字符'
  },
  {
    key: 'expiryDate',
    label: '有效期至',
    placeholder: 'YYYY-MM-DD',
    required: true,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    errorMessage: '请输入正确的日期格式'
  }
]

const HK_MACAU_PASS_FIELDS = [
  {
    key: 'name',
    label: '姓名',
    placeholder: '请输入真实姓名',
    required: true,
    pattern: /^[\u4e00-\u9fa5]{2,10}$/,
    errorMessage: '请输入2-10个中文字符'
  },
  {
    key: 'passNumber',
    label: '通行证号码',
    placeholder: '请输入通行证号码',
    required: true,
    pattern: /^[CcWw]\d{8}$/,
    errorMessage: '请输入有效的通行证号码（C/W开头+8位数字）'
  },
  {
    key: 'issueAuthority',
    label: '签发机关',
    placeholder: '请输入签发机关',
    required: true,
    pattern: /^[\u4e00-\u9fa5]{5,50}$/,
    errorMessage: '请输入5-50个中文字符'
  },
  {
    key: 'validityPeriod',
    label: '有效期',
    placeholder: '如：5年',
    required: true,
    pattern: /^[\u4e00-\u9fa5\d]{2,10}$/,
    errorMessage: '请输入有效的有效期描述'
  }
]

export const CERTIFICATE_CONFIG = {
  [CERTIFICATE_TYPES.ID_CARD]: {
    type: CERTIFICATE_TYPES.ID_CARD,
    label: '身份证',
    description: '第二代居民身份证',
    uploadHint: '请上传身份证正反面照片',
    fields: ID_CARD_FIELDS
  },
  [CERTIFICATE_TYPES.PASSPORT]: {
    type: CERTIFICATE_TYPES.PASSPORT,
    label: '护照',
    description: '中华人民共和国护照',
    uploadHint: '请上传护照个人信息页照片',
    fields: PASSPORT_FIELDS
  },
  [CERTIFICATE_TYPES.HK_MACAU_PASS]: {
    type: CERTIFICATE_TYPES.HK_MACAU_PASS,
    label: '港澳通行证',
    description: '往来港澳通行证',
    uploadHint: '请上传通行证个人信息页照片',
    fields: HK_MACAU_PASS_FIELDS
  }
}

export function getCertificateConfig(type) {
  return CERTIFICATE_CONFIG[type] || null
}

export function getCertificateFields(type) {
  const config = getCertificateConfig(type)
  return config ? config.fields : []
}

export function validateField(type, fieldKey, value) {
  const fields = getCertificateFields(type)
  const field = fields.find(f => f.key === fieldKey)

  if (!field) {
    return { valid: true, message: '' }
  }

  if (field.required && (value === undefined || value === null || value === '')) {
    return { valid: false, message: `${field.label}不能为空` }
  }

  if (value && field.pattern && !field.pattern.test(value)) {
    return { valid: false, message: field.errorMessage }
  }

  return { valid: true, message: '' }
}

export function validateAllFields(type, formData) {
  const fields = getCertificateFields(type)
  const errors = {}
  let isValid = true

  for (const field of fields) {
    const result = validateField(type, field.key, formData[field.key])
    if (!result.valid) {
      errors[field.key] = result.message
      isValid = false
    }
  }

  return { isValid, errors }
}

export function getInitialFormData(type) {
  const fields = getCertificateFields(type)
  const formData = {}
  for (const field of fields) {
    formData[field.key] = ''
  }
  return formData
}
