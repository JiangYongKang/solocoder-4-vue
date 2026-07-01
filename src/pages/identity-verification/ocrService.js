import { CERTIFICATE_TYPES } from './constants.js'

const ID_CARD_OCR_TEMPLATES = [
  {
    name: '张三',
    idNumber: '110101199003071234',
    address: '北京市东城区建国门街道XX号XX小区1号楼101室',
    issueDate: '2018-05-20'
  },
  {
    name: '李四',
    idNumber: '310101198512155678',
    address: '上海市黄浦区南京东路街道XX号XX大厦20楼2001室',
    issueDate: '2020-03-15'
  }
]

const PASSPORT_OCR_TEMPLATES = [
  {
    name: '王五',
    nameEn: 'WANG WU',
    passportNumber: 'E12345678',
    nationality: '中国',
    expiryDate: '2028-06-30'
  },
  {
    name: '赵六',
    nameEn: 'ZHAO LIU',
    passportNumber: 'G87654321',
    nationality: '中国',
    expiryDate: '2030-12-25'
  }
]

const HK_MACAU_PASS_OCR_TEMPLATES = [
  {
    name: '孙七',
    passNumber: 'C12345678',
    issueAuthority: '广东省公安厅出入境管理局',
    validityPeriod: '10年'
  },
  {
    name: '周八',
    passNumber: 'W87654321',
    issueAuthority: '北京市公安局出入境管理局',
    validityPeriod: '5年'
  }
]

const OCR_TEMPLATES = {
  [CERTIFICATE_TYPES.ID_CARD]: ID_CARD_OCR_TEMPLATES,
  [CERTIFICATE_TYPES.PASSPORT]: PASSPORT_OCR_TEMPLATES,
  [CERTIFICATE_TYPES.HK_MACAU_PASS]: HK_MACAU_PASS_OCR_TEMPLATES
}

const OCR_ERROR_MESSAGES = [
  '图片模糊，请上传清晰的证件照片',
  '证件类型不匹配，请选择正确的证件类型',
  '检测到反光，请重新拍摄',
  '证件信息不完整，请确保照片包含全部信息'
]

export function generateOCRResult(type) {
  const templates = OCR_TEMPLATES[type]
  if (!templates || templates.length === 0) {
    return {
      success: false,
      data: null,
      error: '不支持的证件类型'
    }
  }

  const randomIndex = Math.floor(Math.random() * templates.length)
  const template = templates[randomIndex]

  return {
    success: true,
    data: { ...template },
    error: null
  }
}

export function generateOCRResultWithError() {
  const randomIndex = Math.floor(Math.random() * OCR_ERROR_MESSAGES.length)
  return {
    success: false,
    data: null,
    error: OCR_ERROR_MESSAGES[randomIndex]
  }
}

export async function simulateOCRRecognition(type, file, errorRate = 0.1) {
  if (!file) {
    return {
      success: false,
      data: null,
      error: '请上传证件照片'
    }
  }

  await new Promise(resolve => setTimeout(resolve, 1500))

  if (Math.random() < errorRate) {
    return generateOCRResultWithError()
  }

  return generateOCRResult(type)
}

export function mergeOCRData(originalData, ocrData) {
  return {
    ...originalData,
    ...ocrData
  }
}

export function getOCRConfidence(type, ocrData) {
  const fields = Object.keys(ocrData)
  let totalConfidence = 0

  for (const field of fields) {
    const value = ocrData[field]
    if (value && value.length > 0) {
      totalConfidence += 0.7 + Math.random() * 0.3
    } else {
      totalConfidence += 0.3 + Math.random() * 0.3
    }
  }

  return Math.min(1, totalConfidence / fields.length)
}
