import { describe, it, expect } from 'vitest'
import {
  DEVICE_AUTH_STATUS,
  DEVICE_AUTH_STATUS_LABELS,
  RISK_LEVELS,
  RISK_LEVEL_LABELS,
  DEVICE_TYPES,
  DEVICE_TYPE_LABELS,
  DEFAULT_QR_TIMEOUT,
  MOCK_DEVICE_INFO,
  MOCK_RISK_DEVICE_INFO,
  STATUS_DESCRIPTIONS,
  STATUS_ICONS,
  STATUS_COLORS
} from '../../device-authorization/constants.js'

describe('device-authorization constants', () => {
  describe('DEVICE_AUTH_STATUS', () => {
    it('should have all 6 required status values', () => {
      expect(DEVICE_AUTH_STATUS.PENDING_SCAN).toBe('pending_scan')
      expect(DEVICE_AUTH_STATUS.SCANNED_PENDING).toBe('scanned_pending')
      expect(DEVICE_AUTH_STATUS.AUTHORIZED).toBe('authorized')
      expect(DEVICE_AUTH_STATUS.REJECTED).toBe('rejected')
      expect(DEVICE_AUTH_STATUS.TIMEOUT).toBe('timeout')
      expect(DEVICE_AUTH_STATUS.RISK).toBe('risk')
    })

    it('should have exactly 6 status values', () => {
      expect(Object.keys(DEVICE_AUTH_STATUS)).toHaveLength(6)
    })

    it('should not have duplicate status values', () => {
      const values = Object.values(DEVICE_AUTH_STATUS)
      const uniqueValues = new Set(values)
      expect(uniqueValues.size).toBe(values.length)
    })
  })

  describe('DEVICE_AUTH_STATUS_LABELS', () => {
    it('should have correct labels for all statuses', () => {
      expect(DEVICE_AUTH_STATUS_LABELS[DEVICE_AUTH_STATUS.PENDING_SCAN]).toBe('待扫描')
      expect(DEVICE_AUTH_STATUS_LABELS[DEVICE_AUTH_STATUS.SCANNED_PENDING]).toBe('待确认')
      expect(DEVICE_AUTH_STATUS_LABELS[DEVICE_AUTH_STATUS.AUTHORIZED]).toBe('授权成功')
      expect(DEVICE_AUTH_STATUS_LABELS[DEVICE_AUTH_STATUS.REJECTED]).toBe('已拒绝')
      expect(DEVICE_AUTH_STATUS_LABELS[DEVICE_AUTH_STATUS.TIMEOUT]).toBe('已超时')
      expect(DEVICE_AUTH_STATUS_LABELS[DEVICE_AUTH_STATUS.RISK]).toBe('异常风险')
    })

    it('should have labels for every status', () => {
      const statusKeys = Object.keys(DEVICE_AUTH_STATUS)
      const labelKeys = Object.keys(DEVICE_AUTH_STATUS_LABELS)
      expect(labelKeys).toEqual(statusKeys.map(k => DEVICE_AUTH_STATUS[k]))
    })
  })

  describe('RISK_LEVELS', () => {
    it('should have all 3 risk levels', () => {
      expect(RISK_LEVELS.LOW).toBe('low')
      expect(RISK_LEVELS.MEDIUM).toBe('medium')
      expect(RISK_LEVELS.HIGH).toBe('high')
    })

    it('should have exactly 3 risk levels', () => {
      expect(Object.keys(RISK_LEVELS)).toHaveLength(3)
    })
  })

  describe('RISK_LEVEL_LABELS', () => {
    it('should have correct labels for all risk levels', () => {
      expect(RISK_LEVEL_LABELS[RISK_LEVELS.LOW]).toBe('低风险')
      expect(RISK_LEVEL_LABELS[RISK_LEVELS.MEDIUM]).toBe('中风险')
      expect(RISK_LEVEL_LABELS[RISK_LEVELS.HIGH]).toBe('高风险')
    })
  })

  describe('DEVICE_TYPES', () => {
    it('should have all 4 device types', () => {
      expect(DEVICE_TYPES.DESKTOP).toBe('desktop')
      expect(DEVICE_TYPES.MOBILE).toBe('mobile')
      expect(DEVICE_TYPES.TABLET).toBe('tablet')
      expect(DEVICE_TYPES.UNKNOWN).toBe('unknown')
    })

    it('should have exactly 4 device types', () => {
      expect(Object.keys(DEVICE_TYPES)).toHaveLength(4)
    })
  })

  describe('DEVICE_TYPE_LABELS', () => {
    it('should have correct labels for all device types', () => {
      expect(DEVICE_TYPE_LABELS[DEVICE_TYPES.DESKTOP]).toBe('桌面设备')
      expect(DEVICE_TYPE_LABELS[DEVICE_TYPES.MOBILE]).toBe('移动设备')
      expect(DEVICE_TYPE_LABELS[DEVICE_TYPES.TABLET]).toBe('平板设备')
      expect(DEVICE_TYPE_LABELS[DEVICE_TYPES.UNKNOWN]).toBe('未知设备')
    })
  })

  describe('DEFAULT_QR_TIMEOUT', () => {
    it('should be 120 seconds', () => {
      expect(DEFAULT_QR_TIMEOUT).toBe(120)
    })

    it('should be a positive number', () => {
      expect(typeof DEFAULT_QR_TIMEOUT).toBe('number')
      expect(DEFAULT_QR_TIMEOUT).toBeGreaterThan(0)
    })
  })

  describe('MOCK_DEVICE_INFO', () => {
    it('should have all required device info fields', () => {
      expect(MOCK_DEVICE_INFO.deviceName).toBeDefined()
      expect(MOCK_DEVICE_INFO.deviceType).toBeDefined()
      expect(MOCK_DEVICE_INFO.osName).toBeDefined()
      expect(MOCK_DEVICE_INFO.osVersion).toBeDefined()
      expect(MOCK_DEVICE_INFO.browserName).toBeDefined()
      expect(MOCK_DEVICE_INFO.browserVersion).toBeDefined()
      expect(MOCK_DEVICE_INFO.ipAddress).toBeDefined()
      expect(MOCK_DEVICE_INFO.loginLocation).toBeDefined()
      expect(MOCK_DEVICE_INFO.approximateLocation).toBeDefined()
    })

    it('should have valid device type', () => {
      const validTypes = Object.values(DEVICE_TYPES)
      expect(validTypes).toContain(MOCK_DEVICE_INFO.deviceType)
    })

    it('should not have risk level on normal device', () => {
      expect(MOCK_DEVICE_INFO.riskLevel).toBeUndefined()
      expect(MOCK_DEVICE_INFO.riskReasons).toBeUndefined()
    })

    it('should have string values for all fields', () => {
      Object.values(MOCK_DEVICE_INFO).forEach(value => {
        expect(typeof value).toBe('string')
      })
    })
  })

  describe('MOCK_RISK_DEVICE_INFO', () => {
    it('should have all required device info fields plus risk data', () => {
      expect(MOCK_RISK_DEVICE_INFO.deviceName).toBeDefined()
      expect(MOCK_RISK_DEVICE_INFO.deviceType).toBeDefined()
      expect(MOCK_RISK_DEVICE_INFO.riskLevel).toBeDefined()
      expect(MOCK_RISK_DEVICE_INFO.riskReasons).toBeDefined()
    })

    it('should have high risk level', () => {
      expect(MOCK_RISK_DEVICE_INFO.riskLevel).toBe(RISK_LEVELS.HIGH)
    })

    it('should have risk reasons array with at least one item', () => {
      expect(Array.isArray(MOCK_RISK_DEVICE_INFO.riskReasons)).toBe(true)
      expect(MOCK_RISK_DEVICE_INFO.riskReasons.length).toBeGreaterThanOrEqual(1)
    })

    it('should have valid unknown device type', () => {
      expect(MOCK_RISK_DEVICE_INFO.deviceType).toBe(DEVICE_TYPES.UNKNOWN)
    })

    it('should have non-empty risk reason strings', () => {
      MOCK_RISK_DEVICE_INFO.riskReasons.forEach(reason => {
        expect(typeof reason).toBe('string')
        expect(reason.length).toBeGreaterThan(0)
      })
    })
  })

  describe('STATUS_DESCRIPTIONS', () => {
    it('should have descriptions for all statuses', () => {
      const statuses = Object.values(DEVICE_AUTH_STATUS)
      statuses.forEach(status => {
        expect(STATUS_DESCRIPTIONS[status]).toBeDefined()
        expect(typeof STATUS_DESCRIPTIONS[status]).toBe('string')
        expect(STATUS_DESCRIPTIONS[status].length).toBeGreaterThan(0)
      })
    })

    it('should have timeout description mentioning expiration', () => {
      expect(STATUS_DESCRIPTIONS[DEVICE_AUTH_STATUS.TIMEOUT]).toContain('过期')
    })

    it('should have risk description mentioning risk', () => {
      expect(STATUS_DESCRIPTIONS[DEVICE_AUTH_STATUS.RISK]).toContain('风险')
    })
  })

  describe('STATUS_ICONS', () => {
    it('should have icons for all statuses', () => {
      const statuses = Object.values(DEVICE_AUTH_STATUS)
      statuses.forEach(status => {
        expect(STATUS_ICONS[status]).toBeDefined()
        expect(typeof STATUS_ICONS[status]).toBe('string')
      })
    })

    it('should have unique icons per status (not all the same)', () => {
      const icons = Object.values(STATUS_ICONS)
      const uniqueIcons = new Set(icons)
      expect(uniqueIcons.size).toBeGreaterThan(1)
    })
  })

  describe('STATUS_COLORS', () => {
    it('should have colors for all statuses', () => {
      const statuses = Object.values(DEVICE_AUTH_STATUS)
      statuses.forEach(status => {
        expect(STATUS_COLORS[status]).toBeDefined()
        expect(typeof STATUS_COLORS[status]).toBe('string')
        expect(STATUS_COLORS[status].startsWith('#')).toBe(true)
      })
    })

    it('should use red for timeout and risk statuses', () => {
      expect(STATUS_COLORS[DEVICE_AUTH_STATUS.TIMEOUT]).toBe('#ef4444')
      expect(STATUS_COLORS[DEVICE_AUTH_STATUS.RISK]).toBe('#dc2626')
    })

    it('should use green for authorized status', () => {
      expect(STATUS_COLORS[DEVICE_AUTH_STATUS.AUTHORIZED]).toBe('#10b981')
    })
  })
})
