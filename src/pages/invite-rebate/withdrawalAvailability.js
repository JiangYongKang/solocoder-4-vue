import {
  WITHDRAWAL_STATUS,
  WITHDRAWAL_STATUS_LABELS,
  SETTLEMENT_RULES
} from './constants.js'

export function getWithdrawalStatusLabel(status) {
  return WITHDRAWAL_STATUS_LABELS[status] || '状态未知'
}

export function checkWithdrawalAvailability(options = {}) {
  const {
    availableBalance = 0,
    minAmount = SETTLEMENT_RULES.MIN_WITHDRAWAL_AMOUNT,
    maxAmount = SETTLEMENT_RULES.MAX_WITHDRAWAL_AMOUNT,
    isIdentityVerified = false,
    isAccountRestricted = false,
    lastWithdrawalAt = null,
    cooldownHours = SETTLEMENT_RULES.WITHDRAWAL_COOLDOWN_HOURS,
    isSystemMaintenance = false,
    requestedAmount = null,
    now = new Date()
  } = options

  if (isSystemMaintenance) {
    return {
      available: false,
      status: WITHDRAWAL_STATUS.MAINTENANCE,
      reason: '系统正在维护中，请稍后再试',
      suggestion: '维护通常在非高峰时段进行，预计1-2小时内完成',
      minAmount,
      maxAmount
    }
  }

  if (isAccountRestricted) {
    return {
      available: false,
      status: WITHDRAWAL_STATUS.ACCOUNT_RESTRICTED,
      reason: '您的账户当前受限，无法进行提现操作',
      suggestion: '请联系客服了解受限原因并完成解除流程',
      minAmount,
      maxAmount
    }
  }

  if (!isIdentityVerified) {
    return {
      available: false,
      status: WITHDRAWAL_STATUS.IDENTITY_NOT_VERIFIED,
      reason: '需要完成实名认证后才能提现',
      suggestion: '请前往账户设置页面完成实名认证',
      minAmount,
      maxAmount
    }
  }

  const amountToCheck = requestedAmount !== null ? requestedAmount : availableBalance
  if (amountToCheck < minAmount) {
    const shortfall = minAmount - amountToCheck
    return {
      available: false,
      status: WITHDRAWAL_STATUS.MIN_AMOUNT_NOT_MET,
      reason: `提现金额未达到最低要求`,
      suggestion: `最低提现金额为 ¥${minAmount}，还差 ¥${shortfall.toFixed(2)}，继续邀请好友达成目标吧！`,
      shortfall,
      minAmount,
      maxAmount
    }
  }

  if (lastWithdrawalAt) {
    const lastWithdrawal = new Date(lastWithdrawalAt)
    const current = new Date(now)

    if (!isNaN(lastWithdrawal.getTime())) {
      const cooldownMs = cooldownHours * 60 * 60 * 1000
      const elapsedMs = current.getTime() - lastWithdrawal.getTime()
      const remainingMs = cooldownMs - elapsedMs

      if (remainingMs > 0) {
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60))
        const remainingMinutes = Math.ceil((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

        return {
          available: false,
          status: WITHDRAWAL_STATUS.COOLDOWN_ACTIVE,
          reason: '提现冷却期未结束',
          suggestion: `距离上次提现不足${cooldownHours}小时，请在${remainingHours > 0 ? remainingHours + '小时' : ''}${remainingMinutes > 0 && remainingHours === 0 ? remainingMinutes + '分钟' : ''}后再试`,
          remainingMs,
          remainingHours,
          remainingMinutes,
          cooldownEndTime: new Date(lastWithdrawal.getTime() + cooldownMs).toISOString(),
          minAmount,
          maxAmount
        }
      }
    }
  }

  if (requestedAmount !== null && requestedAmount > maxAmount) {
    const excess = requestedAmount - maxAmount
    return {
      available: false,
      status: WITHDRAWAL_STATUS.MAX_AMOUNT_EXCEEDED,
      reason: `提现金额超出单笔上限`,
      suggestion: `单笔提现最高 ¥${maxAmount}，当前金额超出 ¥${excess.toFixed(2)}，请分多次提现`,
      excess,
      minAmount,
      maxAmount
    }
  }

  if (requestedAmount !== null && requestedAmount > availableBalance) {
    const shortfall = requestedAmount - availableBalance
    return {
      available: false,
      status: WITHDRAWAL_STATUS.INSUFFICIENT_BALANCE,
      reason: '可提现余额不足',
      suggestion: `当前可提现 ¥${availableBalance.toFixed(2)}，提现金额不能超过可提现余额，还需 ¥${shortfall.toFixed(2)}`,
      shortfall,
      minAmount,
      maxAmount
    }
  }

  return {
    available: true,
    status: WITHDRAWAL_STATUS.AVAILABLE,
    reason: '',
    suggestion: '',
    maxWithdrawalAmount: Math.min(availableBalance, maxAmount),
    minAmount,
    maxAmount
  }
}

export function calculateWithdrawalFee(amount, feeRate = 0.006, minFee = 1) {
  if (!amount || amount <= 0) {
    return 0
  }
  const calculatedFee = amount * feeRate
  return Math.max(minFee, Math.round(calculatedFee * 100) / 100)
}

export function calculateActualReceive(amount, feeRate = 0.006, minFee = 1) {
  if (!amount || amount <= 0) {
    return 0
  }
  const fee = calculateWithdrawalFee(amount, feeRate, minFee)
  return Math.round((amount - fee) * 100) / 100
}

export function getWithdrawalMethods() {
  return [
    {
      id: 'alipay',
      name: '支付宝',
      icon: '💙',
      feeRate: 0.006,
      minFee: 1,
      processingTime: '实时到账',
      dailyLimit: 50000,
      enabled: true
    },
    {
      id: 'wechat',
      name: '微信钱包',
      icon: '💚',
      feeRate: 0.006,
      minFee: 1,
      processingTime: '实时到账',
      dailyLimit: 50000,
      enabled: true
    },
    {
      id: 'bank',
      name: '银行卡',
      icon: '🏦',
      feeRate: 0.005,
      minFee: 2,
      processingTime: '1-3个工作日',
      dailyLimit: 500000,
      enabled: true
    }
  ]
}

export function validateWithdrawalRequest(options = {}) {
  const {
    amount,
    method,
    availableBalance,
    accountInfo,
    minAmount = SETTLEMENT_RULES.MIN_WITHDRAWAL_AMOUNT,
    maxAmount = SETTLEMENT_RULES.MAX_WITHDRAWAL_AMOUNT
  } = options

  const errors = []

  if (!amount || amount <= 0) {
    errors.push('请输入提现金额')
    return { valid: false, errors }
  }

  if (isNaN(amount)) {
    errors.push('提现金额格式不正确')
    return { valid: false, errors }
  }

  if (amount < minAmount) {
    errors.push(`最低提现金额为 ¥${minAmount}`)
  }

  if (amount > maxAmount) {
    errors.push(`单笔提现不能超过 ¥${maxAmount}`)
  }

  if (amount > availableBalance) {
    errors.push('可提现余额不足')
  }

  const methods = getWithdrawalMethods()
  const selectedMethod = methods.find(m => m.id === method)
  if (!selectedMethod) {
    errors.push('请选择有效的提现方式')
  } else if (!selectedMethod.enabled) {
    errors.push(`${selectedMethod.name}提现暂未开放`)
  }

  if (!accountInfo) {
    errors.push('请填写收款账户信息')
  } else if (method === 'alipay' && !accountInfo.alipayAccount) {
    errors.push('请填写支付宝账号')
  } else if (method === 'wechat' && !accountInfo.wechatAccount) {
    errors.push('请填写微信账号')
  } else if (method === 'bank') {
    if (!accountInfo.bankName) errors.push('请填写开户银行')
    if (!accountInfo.bankAccount) errors.push('请填写银行卡号')
    if (!accountInfo.accountName) errors.push('请填写开户人姓名')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function estimateWithdrawalTiming(method) {
  const timings = {
    alipay: { minMinutes: 1, maxMinutes: 60, label: '实时到账' },
    wechat: { minMinutes: 1, maxMinutes: 60, label: '实时到账' },
    bank: { minMinutes: 60 * 24, maxMinutes: 60 * 24 * 3, label: '1-3个工作日' }
  }
  return timings[method] || { minMinutes: 60, maxMinutes: 60 * 24, label: '1个工作日内' }
}
