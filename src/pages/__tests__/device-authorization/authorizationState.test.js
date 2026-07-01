import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    canConfirm,
    canRefresh,
    canReject,
    canTransition,
    confirmAuthorization,
    createAuthorizationManager,
    createCountdownManager,
    generateRequestId,
    getHighRiskAdvice,
    getNextPossibleTransitions,
    getRiskLevelColor,
    getStatusColor,
    getStatusDescription,
    getStatusIcon,
    hasDeviceInfo,
    isTerminalStatus,
    markAsRisk,
    markAsScanned,
    markAsTimeout,
    refreshAuthorization,
    rejectAuthorization,
    shouldShowRiskWarning,
    transitionStatus
} from '../../device-authorization/authorizationState.js'
import { DEFAULT_QR_TIMEOUT, DEVICE_AUTH_STATUS, RISK_LEVELS } from '../../device-authorization/constants.js'

const PENDING_SCAN = DEVICE_AUTH_STATUS.PENDING_SCAN
const SCANNED_PENDING = DEVICE_AUTH_STATUS.SCANNED_PENDING
const AUTHORIZED = DEVICE_AUTH_STATUS.AUTHORIZED
const REJECTED = DEVICE_AUTH_STATUS.REJECTED
const TIMEOUT = DEVICE_AUTH_STATUS.TIMEOUT
const RISK = DEVICE_AUTH_STATUS.RISK

describe('authorizationState - 状态流转', () => {
  describe('VALID_TRANSITIONS 状态机一致性', () => {
    it('should allow PENDING_SCAN -> PENDING_SCAN (self-transition for refresh)', () => {
      expect(canTransition(PENDING_SCAN, PENDING_SCAN)).toBe(true)
    })

    it('should allow RISK -> RISK (self-transition for scan with risk)', () => {
      expect(canTransition(RISK, RISK)).toBe(true)
    })
  })

  describe('canTransition', () => {
    it('should allow transition from PENDING_SCAN to SCANNED_PENDING', () => {
      expect(canTransition(PENDING_SCAN, SCANNED_PENDING)).toBe(true)
    })

    it('should allow transition from PENDING_SCAN to TIMEOUT', () => {
      expect(canTransition(PENDING_SCAN, TIMEOUT)).toBe(true)
    })

    it('should allow transition from PENDING_SCAN to RISK', () => {
      expect(canTransition(PENDING_SCAN, RISK)).toBe(true)
    })

    it('should allow transition from SCANNED_PENDING to AUTHORIZED', () => {
      expect(canTransition(SCANNED_PENDING, AUTHORIZED)).toBe(true)
    })

    it('should allow transition from SCANNED_PENDING to REJECTED', () => {
      expect(canTransition(SCANNED_PENDING, REJECTED)).toBe(true)
    })

    it('should allow transition from SCANNED_PENDING to TIMEOUT', () => {
      expect(canTransition(SCANNED_PENDING, TIMEOUT)).toBe(true)
    })

    it('should allow transition from SCANNED_PENDING to RISK', () => {
      expect(canTransition(SCANNED_PENDING, RISK)).toBe(true)
    })

    it('should allow transition from RISK to AUTHORIZED', () => {
      expect(canTransition(RISK, AUTHORIZED)).toBe(true)
    })

    it('should allow transition from RISK to REJECTED', () => {
      expect(canTransition(RISK, REJECTED)).toBe(true)
    })

    it('should allow transition from RISK to TIMEOUT', () => {
      expect(canTransition(RISK, TIMEOUT)).toBe(true)
    })

    it('should allow transition from TIMEOUT to PENDING_SCAN (refresh)', () => {
      expect(canTransition(TIMEOUT, PENDING_SCAN)).toBe(true)
    })

    it('should not allow transition from AUTHORIZED to any other state', () => {
      expect(canTransition(AUTHORIZED, PENDING_SCAN)).toBe(false)
      expect(canTransition(AUTHORIZED, SCANNED_PENDING)).toBe(false)
      expect(canTransition(AUTHORIZED, REJECTED)).toBe(false)
      expect(canTransition(AUTHORIZED, TIMEOUT)).toBe(false)
      expect(canTransition(AUTHORIZED, RISK)).toBe(false)
    })

    it('should not allow transition from REJECTED to any other state', () => {
      expect(canTransition(REJECTED, PENDING_SCAN)).toBe(false)
      expect(canTransition(REJECTED, AUTHORIZED)).toBe(false)
      expect(canTransition(REJECTED, TIMEOUT)).toBe(false)
    })

    it('should not allow invalid transitions like PENDING_SCAN to AUTHORIZED', () => {
      expect(canTransition(PENDING_SCAN, AUTHORIZED)).toBe(false)
    })

    it('should return false for invalid status', () => {
      expect(canTransition('invalid_status', PENDING_SCAN)).toBe(false)
    })
  })

  describe('getNextPossibleTransitions', () => {
    it('should include PENDING_SCAN itself for PENDING_SCAN', () => {
      const transitions = getNextPossibleTransitions(PENDING_SCAN)
      expect(transitions).toContain(PENDING_SCAN)
      expect(transitions).toContain(SCANNED_PENDING)
      expect(transitions).toContain(TIMEOUT)
      expect(transitions).toContain(RISK)
      expect(transitions).toHaveLength(4)
    })

    it('should include RISK itself for RISK', () => {
      const transitions = getNextPossibleTransitions(RISK)
      expect(transitions).toContain(RISK)
      expect(transitions).toContain(AUTHORIZED)
      expect(transitions).toContain(REJECTED)
      expect(transitions).toContain(TIMEOUT)
      expect(transitions).toHaveLength(4)
    })

    it('should return AUTHORIZED, REJECTED, TIMEOUT, RISK for SCANNED_PENDING', () => {
      const transitions = getNextPossibleTransitions(SCANNED_PENDING)
      expect(transitions).toContain(AUTHORIZED)
      expect(transitions).toContain(REJECTED)
      expect(transitions).toContain(TIMEOUT)
      expect(transitions).toContain(RISK)
      expect(transitions).toHaveLength(4)
    })

    it('should return empty array for AUTHORIZED', () => {
      expect(getNextPossibleTransitions(AUTHORIZED)).toEqual([])
    })

    it('should return empty array for REJECTED', () => {
      expect(getNextPossibleTransitions(REJECTED)).toEqual([])
    })

    it('should return [PENDING_SCAN] for TIMEOUT', () => {
      expect(getNextPossibleTransitions(TIMEOUT)).toEqual([PENDING_SCAN])
    })

    it('should return empty array for invalid status', () => {
      expect(getNextPossibleTransitions('invalid')).toEqual([])
    })
  })

  describe('transitionStatus', () => {
    it('should transition successfully with payload when valid', () => {
      const payload = { deviceInfo: { name: 'test-device' }, custom: 'data' }
      const result = transitionStatus(PENDING_SCAN, SCANNED_PENDING, payload)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(SCANNED_PENDING)
      expect(result.error).toBeNull()
      expect(result.deviceInfo).toEqual(payload.deviceInfo)
      expect(result.custom).toBe('data')
      expect(result.transitionedAt).toBeDefined()
    })

    it('should fail transition when invalid and return error message', () => {
      const result = transitionStatus(PENDING_SCAN, AUTHORIZED)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(PENDING_SCAN)
      expect(result.error).toBeDefined()
      expect(typeof result.error).toBe('string')
      expect(result.error.length).toBeGreaterThan(0)
    })

    it('should include ISO timestamp on success', () => {
      const result = transitionStatus(PENDING_SCAN, TIMEOUT)
      expect(result.transitionedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should allow self-transition PENDING_SCAN -> PENDING_SCAN via transitionStatus', () => {
      const result = transitionStatus(PENDING_SCAN, PENDING_SCAN, { refreshed: true })
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(PENDING_SCAN)
      expect(result.refreshed).toBe(true)
    })

    it('should allow self-transition RISK -> RISK via transitionStatus', () => {
      const result = transitionStatus(RISK, RISK, { deviceInfo: { name: 'risky' } })
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(RISK)
      expect(result.deviceInfo.name).toBe('risky')
    })
  })

  describe('isTerminalStatus - TIMEOUT 语义修复', () => {
    it('should return true for AUTHORIZED (真正的终态)', () => {
      expect(isTerminalStatus(AUTHORIZED)).toBe(true)
    })

    it('should return true for REJECTED (真正的终态)', () => {
      expect(isTerminalStatus(REJECTED)).toBe(true)
    })

    it('should return false for TIMEOUT (可刷新，不是终态)', () => {
      expect(isTerminalStatus(TIMEOUT)).toBe(false)
    })

    it('should return false for PENDING_SCAN', () => {
      expect(isTerminalStatus(PENDING_SCAN)).toBe(false)
    })

    it('should return false for SCANNED_PENDING', () => {
      expect(isTerminalStatus(SCANNED_PENDING)).toBe(false)
    })

    it('should return false for RISK', () => {
      expect(isTerminalStatus(RISK)).toBe(false)
    })
  })

  describe('canConfirm / canReject / canRefresh', () => {
    it('canConfirm should return true for SCANNED_PENDING and RISK', () => {
      expect(canConfirm(SCANNED_PENDING)).toBe(true)
      expect(canConfirm(RISK)).toBe(true)
      expect(canConfirm(PENDING_SCAN)).toBe(false)
      expect(canConfirm(AUTHORIZED)).toBe(false)
      expect(canConfirm(REJECTED)).toBe(false)
      expect(canConfirm(TIMEOUT)).toBe(false)
    })

    it('canReject should return true for SCANNED_PENDING and RISK', () => {
      expect(canReject(SCANNED_PENDING)).toBe(true)
      expect(canReject(RISK)).toBe(true)
      expect(canReject(PENDING_SCAN)).toBe(false)
      expect(canReject(AUTHORIZED)).toBe(false)
      expect(canReject(REJECTED)).toBe(false)
      expect(canReject(TIMEOUT)).toBe(false)
    })

    it('canRefresh should return true for TIMEOUT and PENDING_SCAN', () => {
      expect(canRefresh(TIMEOUT)).toBe(true)
      expect(canRefresh(PENDING_SCAN)).toBe(true)
      expect(canRefresh(SCANNED_PENDING)).toBe(false)
      expect(canRefresh(AUTHORIZED)).toBe(false)
      expect(canRefresh(REJECTED)).toBe(false)
    })
  })
})

describe('authorizationState - 纯函数操作（向后兼容）', () => {
  let warnSpy

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  describe('deprecated 警告应该为所有旧纯函数发出 deprecation 警告', () => {
    it('markAsScanned 应该发出警告', () => {
      markAsScanned(PENDING_SCAN, {})
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('DEPRECATED'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('markAsScanned'))
    })

    it('confirmAuthorization 应该发出警告并注明安全隐患', () => {
      confirmAuthorization(SCANNED_PENDING)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('安全隐患'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('confirmAuthorization'))
    })

    it('rejectAuthorization 应该发出警告并注明安全隐患', () => {
      rejectAuthorization(SCANNED_PENDING)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('安全隐患'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('rejectAuthorization'))
    })

    it('markAsTimeout 应该发出警告', () => {
      markAsTimeout(PENDING_SCAN)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('DEPRECATED'))
    })

    it('markAsRisk 应该发出警告', () => {
      markAsRisk(PENDING_SCAN)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('DEPRECATED'))
    })

    it('refreshAuthorization 应该发出警告', () => {
      refreshAuthorization(TIMEOUT)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('DEPRECATED'))
    })
  })

  describe('markAsScanned - 不再硬编码绕过状态机', () => {
    it('should transition from PENDING_SCAN to SCANNED_PENDING with device info', () => {
      const deviceInfo = { name: 'iPhone 15', type: 'mobile' }
      const result = markAsScanned(PENDING_SCAN, deviceInfo)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(SCANNED_PENDING)
      expect(result.deviceInfo).toEqual(deviceInfo)
    })

    it('should preserve RISK status if already in RISK (via transitionStatus, 不再硬编码)', () => {
      const deviceInfo = { name: 'Risky Device' }
      const result = markAsScanned(RISK, deviceInfo)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(RISK)
      expect(result.deviceInfo).toEqual(deviceInfo)
    })

    it('should fail to mark as scanned from AUTHORIZED', () => {
      const result = markAsScanned(AUTHORIZED)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(AUTHORIZED)
    })

    it('should work with empty device info', () => {
      const result = markAsScanned(PENDING_SCAN)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(SCANNED_PENDING)
      expect(result.deviceInfo).toEqual({})
    })
  })

  describe('confirmAuthorization - 保留外部 hasConfirmed 参数（向后兼容）', () => {
    it('should confirm from SCANNED_PENDING to AUTHORIZED successfully', () => {
      const result = confirmAuthorization(SCANNED_PENDING)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(AUTHORIZED)
      expect(result.confirmedAt).toBeDefined()
    })

    it('should confirm from RISK to AUTHORIZED successfully', () => {
      const result = confirmAuthorization(RISK)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(AUTHORIZED)
    })

    it('should block duplicate confirm when hasConfirmed is true', () => {
      const result = confirmAuthorization(SCANNED_PENDING, { hasConfirmed: true })
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(SCANNED_PENDING)
      expect(result.error).toContain('重复提交')
    })

    it('should fail to confirm from PENDING_SCAN', () => {
      const result = confirmAuthorization(PENDING_SCAN)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(PENDING_SCAN)
    })

    it('should fail to confirm from AUTHORIZED (already confirmed)', () => {
      const result = confirmAuthorization(AUTHORIZED)
      expect(result.success).toBe(false)
    })

    it('should include confirmedAt timestamp on success', () => {
      const result = confirmAuthorization(SCANNED_PENDING)
      expect(result.confirmedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(result.confirmedAt).toBe(result.transitionedAt)
    })
  })

  describe('rejectAuthorization - 保留外部 hasConfirmed 参数（向后兼容）', () => {
    it('should reject from SCANNED_PENDING to REJECTED with default reason', () => {
      const result = rejectAuthorization(SCANNED_PENDING)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(REJECTED)
      expect(result.rejectedAt).toBeDefined()
      expect(result.rejectReason).toBe('用户拒绝授权')
    })

    it('should reject with custom reason', () => {
      const customReason = '非本人操作'
      const result = rejectAuthorization(SCANNED_PENDING, { rejectReason: customReason })
      expect(result.success).toBe(true)
      expect(result.rejectReason).toBe(customReason)
    })

    it('should reject from RISK status', () => {
      const result = rejectAuthorization(RISK, { rejectReason: '风险设备' })
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(REJECTED)
    })

    it('should block duplicate reject when hasConfirmed is true', () => {
      const result = rejectAuthorization(SCANNED_PENDING, { hasConfirmed: true })
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(SCANNED_PENDING)
      expect(result.error).toContain('重复提交')
    })

    it('should fail to reject from PENDING_SCAN', () => {
      const result = rejectAuthorization(PENDING_SCAN)
      expect(result.success).toBe(false)
    })

    it('should fail to reject from AUTHORIZED', () => {
      const result = rejectAuthorization(AUTHORIZED)
      expect(result.success).toBe(false)
    })
  })

  describe('markAsTimeout - 不再将 TIMEOUT 视为终态', () => {
    it('should mark PENDING_SCAN as TIMEOUT', () => {
      const result = markAsTimeout(PENDING_SCAN)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(TIMEOUT)
    })

    it('should mark SCANNED_PENDING as TIMEOUT', () => {
      const result = markAsTimeout(SCANNED_PENDING)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(TIMEOUT)
    })

    it('should mark RISK as TIMEOUT', () => {
      const result = markAsTimeout(RISK)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(TIMEOUT)
    })

    it('should fail to mark TIMEOUT as TIMEOUT (无意义的重复操作)', () => {
      const result = markAsTimeout(TIMEOUT)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(TIMEOUT)
    })

    it('should NOT mark AUTHORIZED (terminal) as TIMEOUT', () => {
      const result = markAsTimeout(AUTHORIZED)
      expect(result.success).toBe(false)
      expect(result.newStatus).toBe(AUTHORIZED)
      expect(result.error).toBeDefined()
    })

    it('should NOT mark REJECTED (terminal) as TIMEOUT', () => {
      const result = markAsTimeout(REJECTED)
      expect(result.success).toBe(false)
    })
  })

  describe('markAsRisk', () => {
    it('should mark PENDING_SCAN as RISK with risk data', () => {
      const riskData = { level: RISK_LEVELS.HIGH, reasons: ['异常地点'] }
      const result = markAsRisk(PENDING_SCAN, riskData)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(RISK)
      expect(result.riskData).toEqual(riskData)
      expect(result.markedAsRiskAt).toBeDefined()
    })

    it('should mark SCANNED_PENDING as RISK', () => {
      const result = markAsRisk(SCANNED_PENDING)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(RISK)
    })

    it('should fail to mark AUTHORIZED as RISK', () => {
      const result = markAsRisk(AUTHORIZED)
      expect(result.success).toBe(false)
    })
  })

  describe('refreshAuthorization - 不再硬编码绕过状态机', () => {
    it('should refresh from TIMEOUT to PENDING_SCAN with new request ID', () => {
      const result = refreshAuthorization(TIMEOUT)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(PENDING_SCAN)
      expect(result.newRequestId).toBeDefined()
      expect(result.newRequestId.startsWith('AUTH_')).toBe(true)
      expect(result.refreshedAt).toBeDefined()
    })

    it('should refresh from PENDING_SCAN (refresh current, via transitionStatus)', () => {
      const result = refreshAuthorization(PENDING_SCAN)
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe(PENDING_SCAN)
      expect(result.newRequestId).toBeDefined()
    })

    it('should fail to refresh from SCANNED_PENDING', () => {
      const result = refreshAuthorization(SCANNED_PENDING)
      expect(result.success).toBe(false)
    })

    it('should fail to refresh from AUTHORIZED', () => {
      const result = refreshAuthorization(AUTHORIZED)
      expect(result.success).toBe(false)
    })

    it('should fail to refresh from REJECTED', () => {
      const result = refreshAuthorization(REJECTED)
      expect(result.success).toBe(false)
    })

    it('should always generate unique newRequestId', () => {
      const ids = Array.from({ length: 50 }, () => refreshAuthorization(TIMEOUT).newRequestId)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(50)
    })
  })

  describe('generateRequestId', () => {
    it('should generate ID with AUTH_ prefix', () => {
      const id = generateRequestId()
      expect(id.startsWith('AUTH_')).toBe(true)
    })

    it('should generate unique IDs each time', () => {
      const ids = Array.from({ length: 100 }, () => generateRequestId())
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(100)
    })

    it('should include timestamp in ID', () => {
      const before = Date.now()
      const id = generateRequestId()
      const parts = id.split('_')
      const timestamp = parseInt(parts[1], 10)
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(Date.now() + 1000)
    })
  })
})

describe('authorizationState - createAuthorizationManager 有状态管理器（防重复提交内聚化）', () => {
  describe('初始化', () => {
    it('should initialize with PENDING_SCAN status by default', () => {
      const manager = createAuthorizationManager()
      expect(manager.getStatus()).toBe(PENDING_SCAN)
      expect(manager.isConfirmed()).toBe(false)
      expect(manager.isRejected()).toBe(false)
      expect(manager.isOperationDone()).toBe(false)
      expect(manager.getRiskLevel()).toBeNull()
    })

    it('should allow custom initial status', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      expect(manager.getStatus()).toBe(SCANNED_PENDING)
    })

    it('should generate unique request ID per manager instance', () => {
      const m1 = createAuthorizationManager()
      const m2 = createAuthorizationManager()
      expect(m1.getRequestId()).not.toBe(m2.getRequestId())
      expect(m1.getRequestId().startsWith('AUTH_')).toBe(true)
    })
  })

  describe('markAsScanned', () => {
    it('should transition to SCANNED_PENDING for normal scan', () => {
      const manager = createAuthorizationManager()
      const deviceInfo = { name: 'MacBook' }
      const result = manager.markAsScanned(deviceInfo)

      expect(result.success).toBe(true)
      expect(manager.getStatus()).toBe(SCANNED_PENDING)
      expect(manager.getDeviceInfo()).toEqual(deviceInfo)
    })

    it('should transition to RISK when isRisk flag is true', () => {
      const manager = createAuthorizationManager()
      const deviceInfo = { name: 'Unknown Device' }
      const result = manager.markAsScanned(deviceInfo, true)

      expect(result.success).toBe(true)
      expect(manager.getStatus()).toBe(RISK)
      expect(manager.getRiskLevel()).toBe(RISK_LEVELS.HIGH)
    })

    it('should stay in RISK if already in RISK when scanning normal device', () => {
      const manager = createAuthorizationManager(RISK)
      const deviceInfo = { name: 'Risky Device' }
      const result = manager.markAsScanned(deviceInfo, false)

      expect(result.success).toBe(true)
      expect(manager.getStatus()).toBe(RISK)
    })

    it('should block scanning after operation is done', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      manager.confirm()
      expect(manager.isOperationDone()).toBe(true)

      const result = manager.markAsScanned({ name: 'another' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('操作已完成')
    })
  })

  describe('confirm - 内部维护防重复提交', () => {
    it('should confirm from SCANNED_PENDING to AUTHORIZED', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      const result = manager.confirm()

      expect(result.success).toBe(true)
      expect(manager.getStatus()).toBe(AUTHORIZED)
      expect(manager.isConfirmed()).toBe(true)
      expect(manager.isOperationDone()).toBe(true)
      expect(manager.getTimestamps().confirmedAt).toBeDefined()
    })

    it('should confirm from RISK to AUTHORIZED', () => {
      const manager = createAuthorizationManager(RISK)
      const result = manager.confirm()

      expect(result.success).toBe(true)
      expect(manager.getStatus()).toBe(AUTHORIZED)
    })

    it('should BLOCK duplicate confirm (内部维护 hasConfirmed，不依赖外部传参)', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      manager.confirm()

      const result = manager.confirm()
      expect(result.success).toBe(false)
      expect(result.error).toContain('重复提交')
      expect(result.error).toContain('操作已执行')
    })

    it('should BLOCK confirm after rejected (互斥)', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      manager.reject()

      const result = manager.confirm()
      expect(result.success).toBe(false)
      expect(result.error).toContain('已拒绝授权')
    })

    it('should BLOCK confirm from invalid status', () => {
      const manager = createAuthorizationManager(PENDING_SCAN)
      const result = manager.confirm()
      expect(result.success).toBe(false)
    })
  })

  describe('reject - 内部维护防重复提交', () => {
    it('should reject from SCANNED_PENDING to REJECTED with reason', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      const reason = '不是我操作的'
      const result = manager.reject(reason)

      expect(result.success).toBe(true)
      expect(manager.getStatus()).toBe(REJECTED)
      expect(manager.isRejected()).toBe(true)
      expect(manager.isOperationDone()).toBe(true)
      expect(manager.getRejectReason()).toBe(reason)
      expect(manager.getTimestamps().rejectedAt).toBeDefined()
    })

    it('should use default reason if not provided', () => {
      const manager = createAuthorizationManager(RISK)
      manager.reject()
      expect(manager.getRejectReason()).toBe('用户拒绝授权')
    })

    it('should BLOCK duplicate reject (内部维护 hasRejected)', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      manager.reject()

      const result = manager.reject('again')
      expect(result.success).toBe(false)
      expect(result.error).toContain('重复提交')
    })

    it('should BLOCK reject after confirmed (互斥)', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      manager.confirm()

      const result = manager.reject()
      expect(result.success).toBe(false)
      expect(result.error).toContain('已确认授权')
    })

    it('should BLOCK reject from invalid status', () => {
      const manager = createAuthorizationManager(PENDING_SCAN)
      const result = manager.reject()
      expect(result.success).toBe(false)
    })
  })

  describe('markAsTimeout', () => {
    it('should mark as TIMEOUT from PENDING_SCAN', () => {
      const manager = createAuthorizationManager()
      const result = manager.markAsTimeout()
      expect(result.success).toBe(true)
      expect(manager.getStatus()).toBe(TIMEOUT)
    })

    it('should NOT mark as TIMEOUT after operation done', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      manager.confirm()

      const result = manager.markAsTimeout()
      expect(result.success).toBe(false)
    })
  })

  describe('refresh - 重置所有状态', () => {
    it('should refresh from TIMEOUT to PENDING_SCAN and reset all state', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      manager.markAsScanned({ name: 'iPhone' }, true)
      manager.markAsTimeout()
      expect(manager.getStatus()).toBe(TIMEOUT)

      const oldRequestId = manager.getRequestId()
      const result = manager.refresh()

      expect(result.success).toBe(true)
      expect(manager.getStatus()).toBe(PENDING_SCAN)
      expect(manager.isConfirmed()).toBe(false)
      expect(manager.isRejected()).toBe(false)
      expect(manager.isOperationDone()).toBe(false)
      expect(manager.getDeviceInfo()).toEqual({})
      expect(manager.getRiskData()).toBeNull()
      expect(manager.getRiskLevel()).toBeNull()
      expect(manager.getRejectReason()).toBe('')
      expect(manager.getRequestId()).not.toBe(oldRequestId)
      expect(manager.getTimestamps().lastRefreshedAt).toBeDefined()
    })

    it('should refresh from PENDING_SCAN to PENDING_SCAN with new ID', () => {
      const manager = createAuthorizationManager()
      const oldRequestId = manager.getRequestId()

      const result = manager.refresh()
      expect(result.success).toBe(true)
      expect(manager.getStatus()).toBe(PENDING_SCAN)
      expect(manager.getRequestId()).not.toBe(oldRequestId)
    })

    it('should fail to refresh from SCANNED_PENDING', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      const result = manager.refresh()
      expect(result.success).toBe(false)
    })
  })

  describe('markAsRisk', () => {
    it('should mark as RISK and set default HIGH risk level', () => {
      const manager = createAuthorizationManager()
      const riskData = { riskReasons: ['异常地点'] }
      const result = manager.markAsRisk(riskData)

      expect(result.success).toBe(true)
      expect(manager.getStatus()).toBe(RISK)
      expect(manager.getRiskLevel()).toBe(RISK_LEVELS.HIGH)
      expect(manager.getRiskData().riskReasons).toEqual(['异常地点'])
    })

    it('should preserve custom risk level if provided', () => {
      const manager = createAuthorizationManager()
      const riskData = { riskLevel: RISK_LEVELS.MEDIUM, riskReasons: ['新设备'] }
      manager.markAsRisk(riskData)
      expect(manager.getRiskLevel()).toBe(RISK_LEVELS.MEDIUM)
    })

    it('should BLOCK markAsRisk after operation done', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      manager.reject()
      const result = manager.markAsRisk()
      expect(result.success).toBe(false)
    })
  })

  describe('getRiskLevel - 默认风险级别', () => {
    it('should return HIGH by default in RISK status when no riskLevel set', () => {
      const manager = createAuthorizationManager(RISK)
      expect(manager.getRiskLevel()).toBe(RISK_LEVELS.HIGH)
    })

    it('should return null when not in RISK status', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      expect(manager.getRiskLevel()).toBeNull()
    })

    it('should return custom level if set via markAsRisk', () => {
      const manager = createAuthorizationManager()
      manager.markAsRisk({ riskLevel: RISK_LEVELS.LOW })
      expect(manager.getRiskLevel()).toBe(RISK_LEVELS.LOW)
    })
  })

  describe('toJSON - 完整状态快照', () => {
    it('should return complete state snapshot', () => {
      const manager = createAuthorizationManager(SCANNED_PENDING)
      manager.markAsScanned({ name: 'iPhone' })
      manager.reject('测试拒绝')

      const snapshot = manager.toJSON()
      expect(snapshot.status).toBe(REJECTED)
      expect(snapshot.hasConfirmed).toBe(false)
      expect(snapshot.hasRejected).toBe(true)
      expect(snapshot.isOperationDone).toBe(true)
      expect(snapshot.deviceInfo.name).toBe('iPhone')
      expect(snapshot.requestId).toBeDefined()
      expect(snapshot.rejectReason).toBe('测试拒绝')
      expect(snapshot.timestamps.rejectedAt).toBeDefined()
    })
  })
})

describe('authorizationState - 倒计时失效（createCountdownManager）', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with correct remaining seconds', () => {
    const manager = createCountdownManager(60)
    expect(manager.getRemaining()).toBe(60)
    expect(manager.isRunning()).toBe(false)
    expect(manager.isExpired()).toBe(false)
    expect(manager.getFormattedTime()).toBe('01:00')
  })

  it('should use DEFAULT_QR_TIMEOUT when no initialSeconds provided', () => {
    const manager = createCountdownManager()
    expect(manager.getRemaining()).toBe(DEFAULT_QR_TIMEOUT)
    expect(manager.getFormattedTime()).toBe('02:00')
  })

  it('should countdown properly with tick callback', () => {
    const tickCallback = vi.fn()
    const manager = createCountdownManager(3)
    manager.start(tickCallback)

    expect(manager.isRunning()).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(tickCallback).toHaveBeenCalledWith(2)
    expect(manager.getRemaining()).toBe(2)

    vi.advanceTimersByTime(1000)
    expect(tickCallback).toHaveBeenCalledWith(1)
    expect(manager.getRemaining()).toBe(1)

    vi.advanceTimersByTime(1000)
    expect(tickCallback).toHaveBeenCalledWith(0)
    expect(manager.getRemaining()).toBe(0)
    expect(manager.isExpired()).toBe(true)
    expect(manager.isRunning()).toBe(false)
  })

  it('should call timeout callback when countdown expires', () => {
    const timeoutCallback = vi.fn()
    const manager = createCountdownManager(2, timeoutCallback)
    manager.start()

    vi.advanceTimersByTime(2000)
    expect(timeoutCallback).toHaveBeenCalledTimes(1)
    expect(manager.isExpired()).toBe(true)
  })

  it('should stop counting down when stop() is called', () => {
    const tickCallback = vi.fn()
    const manager = createCountdownManager(10)
    manager.start(tickCallback)

    vi.advanceTimersByTime(3000)
    expect(manager.getRemaining()).toBe(7)

    manager.stop()
    expect(manager.isRunning()).toBe(false)

    vi.advanceTimersByTime(5000)
    expect(manager.getRemaining()).toBe(7)
    expect(tickCallback).toHaveBeenCalledTimes(3)
  })

  it('should not start twice if already running', () => {
    const tickCallback = vi.fn()
    const manager = createCountdownManager(5)
    manager.start(tickCallback)
    manager.start(tickCallback)

    vi.advanceTimersByTime(1000)
    expect(tickCallback).toHaveBeenCalledTimes(1)
  })

  it('should reset countdown properly', () => {
    const manager = createCountdownManager(5)
    manager.start()
    vi.advanceTimersByTime(3000)
    expect(manager.getRemaining()).toBe(2)

    manager.reset()
    expect(manager.getRemaining()).toBe(5)
    expect(manager.isRunning()).toBe(false)
  })

  it('should reset with custom new seconds', () => {
    const manager = createCountdownManager(5)
    manager.reset(30)
    expect(manager.getRemaining()).toBe(30)
    expect(manager.getFormattedTime()).toBe('00:30')
  })

  it('should extend countdown by specified seconds', () => {
    const manager = createCountdownManager(60)
    manager.extend(30)
    expect(manager.getRemaining()).toBe(90)
    expect(manager.getFormattedTime()).toBe('01:30')
  })

  it('should format time correctly with leading zeros', () => {
    const manager = createCountdownManager(65)
    expect(manager.getFormattedTime()).toBe('01:05')

    const manager2 = createCountdownManager(5)
    expect(manager2.getFormattedTime()).toBe('00:05')

    const manager3 = createCountdownManager(0)
    expect(manager3.getFormattedTime()).toBe('00:00')
  })

  it('should not format negative time (clamp to 0)', () => {
    const manager = createCountdownManager(1)
    manager.start()
    vi.advanceTimersByTime(3000)
    expect(manager.getFormattedTime()).toBe('00:00')
    expect(manager.isExpired()).toBe(true)
  })

  it('should allow setting callback after creation', () => {
    const timeoutCallback = vi.fn()
    const manager = createCountdownManager(1)
    manager.setCallback(timeoutCallback)
    manager.start()
    vi.advanceTimersByTime(1000)
    expect(timeoutCallback).toHaveBeenCalledTimes(1)
  })

  it('should restart if expired before starting', () => {
    const manager = createCountdownManager(2)
    manager.start()
    vi.advanceTimersByTime(2000)
    expect(manager.isExpired()).toBe(true)

    const tickCallback = vi.fn()
    manager.start(tickCallback)
    expect(manager.getRemaining()).toBe(2)
    expect(manager.isRunning()).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(tickCallback).toHaveBeenCalledWith(1)
  })
})

describe('authorizationState - 风险提示', () => {
  describe('getRiskLevelColor', () => {
    it('should return green for LOW risk', () => {
      expect(getRiskLevelColor(RISK_LEVELS.LOW)).toBe('#10b981')
    })

    it('should return amber for MEDIUM risk', () => {
      expect(getRiskLevelColor(RISK_LEVELS.MEDIUM)).toBe('#f59e0b')
    })

    it('should return red for HIGH risk', () => {
      expect(getRiskLevelColor(RISK_LEVELS.HIGH)).toBe('#dc2626')
    })

    it('should return default color for invalid risk level', () => {
      expect(getRiskLevelColor('invalid')).toBe('#6b7280')
      expect(getRiskLevelColor(null)).toBe('#6b7280')
      expect(getRiskLevelColor(undefined)).toBe('#6b7280')
    })
  })

  describe('shouldShowRiskWarning', () => {
    it('should return true only for RISK status', () => {
      expect(shouldShowRiskWarning(RISK)).toBe(true)
      expect(shouldShowRiskWarning(PENDING_SCAN)).toBe(false)
      expect(shouldShowRiskWarning(SCANNED_PENDING)).toBe(false)
      expect(shouldShowRiskWarning(AUTHORIZED)).toBe(false)
      expect(shouldShowRiskWarning(REJECTED)).toBe(false)
      expect(shouldShowRiskWarning(TIMEOUT)).toBe(false)
    })
  })

  describe('getHighRiskAdvice - 默认风险级别修复', () => {
    it('should return array of advice for LOW risk', () => {
      const advice = getHighRiskAdvice(RISK_LEVELS.LOW)
      expect(Array.isArray(advice)).toBe(true)
      expect(advice.length).toBeGreaterThanOrEqual(1)
      advice.forEach(item => {
        expect(typeof item).toBe('string')
        expect(item.length).toBeGreaterThan(0)
      })
    })

    it('should return more urgent advice for MEDIUM risk', () => {
      const advice = getHighRiskAdvice(RISK_LEVELS.MEDIUM)
      expect(Array.isArray(advice)).toBe(true)
      expect(advice.length).toBeGreaterThanOrEqual(2)
    })

    it('should return multiple urgent warnings for HIGH risk', () => {
      const advice = getHighRiskAdvice(RISK_LEVELS.HIGH)
      expect(Array.isArray(advice)).toBe(true)
      expect(advice.length).toBeGreaterThanOrEqual(3)
      const hasStrongWarning = advice.some(a => a.includes('高风险') || a.includes('强烈建议') || a.includes('⚠️'))
      expect(hasStrongWarning).toBe(true)
    })

    it('should default to HIGH risk advice when riskLevel is null (边缘情况修复)', () => {
      const advice = getHighRiskAdvice(null)
      const highAdvice = getHighRiskAdvice(RISK_LEVELS.HIGH)
      expect(advice).toEqual(highAdvice)
    })

    it('should default to HIGH risk advice when riskLevel is undefined (边缘情况修复)', () => {
      const advice = getHighRiskAdvice(undefined)
      const highAdvice = getHighRiskAdvice(RISK_LEVELS.HIGH)
      expect(advice).toEqual(highAdvice)
    })

    it('should fallback to MEDIUM advice for unknown risk level string', () => {
      const advice = getHighRiskAdvice('invalid')
      const mediumAdvice = getHighRiskAdvice(RISK_LEVELS.MEDIUM)
      expect(advice).toEqual(mediumAdvice)
    })

    it('HIGH risk advice should mention contacting support or changing password', () => {
      const advice = getHighRiskAdvice(RISK_LEVELS.HIGH)
      const joined = advice.join(' ')
      const hasActionHint = joined.includes('修改密码') || joined.includes('联系客服')
      expect(hasActionHint).toBe(true)
    })
  })
})

describe('authorizationState - 辅助函数', () => {
  describe('getStatusDescription', () => {
    it('should return non-empty description for all statuses', () => {
      const statuses = Object.values(DEVICE_AUTH_STATUS)
      statuses.forEach(status => {
        const desc = getStatusDescription(status)
        expect(typeof desc).toBe('string')
        expect(desc.length).toBeGreaterThan(0)
      })
    })

    it('should return empty string for invalid status', () => {
      expect(getStatusDescription('invalid')).toBe('')
      expect(getStatusDescription(null)).toBe('')
    })
  })

  describe('getStatusIcon', () => {
    it('should return icon for all statuses', () => {
      const statuses = Object.values(DEVICE_AUTH_STATUS)
      statuses.forEach(status => {
        expect(typeof getStatusIcon(status)).toBe('string')
      })
    })

    it('should return default icon for invalid status', () => {
      expect(getStatusIcon('invalid')).toBe('📄')
    })
  })

  describe('getStatusColor', () => {
    it('should return hex color for all statuses', () => {
      const statuses = Object.values(DEVICE_AUTH_STATUS)
      statuses.forEach(status => {
        const color = getStatusColor(status)
        expect(color.startsWith('#')).toBe(true)
      })
    })

    it('should return default color for invalid status', () => {
      expect(getStatusColor('invalid')).toBe('#6b7280')
    })
  })

  describe('hasDeviceInfo', () => {
    it('should return true for SCANNED_PENDING, RISK, AUTHORIZED, REJECTED', () => {
      expect(hasDeviceInfo(SCANNED_PENDING)).toBe(true)
      expect(hasDeviceInfo(RISK)).toBe(true)
      expect(hasDeviceInfo(AUTHORIZED)).toBe(true)
      expect(hasDeviceInfo(REJECTED)).toBe(true)
    })

    it('should return false for PENDING_SCAN and TIMEOUT', () => {
      expect(hasDeviceInfo(PENDING_SCAN)).toBe(false)
      expect(hasDeviceInfo(TIMEOUT)).toBe(false)
    })
  })
})
