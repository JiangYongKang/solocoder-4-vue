import { describe, it, expect, vi } from 'vitest'
import { CERTIFICATE_TYPES } from '../../identity-verification/constants.js'
import {
  generateOCRResult,
  generateOCRResultWithError,
  simulateOCRRecognition,
  mergeOCRData,
  getOCRConfidence
} from '../../identity-verification/ocrService.js'

describe('ocrService', () => {
  describe('generateOCRResult', () => {
    it('should generate valid OCR result for ID card', () => {
      const result = generateOCRResult(CERTIFICATE_TYPES.ID_CARD)
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(typeof result.data.name).toBe('string')
      expect(typeof result.data.idNumber).toBe('string')
      expect(typeof result.data.address).toBe('string')
      expect(typeof result.data.issueDate).toBe('string')
    })

    it('should generate valid OCR result for passport', () => {
      const result = generateOCRResult(CERTIFICATE_TYPES.PASSPORT)
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(typeof result.data.name).toBe('string')
      expect(typeof result.data.nameEn).toBe('string')
      expect(typeof result.data.passportNumber).toBe('string')
      expect(typeof result.data.nationality).toBe('string')
      expect(typeof result.data.expiryDate).toBe('string')
    })

    it('should generate valid OCR result for HK/Macau pass', () => {
      const result = generateOCRResult(CERTIFICATE_TYPES.HK_MACAU_PASS)
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(typeof result.data.name).toBe('string')
      expect(typeof result.data.passNumber).toBe('string')
      expect(typeof result.data.issueAuthority).toBe('string')
      expect(typeof result.data.validityPeriod).toBe('string')
    })

    it('should return error for invalid certificate type', () => {
      const result = generateOCRResult('invalid_type')
      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
      expect(result.error).toBe('不支持的证件类型')
    })
  })

  describe('generateOCRResultWithError', () => {
    it('should return error result', () => {
      const result = generateOCRResultWithError()
      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
      expect(typeof result.error).toBe('string')
      expect(result.error.length).toBeGreaterThan(0)
    })

    it('should return one of the predefined error messages', () => {
      const errorMessages = [
        '图片模糊，请上传清晰的证件照片',
        '证件类型不匹配，请选择正确的证件类型',
        '检测到反光，请重新拍摄',
        '证件信息不完整，请确保照片包含全部信息'
      ]

      const results = Array.from({ length: 20 }, () => generateOCRResultWithError())
      const errors = results.map(r => r.error)

      for (const error of errors) {
        expect(errorMessages).toContain(error)
      }
    })
  })

  describe('simulateOCRRecognition', () => {
    it('should return error when no file provided', async () => {
      const result = await simulateOCRRecognition(CERTIFICATE_TYPES.ID_CARD, null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('请上传证件照片')
    })

    it('should simulate OCR recognition successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await simulateOCRRecognition(CERTIFICATE_TYPES.ID_CARD, mockFile, 0)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.name).toBeDefined()
    })

    it('should simulate OCR recognition with error when errorRate is 1', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await simulateOCRRecognition(CERTIFICATE_TYPES.ID_CARD, mockFile, 1)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should take at least 1500ms to simulate recognition', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const startTime = Date.now()

      await simulateOCRRecognition(CERTIFICATE_TYPES.ID_CARD, mockFile, 0)

      const duration = Date.now() - startTime
      expect(duration).toBeGreaterThanOrEqual(1500)
    })
  })

  describe('mergeOCRData', () => {
    it('should merge OCR data with original data', () => {
      const original = { name: '', idNumber: '', address: '' }
      const ocrData = { name: '张三', idNumber: '110101199003071234' }

      const merged = mergeOCRData(original, ocrData)

      expect(merged.name).toBe('张三')
      expect(merged.idNumber).toBe('110101199003071234')
      expect(merged.address).toBe('')
    })

    it('should overwrite original data with OCR data', () => {
      const original = { name: '旧名', idNumber: 'old_id' }
      const ocrData = { name: '新名', idNumber: 'new_id' }

      const merged = mergeOCRData(original, ocrData)

      expect(merged.name).toBe('新名')
      expect(merged.idNumber).toBe('new_id')
    })

    it('should not mutate original objects', () => {
      const original = { name: '原姓名' }
      const ocrData = { name: 'OCR姓名' }

      const merged = mergeOCRData(original, ocrData)

      expect(original.name).toBe('原姓名')
      expect(ocrData.name).toBe('OCR姓名')
      expect(merged.name).toBe('OCR姓名')
    })
  })

  describe('getOCRConfidence', () => {
    it('should return confidence between 0 and 1', () => {
      const ocrData = {
        name: '张三',
        idNumber: '110101199003071234',
        address: '北京市东城区XX号'
      }

      const confidence = getOCRConfidence(CERTIFICATE_TYPES.ID_CARD, ocrData)

      expect(confidence).toBeGreaterThanOrEqual(0)
      expect(confidence).toBeLessThanOrEqual(1)
    })

    it('should return higher confidence for complete data', () => {
      const completeData = { name: '张三', idNumber: '110101199003071234' }
      const incompleteData = { name: '', idNumber: '110101199003071234' }

      const confidences1 = Array.from({ length: 100 }, () =>
        getOCRConfidence(CERTIFICATE_TYPES.ID_CARD, completeData)
      )
      const confidences2 = Array.from({ length: 100 }, () =>
        getOCRConfidence(CERTIFICATE_TYPES.ID_CARD, incompleteData)
      )

      const avg1 = confidences1.reduce((a, b) => a + b, 0) / confidences1.length
      const avg2 = confidences2.reduce((a, b) => a + b, 0) / confidences2.length

      expect(avg1).toBeGreaterThan(avg2)
    })
  })
})
