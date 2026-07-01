import { describe, it, expect } from 'vitest'
import {
  INVITE_CODE,
  INVITE_STATUS,
  INVITE_STATUS_LABELS,
  INVITE_STATUS_ICONS,
  INVITE_STATUS_COLORS,
  SETTLEMENT_STATUS,
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_ICONS,
  SETTLEMENT_STATUS_COLORS,
  FREEZE_REASON,
  FREEZE_REASON_LABELS,
  FREEZE_REASON_DESCRIPTIONS,
  FREEZE_REASON_SUGGESTIONS,
  FREEZE_SEVERITY,
  FREEZE_REASON_SEVERITY,
  WITHDRAWAL_STATUS,
  WITHDRAWAL_STATUS_LABELS,
  REWARD_RULES,
  SETTLEMENT_RULES,
  SHARE_CHANNELS,
  SHARE_CHANNEL_LABELS,
  SHARE_CHANNEL_ICONS,
  DEFAULT_BASE_URL
} from '../../invite-rebate/constants.js'

describe('constants', () => {
  describe('INVITE_CODE', () => {
    it('should have correct min and max length', () => {
      expect(INVITE_CODE.MIN_LENGTH).toBe(6)
      expect(INVITE_CODE.MAX_LENGTH).toBe(12)
    })

    it('should have valid pattern for uppercase alphanumeric', () => {
      expect(INVITE_CODE.PATTERN.test('ABC123')).toBe(true)
      expect(INVITE_CODE.PATTERN.test('abc123')).toBe(false)
      expect(INVITE_CODE.PATTERN.test('AB-12')).toBe(false)
      expect(INVITE_CODE.PATTERN.test('A'.repeat(13))).toBe(false)
    })

    it('should have charset without ambiguous characters', () => {
      expect(INVITE_CODE.CHARSET).not.toContain('0')
      expect(INVITE_CODE.CHARSET).not.toContain('O')
      expect(INVITE_CODE.CHARSET).not.toContain('I')
      expect(INVITE_CODE.CHARSET).not.toContain('1')
      expect(INVITE_CODE.CHARSET.length).toBeGreaterThan(28)
    })

    it('should have correct prefix', () => {
      expect(INVITE_CODE.PREFIX).toBe('INV')
    })
  })

  describe('INVITE_STATUS', () => {
    it('should have all 6 invite statuses', () => {
      expect(INVITE_STATUS.PENDING).toBe('pending')
      expect(INVITE_STATUS.REGISTERED).toBe('registered')
      expect(INVITE_STATUS.ACTIVE).toBe('active')
      expect(INVITE_STATUS.CONVERTED).toBe('converted')
      expect(INVITE_STATUS.EXPIRED).toBe('expired')
      expect(INVITE_STATUS.CANCELLED).toBe('cancelled')
      expect(Object.keys(INVITE_STATUS)).toHaveLength(6)
    })

    it('should have matching labels for all statuses', () => {
      Object.keys(INVITE_STATUS).forEach(key => {
        expect(INVITE_STATUS_LABELS[INVITE_STATUS[key]]).toBeDefined()
        expect(INVITE_STATUS_ICONS[INVITE_STATUS[key]]).toBeDefined()
        expect(INVITE_STATUS_COLORS[INVITE_STATUS[key]]).toBeDefined()
      })
    })
  })

  describe('SETTLEMENT_STATUS', () => {
    it('should have all 5 settlement statuses', () => {
      expect(SETTLEMENT_STATUS.PENDING).toBe('pending')
      expect(SETTLEMENT_STATUS.PROCESSING).toBe('processing')
      expect(SETTLEMENT_STATUS.SETTLED).toBe('settled')
      expect(SETTLEMENT_STATUS.FROZEN).toBe('frozen')
      expect(SETTLEMENT_STATUS.REJECTED).toBe('rejected')
      expect(Object.keys(SETTLEMENT_STATUS)).toHaveLength(5)
    })

    it('should have matching labels for all settlement statuses', () => {
      Object.keys(SETTLEMENT_STATUS).forEach(key => {
        expect(SETTLEMENT_STATUS_LABELS[SETTLEMENT_STATUS[key]]).toBeDefined()
        expect(SETTLEMENT_STATUS_ICONS[SETTLEMENT_STATUS[key]]).toBeDefined()
        expect(SETTLEMENT_STATUS_COLORS[SETTLEMENT_STATUS[key]]).toBeDefined()
      })
    })
  })

  describe('FREEZE_REASON', () => {
    it('should have all 8 freeze reasons', () => {
      expect(FREEZE_REASON.SUSPICIOUS_ACTIVITY).toBe('suspicious_activity')
      expect(FREEZE_REASON.SELF_INVITE).toBe('self_invite')
      expect(FREEZE_REASON.BOT_ACCOUNT).toBe('bot_account')
      expect(FREEZE_REASON.DUPLICATE_INVITE).toBe('duplicate_invite')
      expect(FREEZE_REASON.INVALID_CONVERSION).toBe('invalid_conversion')
      expect(FREEZE_REASON.POLICY_VIOLATION).toBe('policy_violation')
      expect(FREEZE_REASON.RISK_REVIEW).toBe('risk_review')
      expect(FREEZE_REASON.REFUNDED_ORDER).toBe('refunded_order')
      expect(Object.keys(FREEZE_REASON)).toHaveLength(8)
    })

    it('should have matching labels, descriptions and suggestions', () => {
      Object.keys(FREEZE_REASON).forEach(key => {
        const reason = FREEZE_REASON[key]
        expect(FREEZE_REASON_LABELS[reason]).toBeDefined()
        expect(typeof FREEZE_REASON_LABELS[reason]).toBe('string')
        expect(FREEZE_REASON_LABELS[reason].length).toBeGreaterThan(0)

        expect(FREEZE_REASON_DESCRIPTIONS[reason]).toBeDefined()
        expect(typeof FREEZE_REASON_DESCRIPTIONS[reason]).toBe('string')
        expect(FREEZE_REASON_DESCRIPTIONS[reason].length).toBeGreaterThan(0)

        expect(FREEZE_REASON_SUGGESTIONS[reason]).toBeDefined()
        expect(typeof FREEZE_REASON_SUGGESTIONS[reason]).toBe('string')
        expect(FREEZE_REASON_SUGGESTIONS[reason].length).toBeGreaterThan(0)
      })
    })
  })

  describe('FREEZE_SEVERITY', () => {
    it('should have all 4 severity levels', () => {
      expect(FREEZE_SEVERITY.LOW).toBe('low')
      expect(FREEZE_SEVERITY.MEDIUM).toBe('medium')
      expect(FREEZE_SEVERITY.HIGH).toBe('high')
      expect(FREEZE_SEVERITY.CRITICAL).toBe('critical')
    })

    it('should have severity mapping for all freeze reasons', () => {
      Object.keys(FREEZE_REASON).forEach(key => {
        expect(FREEZE_REASON_SEVERITY[FREEZE_REASON[key]]).toBeDefined()
      })
    })
  })

  describe('WITHDRAWAL_STATUS', () => {
    it('should have all 6 withdrawal statuses', () => {
      expect(WITHDRAWAL_STATUS.AVAILABLE).toBe('available')
      expect(WITHDRAWAL_STATUS.MIN_AMOUNT_NOT_MET).toBe('min_amount_not_met')
      expect(WITHDRAWAL_STATUS.IDENTITY_NOT_VERIFIED).toBe('identity_not_verified')
      expect(WITHDRAWAL_STATUS.ACCOUNT_RESTRICTED).toBe('account_restricted')
      expect(WITHDRAWAL_STATUS.COOLDOWN_ACTIVE).toBe('cooldown_active')
      expect(WITHDRAWAL_STATUS.MAINTENANCE).toBe('maintenance')
      expect(Object.keys(WITHDRAWAL_STATUS)).toHaveLength(6)
    })

    it('should have matching labels', () => {
      Object.keys(WITHDRAWAL_STATUS).forEach(key => {
        expect(WITHDRAWAL_STATUS_LABELS[WITHDRAWAL_STATUS[key]]).toBeDefined()
      })
    })
  })

  describe('REWARD_RULES', () => {
    it('should have positive new user bonus', () => {
      expect(REWARD_RULES.NEW_USER_BONUS).toBeGreaterThan(0)
    })

    it('should have valid percentages between 0 and 1', () => {
      expect(REWARD_RULES.FIRST_PURCHASE_PERCENT).toBeGreaterThan(0)
      expect(REWARD_RULES.FIRST_PURCHASE_PERCENT).toBeLessThan(1)
      expect(REWARD_RULES.RECURRING_PERCENT).toBeGreaterThan(0)
      expect(REWARD_RULES.RECURRING_PERCENT).toBeLessThan(1)
    })

    it('should have positive max rewards', () => {
      expect(REWARD_RULES.FIRST_PURCHASE_MAX).toBeGreaterThan(0)
      expect(REWARD_RULES.RECURRING_MAX).toBeGreaterThan(0)
    })

    it('should have positive recurring months', () => {
      expect(REWARD_RULES.RECURRING_MONTHS).toBeGreaterThan(0)
    })

    it('should have tier bonus with increasing invites and bonus', () => {
      expect(REWARD_RULES.TIER_BONUS.length).toBeGreaterThan(0)

      for (let i = 1; i < REWARD_RULES.TIER_BONUS.length; i++) {
        expect(REWARD_RULES.TIER_BONUS[i].invites).toBeGreaterThan(REWARD_RULES.TIER_BONUS[i - 1].invites)
        expect(REWARD_RULES.TIER_BONUS[i].bonus).toBeGreaterThan(REWARD_RULES.TIER_BONUS[i - 1].bonus)
      }
    })
  })

  describe('SETTLEMENT_RULES', () => {
    it('should have positive freeze days', () => {
      expect(SETTLEMENT_RULES.FREEZE_DAYS).toBeGreaterThan(0)
    })

    it('should have valid settlement day', () => {
      expect(SETTLEMENT_RULES.SETTLEMENT_DAY).toBeGreaterThanOrEqual(1)
      expect(SETTLEMENT_RULES.SETTLEMENT_DAY).toBeLessThanOrEqual(28)
    })

    it('should have min amount less than max amount', () => {
      expect(SETTLEMENT_RULES.MIN_WITHDRAWAL_AMOUNT).toBeGreaterThan(0)
      expect(SETTLEMENT_RULES.MAX_WITHDRAWAL_AMOUNT).toBeGreaterThan(SETTLEMENT_RULES.MIN_WITHDRAWAL_AMOUNT)
    })

    it('should have positive cooldown hours', () => {
      expect(SETTLEMENT_RULES.WITHDRAWAL_COOLDOWN_HOURS).toBeGreaterThan(0)
    })

    it('should have positive settlement cycle', () => {
      expect(SETTLEMENT_RULES.SETTLEMENT_CYCLE_DAYS).toBeGreaterThan(0)
    })
  })

  describe('SHARE_CHANNELS', () => {
    it('should have all 6 share channels', () => {
      expect(SHARE_CHANNELS.WECHAT).toBe('wechat')
      expect(SHARE_CHANNELS.WEIBO).toBe('weibo')
      expect(SHARE_CHANNELS.QQ).toBe('qq')
      expect(SHARE_CHANNELS.LINK).toBe('link')
      expect(SHARE_CHANNELS.QRCODE).toBe('qrcode')
      expect(SHARE_CHANNELS.COPY).toBe('copy')
      expect(Object.keys(SHARE_CHANNELS)).toHaveLength(6)
    })

    it('should have matching labels and icons', () => {
      Object.keys(SHARE_CHANNELS).forEach(key => {
        expect(SHARE_CHANNEL_LABELS[SHARE_CHANNELS[key]]).toBeDefined()
        expect(SHARE_CHANNEL_ICONS[SHARE_CHANNELS[key]]).toBeDefined()
      })
    })
  })

  describe('DEFAULT_BASE_URL', () => {
    it('should be a valid URL', () => {
      expect(DEFAULT_BASE_URL).toMatch(/^https?:\/\//)
    })
  })
})
