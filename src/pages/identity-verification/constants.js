export const VERIFICATION_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

export const CERTIFICATE_TYPES = {
  ID_CARD: 'id_card',
  PASSPORT: 'passport',
  HK_MACAU_PASS: 'hk_macau_pass'
}

export const STATUS_LABELS = {
  [VERIFICATION_STATUS.NOT_SUBMITTED]: '未提交',
  [VERIFICATION_STATUS.PENDING]: '审核中',
  [VERIFICATION_STATUS.APPROVED]: '已通过',
  [VERIFICATION_STATUS.REJECTED]: '已失败'
}

export const CERTIFICATE_TYPE_LABELS = {
  [CERTIFICATE_TYPES.ID_CARD]: '身份证',
  [CERTIFICATE_TYPES.PASSPORT]: '护照',
  [CERTIFICATE_TYPES.HK_MACAU_PASS]: '港澳通行证'
}
