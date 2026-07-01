import { describe, it, expect } from 'vitest'
import { CERTIFICATE_TYPES } from '../../identity-verification/constants.js'
import {
  CERTIFICATE_CONFIG,
  getCertificateConfig,
  getCertificateFields,
  validateField,
  validateAllFields,
  getInitialFormData
} from '../../identity-verification/certificateTypes.js'

describe('certificateTypes', () => {
  describe('CERTIFICATE_CONFIG', () => {
    it('should have config for all certificate types', () => {
      expect(CERTIFICATE_CONFIG[CERTIFICATE_TYPES.ID_CARD]).toBeDefined()
      expect(CERTIFICATE_CONFIG[CERTIFICATE_TYPES.PASSPORT]).toBeDefined()
      expect(CERTIFICATE_CONFIG[CERTIFICATE_TYPES.HK_MACAU_PASS]).toBeDefined()
    })

    it('should have correct structure for ID card config', () => {
      const config = CERTIFICATE_CONFIG[CERTIFICATE_TYPES.ID_CARD]
      expect(config.type).toBe(CERTIFICATE_TYPES.ID_CARD)
      expect(config.label).toBe('身份证')
      expect(config.description).toBe('第二代居民身份证')
      expect(config.uploadHint).toBe('请上传身份证正反面照片')
      expect(Array.isArray(config.fields)).toBe(true)
      expect(config.fields.length).toBeGreaterThan(0)
    })

    it('should have correct structure for passport config', () => {
      const config = CERTIFICATE_CONFIG[CERTIFICATE_TYPES.PASSPORT]
      expect(config.type).toBe(CERTIFICATE_TYPES.PASSPORT)
      expect(config.label).toBe('护照')
      expect(config.fields.length).toBeGreaterThan(0)
    })

    it('should have correct structure for HK/Macau pass config', () => {
      const config = CERTIFICATE_CONFIG[CERTIFICATE_TYPES.HK_MACAU_PASS]
      expect(config.type).toBe(CERTIFICATE_TYPES.HK_MACAU_PASS)
      expect(config.label).toBe('港澳通行证')
      expect(config.fields.length).toBeGreaterThan(0)
    })
  })

  describe('getCertificateConfig', () => {
    it('should return correct config for valid type', () => {
      const config = getCertificateConfig(CERTIFICATE_TYPES.ID_CARD)
      expect(config).toBe(CERTIFICATE_CONFIG[CERTIFICATE_TYPES.ID_CARD])
    })

    it('should return null for invalid type', () => {
      const config = getCertificateConfig('invalid_type')
      expect(config).toBeNull()
    })
  })

  describe('getCertificateFields', () => {
    it('should return fields for ID card', () => {
      const fields = getCertificateFields(CERTIFICATE_TYPES.ID_CARD)
      expect(Array.isArray(fields)).toBe(true)
      expect(fields.length).toBe(4)
      expect(fields[0].key).toBe('name')
      expect(fields[1].key).toBe('idNumber')
      expect(fields[2].key).toBe('address')
      expect(fields[3].key).toBe('issueDate')
    })

    it('should return fields for passport', () => {
      const fields = getCertificateFields(CERTIFICATE_TYPES.PASSPORT)
      expect(Array.isArray(fields)).toBe(true)
      expect(fields.length).toBe(5)
      expect(fields[0].key).toBe('name')
      expect(fields[1].key).toBe('nameEn')
      expect(fields[2].key).toBe('passportNumber')
      expect(fields[3].key).toBe('nationality')
      expect(fields[4].key).toBe('expiryDate')
    })

    it('should return fields for HK/Macau pass', () => {
      const fields = getCertificateFields(CERTIFICATE_TYPES.HK_MACAU_PASS)
      expect(Array.isArray(fields)).toBe(true)
      expect(fields.length).toBe(4)
      expect(fields[0].key).toBe('name')
      expect(fields[1].key).toBe('passNumber')
      expect(fields[2].key).toBe('issueAuthority')
      expect(fields[3].key).toBe('validityPeriod')
    })

    it('should return empty array for invalid type', () => {
      const fields = getCertificateFields('invalid_type')
      expect(fields).toEqual([])
    })
  })

  describe('validateField', () => {
    describe('ID card fields', () => {
      it('should validate name field correctly', () => {
        const type = CERTIFICATE_TYPES.ID_CARD

        expect(validateField(type, 'name', '张三').valid).toBe(true)
        expect(validateField(type, 'name', '').valid).toBe(false)
        expect(validateField(type, 'name', '张').valid).toBe(false)
        expect(validateField(type, 'name', 'Zhang San').valid).toBe(false)
        expect(validateField(type, 'name', '欧阳锋').valid).toBe(true)
      })

      it('should validate idNumber field correctly', () => {
        const type = CERTIFICATE_TYPES.ID_CARD

        expect(validateField(type, 'idNumber', '110101199003071234').valid).toBe(true)
        expect(validateField(type, 'idNumber', '').valid).toBe(false)
        expect(validateField(type, 'idNumber', '123456').valid).toBe(false)
        expect(validateField(type, 'idNumber', '11010119900307123X').valid).toBe(true)
        expect(validateField(type, 'idNumber', '11010119900307123x').valid).toBe(true)
      })

      it('should validate address field correctly', () => {
        const type = CERTIFICATE_TYPES.ID_CARD

        expect(validateField(type, 'address', '北京市东城区XX号').valid).toBe(true)
        expect(validateField(type, 'address', '').valid).toBe(false)
        expect(validateField(type, 'address', '太短').valid).toBe(false)
      })

      it('should validate issueDate field correctly', () => {
        const type = CERTIFICATE_TYPES.ID_CARD

        expect(validateField(type, 'issueDate', '2020-01-15').valid).toBe(true)
        expect(validateField(type, 'issueDate', '').valid).toBe(false)
        expect(validateField(type, 'issueDate', '2020/01/15').valid).toBe(false)
      })
    })

    describe('Passport fields', () => {
      it('should validate nameEn field correctly', () => {
        const type = CERTIFICATE_TYPES.PASSPORT

        expect(validateField(type, 'nameEn', 'ZHANG SAN').valid).toBe(true)
        expect(validateField(type, 'nameEn', '').valid).toBe(false)
        expect(validateField(type, 'nameEn', 'zhang san').valid).toBe(false)
      })

      it('should validate passportNumber field correctly', () => {
        const type = CERTIFICATE_TYPES.PASSPORT

        expect(validateField(type, 'passportNumber', 'E12345678').valid).toBe(true)
        expect(validateField(type, 'passportNumber', 'G87654321').valid).toBe(true)
        expect(validateField(type, 'passportNumber', '').valid).toBe(false)
        expect(validateField(type, 'passportNumber', '12345678').valid).toBe(false)
      })
    })

    describe('HK/Macau pass fields', () => {
      it('should validate passNumber field correctly', () => {
        const type = CERTIFICATE_TYPES.HK_MACAU_PASS

        expect(validateField(type, 'passNumber', 'C12345678').valid).toBe(true)
        expect(validateField(type, 'passNumber', 'W87654321').valid).toBe(true)
        expect(validateField(type, 'passNumber', '').valid).toBe(false)
        expect(validateField(type, 'passNumber', '12345678').valid).toBe(false)
      })
    })

    it('should return valid for non-existent field', () => {
      const result = validateField(CERTIFICATE_TYPES.ID_CARD, 'nonExistentField', 'value')
      expect(result.valid).toBe(true)
    })
  })

  describe('validateAllFields', () => {
    it('should validate all ID card fields correctly', () => {
      const type = CERTIFICATE_TYPES.ID_CARD

      const validForm = {
        name: '张三',
        idNumber: '110101199003071234',
        address: '北京市东城区建国门街道XX号',
        issueDate: '2020-01-15'
      }
      expect(validateAllFields(type, validForm).isValid).toBe(true)
      expect(Object.keys(validateAllFields(type, validForm).errors)).toHaveLength(0)

      const invalidForm = {
        name: '',
        idNumber: 'invalid',
        address: '',
        issueDate: ''
      }
      const result = validateAllFields(type, invalidForm)
      expect(result.isValid).toBe(false)
      expect(Object.keys(result.errors)).toHaveLength(4)
    })

    it('should validate all passport fields correctly', () => {
      const type = CERTIFICATE_TYPES.PASSPORT

      const validForm = {
        name: '王五',
        nameEn: 'WANG WU',
        passportNumber: 'E12345678',
        nationality: '中国',
        expiryDate: '2028-06-30'
      }
      expect(validateAllFields(type, validForm).isValid).toBe(true)
    })
  })

  describe('getInitialFormData', () => {
    it('should return empty form data for ID card', () => {
      const formData = getInitialFormData(CERTIFICATE_TYPES.ID_CARD)
      expect(formData).toEqual({
        name: '',
        idNumber: '',
        address: '',
        issueDate: ''
      })
    })

    it('should return empty form data for passport', () => {
      const formData = getInitialFormData(CERTIFICATE_TYPES.PASSPORT)
      expect(formData).toEqual({
        name: '',
        nameEn: '',
        passportNumber: '',
        nationality: '',
        expiryDate: ''
      })
    })

    it('should return empty form data for HK/Macau pass', () => {
      const formData = getInitialFormData(CERTIFICATE_TYPES.HK_MACAU_PASS)
      expect(formData).toEqual({
        name: '',
        passNumber: '',
        issueAuthority: '',
        validityPeriod: ''
      })
    })
  })
})
