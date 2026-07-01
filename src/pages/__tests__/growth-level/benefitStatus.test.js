import { describe, it, expect } from 'vitest'
import {
  getBenefitStatus,
  canClaimBenefit,
  getCannotClaimReason,
  getBenefitStatusColor,
  getBenefitStatusIcon,
  filterBenefitsByStatus,
  getBenefitsByLevel,
  sortBenefitsByPriority,
  checkExpiringBenefits,
  claimBenefit,
  calculateBenefitStats,
  formatCooldownRemaining
} from '../../growth-level/benefitStatus.js'
import { BENEFIT_STATUS, LEVELS } from '../../growth-level/constants.js'

describe('benefitStatus', () => {
  describe('getBenefitStatus', () => {
    it('should return LOCKED when level is insufficient', () => {
      const benefit = { requiredLevel: 5 }
      expect(getBenefitStatus(benefit, 3)).toBe(BENEFIT_STATUS.LOCKED)
    })

    it('should return EXPIRED when past expiration date', () => {
      const now = new Date()
      const benefit = {
        requiredLevel: 1,
        expiresAt: new Date(now.getTime() - 1000).toISOString()
      }
      expect(getBenefitStatus(benefit, 5, now)).toBe(BENEFIT_STATUS.EXPIRED)
    })

    it('should return CLAIMED when already claimed', () => {
      const now = new Date()
      const benefit = {
        requiredLevel: 1,
        claimedAt: new Date().toISOString()
      }
      expect(getBenefitStatus(benefit, 5, now)).toBe(BENEFIT_STATUS.CLAIMED)
    })

    it('should return UNLOCKED when claimableFrom is in future', () => {
      const now = new Date()
      const benefit = {
        requiredLevel: 1,
        claimableFrom: new Date(now.getTime() + 10000).toISOString()
      }
      expect(getBenefitStatus(benefit, 5, now)).toBe(BENEFIT_STATUS.UNLOCKED)
    })

    it('should return CLAIMABLE when all conditions met', () => {
      const now = new Date()
      const benefit = {
        requiredLevel: 3,
        expiresAt: new Date(now.getTime() + 10000).toISOString()
      }
      expect(getBenefitStatus(benefit, 5, now)).toBe(BENEFIT_STATUS.CLAIMABLE)
    })

    it('should return CLAIMABLE for unlocked one-time benefit not yet claimed', () => {
      const benefit = {
        requiredLevel: 1,
        isOneTime: true
      }
      expect(getBenefitStatus(benefit, 5)).toBe(BENEFIT_STATUS.CLAIMABLE)
    })
  })

  describe('canClaimBenefit', () => {
    it('should return false when status is not CLAIMABLE', () => {
      const benefit = { requiredLevel: 5 }
      const result = canClaimBenefit(benefit, 3)
      expect(result.canClaim).toBe(false)
      expect(result.reason).toBeDefined()
    })

    it('should return false for one-time benefit already claimed', () => {
      const benefit = {
        requiredLevel: 1,
        isOneTime: true,
        claimedAt: new Date().toISOString()
      }
      const result = canClaimBenefit(benefit, 5)
      expect(result.canClaim).toBe(false)
      expect(result.reason).toBe('该权益只能领取一次')
    })

    it('should return false when in cooldown period', () => {
      const now = new Date()
      const lastClaimTime = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
      const benefit = {
        requiredLevel: 1,
        cooldownHours: 24
      }
      const result = canClaimBenefit(benefit, 5, lastClaimTime, now)
      expect(result.canClaim).toBe(false)
      expect(result.reason).toBe('领取冷却中')
      expect(result.remainingCooldown).toBeGreaterThan(0)
    })

    it('should return true when all conditions met', () => {
      const benefit = {
        requiredLevel: 3,
        cooldownHours: 24
      }
      const result = canClaimBenefit(benefit, 5)
      expect(result.canClaim).toBe(true)
      expect(result.reason).toBeNull()
    })
  })

  describe('getCannotClaimReason', () => {
    it('should show level requirement for LOCKED status', () => {
      const benefit = { requiredLevel: 5 }
      const reason = getCannotClaimReason(BENEFIT_STATUS.LOCKED, benefit, 3)
      expect(reason).toBe('等级 5 解锁')
    })

    it('should show expired for EXPIRED status', () => {
      const reason = getCannotClaimReason(BENEFIT_STATUS.EXPIRED, {}, 5)
      expect(reason).toBe('已过期')
    })

    it('should show claimed for CLAIMED status', () => {
      const reason = getCannotClaimReason(BENEFIT_STATUS.CLAIMED, {}, 5)
      expect(reason).toBe('已领取')
    })

    it('should show countdown for UNLOCKED with future claimableFrom', () => {
      const now = new Date()
      const benefit = {
        claimableFrom: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString()
      }
      const reason = getCannotClaimReason(BENEFIT_STATUS.UNLOCKED, benefit, 5, now)
      expect(reason).toContain('小时后可领取')
    })
  })

  describe('getBenefitStatusColor', () => {
    it('should return correct colors for all statuses', () => {
      expect(getBenefitStatusColor(BENEFIT_STATUS.UNLOCKED)).toBe('#10b981')
      expect(getBenefitStatusColor(BENEFIT_STATUS.LOCKED)).toBe('#9ca3af')
      expect(getBenefitStatusColor(BENEFIT_STATUS.CLAIMABLE)).toBe('#3b82f6')
      expect(getBenefitStatusColor(BENEFIT_STATUS.CLAIMED)).toBe('#6b7280')
      expect(getBenefitStatusColor(BENEFIT_STATUS.EXPIRED)).toBe('#ef4444')
    })
  })

  describe('getBenefitStatusIcon', () => {
    it('should return correct icons for all statuses', () => {
      expect(getBenefitStatusIcon(BENEFIT_STATUS.UNLOCKED)).toBe('🔓')
      expect(getBenefitStatusIcon(BENEFIT_STATUS.LOCKED)).toBe('🔒')
      expect(getBenefitStatusIcon(BENEFIT_STATUS.CLAIMABLE)).toBe('🎁')
      expect(getBenefitStatusIcon(BENEFIT_STATUS.CLAIMED)).toBe('✅')
      expect(getBenefitStatusIcon(BENEFIT_STATUS.EXPIRED)).toBe('⏰')
    })
  })

  describe('getBenefitsByLevel', () => {
    it('should categorize benefits correctly', () => {
      const now = new Date()
      const benefits = [
        { id: 1, requiredLevel: 1, type: 'discount' },
        { id: 2, requiredLevel: 10, type: 'free_shipping' },
        { id: 3, requiredLevel: 1, claimedAt: new Date().toISOString(), type: 'points_bonus' },
        { id: 4, requiredLevel: 1, expiresAt: new Date(now.getTime() - 1000).toISOString(), type: 'exclusive_content' }
      ]

      const result = getBenefitsByLevel(benefits, 5, now)
      expect(result.unlocked).toHaveLength(3)
      expect(result.locked).toHaveLength(1)
      expect(result.claimable).toHaveLength(1)
      expect(result.claimed).toHaveLength(1)
      expect(result.expired).toHaveLength(1)
    })

    it('should handle null benefits', () => {
      const result = getBenefitsByLevel(null, 5)
      expect(result.unlocked).toEqual([])
      expect(result.locked).toEqual([])
    })
  })

  describe('sortBenefitsByPriority', () => {
    it('should sort claimable first', () => {
      const now = new Date()
      const benefits = [
        { id: 1, requiredLevel: 10, type: 'discount' },
        { id: 2, requiredLevel: 1, type: 'free_shipping' }
      ]

      const sorted = sortBenefitsByPriority(benefits, 5, now)
      expect(sorted[0].id).toBe(2)
      expect(sorted[1].id).toBe(1)
    })

    it('should sort by expiration date within same status', () => {
      const now = new Date()
      const benefits = [
        { id: 1, requiredLevel: 1, expiresAt: new Date(now.getTime() + 5000).toISOString(), type: 'discount' },
        { id: 2, requiredLevel: 1, expiresAt: new Date(now.getTime() + 1000).toISOString(), type: 'free_shipping' }
      ]

      const sorted = sortBenefitsByPriority(benefits, 5, now)
      expect(sorted[0].id).toBe(2)
      expect(sorted[1].id).toBe(1)
    })

    it('should sort by required level for same status and no expiration', () => {
      const benefits = [
        { id: 1, requiredLevel: 5, type: 'discount' },
        { id: 2, requiredLevel: 3, type: 'free_shipping' }
      ]

      const sorted = sortBenefitsByPriority(benefits, 10)
      expect(sorted[0].id).toBe(2)
      expect(sorted[1].id).toBe(1)
    })
  })

  describe('checkExpiringBenefits', () => {
    it('should find benefits expiring within threshold', () => {
      const now = new Date()
      const benefits = [
        {
          id: 1,
          requiredLevel: 1,
          expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
          type: 'discount'
        },
        {
          id: 2,
          requiredLevel: 1,
          expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
          type: 'free_shipping'
        }
      ]

      const expiring = checkExpiringBenefits(benefits, 5, 24, now)
      expect(expiring).toHaveLength(1)
      expect(expiring[0].id).toBe(1)
    })

    it('should not include already expired benefits', () => {
      const now = new Date()
      const benefits = [
        {
          id: 1,
          requiredLevel: 1,
          expiresAt: new Date(now.getTime() - 1000).toISOString(),
          type: 'discount'
        }
      ]

      const expiring = checkExpiringBenefits(benefits, 5, 24, now)
      expect(expiring).toHaveLength(0)
    })

    it('should not include locked benefits', () => {
      const now = new Date()
      const benefits = [
        {
          id: 1,
          requiredLevel: 10,
          expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
          type: 'discount'
        }
      ]

      const expiring = checkExpiringBenefits(benefits, 5, 24, now)
      expect(expiring).toHaveLength(0)
    })
  })

  describe('claimBenefit', () => {
    it('should fail when cannot claim', () => {
      const benefit = { requiredLevel: 5, type: 'discount' }
      const result = claimBenefit(benefit, 3)
      expect(result.success).toBe(false)
      expect(result.benefit).toBe(benefit)
    })

    it('should succeed and set claimedAt', () => {
      const now = new Date()
      const benefit = { requiredLevel: 1, type: 'discount' }
      const result = claimBenefit(benefit, 5, null, now)

      expect(result.success).toBe(true)
      expect(result.benefit.claimedAt).toBeDefined()
      expect(result.benefit.lastClaimedAt).toBeDefined()
      expect(result.claimedAt).toBe(now)
    })

    it('should return remaining cooldown when in cooldown', () => {
      const now = new Date()
      const lastClaimTime = new Date(now.getTime() - 12 * 60 * 60 * 1000)
      const benefit = { requiredLevel: 1, cooldownHours: 24, type: 'discount' }
      const result = claimBenefit(benefit, 5, lastClaimTime, now)

      expect(result.success).toBe(false)
      expect(result.remainingCooldown).toBeGreaterThan(0)
    })
  })

  describe('calculateBenefitStats', () => {
    it('should calculate correct stats', () => {
      const now = new Date()
      const benefits = [
        { id: 1, requiredLevel: 1, type: 'discount' },
        { id: 2, requiredLevel: 1, claimedAt: new Date().toISOString(), type: 'free_shipping' },
        { id: 3, requiredLevel: 5, type: 'points_bonus' },
        { id: 4, requiredLevel: 1, expiresAt: new Date(now.getTime() - 1000).toISOString(), type: 'exclusive_content' }
      ]

      const stats = calculateBenefitStats(benefits, 3, now)
      expect(stats.total).toBe(4)
      expect(stats.unlocked).toBe(3)
      expect(stats.locked).toBe(1)
      expect(stats.claimed).toBe(1)
      expect(stats.expired).toBe(1)
      expect(stats.unlockProgress).toBe(75)
    })

    it('should handle null benefits', () => {
      const stats = calculateBenefitStats(null, 5)
      expect(stats.total).toBe(0)
      expect(stats.unlockProgress).toBe(0)
    })
  })

  describe('formatCooldownRemaining', () => {
    it('should show "可领取" when cooldown is done', () => {
      expect(formatCooldownRemaining(0)).toBe('可领取')
    })

    it('should format hours and minutes', () => {
      const ms = 5 * 60 * 60 * 1000 + 30 * 60 * 1000
      expect(formatCooldownRemaining(ms)).toBe('5小时30分钟后可领取')
    })

    it('should format minutes only when less than an hour', () => {
      const ms = 45 * 60 * 1000
      expect(formatCooldownRemaining(ms)).toBe('45分钟后可领取')
    })
  })
})
