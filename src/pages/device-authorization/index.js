export { default as DeviceAuthorization } from './DeviceAuthorization.vue'
export * from './constants.js'

export {
  isTerminalStatus,
  shouldShowRiskWarning,
  getRiskLevelColor,
  getHighRiskAdvice,
  getStatusDescription,
  getStatusIcon,
  getStatusColor,
  hasDeviceInfo,
  createCountdownManager,
  createAuthorizationManager,
  generateRequestId
} from './authorizationState.js'
