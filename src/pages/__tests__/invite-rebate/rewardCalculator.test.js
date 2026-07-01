import { describe, expect, it } from 'vitest'
import { REWARD_RULES, SETTLEMENT_RULES } from '../../invite-rebate/constants.js'
import {
    calculateFirstPurchaseReward,
    calculateFreezeDaysRemaining,
    calculateFreezeReleaseDate,
    calculateNewUserBonus,
    calculateNextTierBonus,
    calculateRecurringPurchaseReward,
    calculateSingleInviteReward,
    calculateTierBonus,
    calculateTotalRewards,
    formatCurrency
} from '../../invite-rebate/rewardCalculator.js'

describe('rewardCalculator', () => {
  describe('calculateNewUserBonus', () => {
    it('should return the configured new user bonus', () => {
      expect(calculateNewUserBonus()).toBe(REWARD_RULES.NEW_USER_BONUS)
    })

    it('should return a positive value', () => {
      expect(calculateNewUserBonus()).toBeGreaterThan(0)
    })
  })

  describe('calculateFirstPurchaseReward', () => {
    it('should return 0 for null purchase amount', () => {
      expect(calculateFirstPurchaseReward(null)).toBe(0)
    })

    it('should return 0 for undefined purchase amount', () => {
      expect(calculateFirstPurchaseReward(undefined)).toBe(0)
    })

    it('should return 0 for zero purchase amount', () => {
      expect(calculateFirstPurchaseReward(0)).toBe(0)
    })

    it('should return 0 for negative purchase amount', () => {
      expect(calculateFirstPurchaseReward(-100)).toBe(0)
    })

    it('should calculate correct percentage-based reward', () => {
      const reward = calculateFirstPurchaseReward(100)
      expect(reward).toBe(100 * REWARD_RULES.FIRST_PURCHASE_PERCENT)
    })

    it('should cap reward at configured max', () => {
      const reward = calculateFirstPurchaseReward(10000)
      expect(reward).toBe(REWARD_RULES.FIRST_PURCHASE_MAX)
      expect(reward).toBeLessThan(10000 * REWARD_RULES.FIRST_PURCHASE_PERCENT)
    })

    it('should not cap reward below the max threshold', () => {
      const amount = REWARD_RULES.FIRST_PURCHASE_MAX / REWARD_RULES.FIRST_PURCHASE_PERCENT - 1
      const reward = calculateFirstPurchaseReward(amount)
      expect(reward).toBeCloseTo(REWARD_RULES.FIRST_PURCHASE_MAX - REWARD_RULES.FIRST_PURCHASE_PERCENT)
    })
  })

  describe('calculateRecurringPurchaseReward', () => {
    it('should return 0 for null purchase amount', () => {
      expect(calculateRecurringPurchaseReward(null)).toBe(0)
    })

    it('should return 0 for negative month index', () => {
      expect(calculateRecurringPurchaseReward(100, -1)).toBe(0)
    })

    it('should return 0 for month index beyond recurring months', () => {
      expect(calculateRecurringPurchaseReward(100, REWARD_RULES.RECURRING_MONTHS)).toBe(0)
      expect(calculateRecurringPurchaseReward(100, 999)).toBe(0)
    })

    it('should calculate correct recurring reward for valid month', () => {
      const reward = calculateRecurringPurchaseReward(100, 0)
      expect(reward).toBe(100 * REWARD_RULES.RECURRING_PERCENT)
    })

    it('should calculate same reward for all valid months', () => {
      const r1 = calculateRecurringPurchaseReward(100, 0)
      const r2 = calculateRecurringPurchaseReward(100, REWARD_RULES.RECURRING_MONTHS - 1)
      expect(r1).toBe(r2)
    })

    it('should cap recurring reward at configured max', () => {
      const reward = calculateRecurringPurchaseReward(10000, 0)
      expect(reward).toBe(REWARD_RULES.RECURRING_MAX)
    })
  })

  describe('calculateTierBonus', () => {
    it('should return 0 for zero converted invites', () => {
      expect(calculateTierBonus(0)).toBe(0)
    })

    it('should return 0 for negative converted invites', () => {
      expect(calculateTierBonus(-5)).toBe(0)
    })

    it('should return 0 for null value', () => {
      expect(calculateTierBonus(null)).toBe(0)
    })

    it('should return 0 when below first tier', () => {
      const firstTier = REWARD_RULES.TIER_BONUS[0]
      expect(calculateTierBonus(firstTier.invites - 1)).toBe(0)
    })

    it('should return correct bonus when exactly at first tier', () => {
      const firstTier = REWARD_RULES.TIER_BONUS[0]
      expect(calculateTierBonus(firstTier.invites)).toBe(firstTier.bonus)
    })

    it('should accumulate tier bonuses for reached tiers', () => {
      const tiers = REWARD_RULES.TIER_BONUS
      const midTier = tiers[Math.floor(tiers.length / 2)]
      let expectedAccumulated = 0
      for (let i = 0; i <= Math.floor(tiers.length / 2); i++) {
        expectedAccumulated += tiers[i].bonus
      }
      const bonus = calculateTierBonus(midTier.invites + 5)
      expect(bonus).toBe(expectedAccumulated)
    })

    it('should return sum of all tier bonuses when exceeding max tier', () => {
      const tiers = REWARD_RULES.TIER_BONUS
      let totalSum = 0
      for (let i = 0; i < tiers.length; i++) {
        totalSum += tiers[i].bonus
      }
      const lastTier = tiers[tiers.length - 1]
      expect(calculateTierBonus(lastTier.invites * 10)).toBe(totalSum)
    })

    it('should correctly accumulate at exact tier thresholds', () => {
      const tiers = REWARD_RULES.TIER_BONUS
      let accumulated = 0
      for (let i = 0; i < tiers.length; i++) {
        accumulated += tiers[i].bonus
        expect(calculateTierBonus(tiers[i].invites)).toBe(accumulated)
      }
    })
  })

  describe('calculateNextTierBonus', () => {
    it('should handle zero invites', () => {
      const result = calculateNextTierBonus(0)
      expect(result.reached).toBe(false)
      expect(result.nextTier).toBe(REWARD_RULES.TIER_BONUS[0].invites)
      expect(result.invitesNeeded).toBe(REWARD_RULES.TIER_BONUS[0].invites)
      expect(result.progress).toBe(0)
    })

    it('should handle negative invites', () => {
      const result = calculateNextTierBonus(-10)
      expect(result.reached).toBe(false)
      expect(result.progress).toBe(0)
    })

    it('should calculate progress correctly for mid tier', () => {
      const firstTier = REWARD_RULES.TIER_BONUS[0]
      const halfway = Math.floor(firstTier.invites / 2)
      const result = calculateNextTierBonus(halfway)
      expect(result.progress).toBe(Math.round((halfway / firstTier.invites) * 100))
      expect(result.invitesNeeded).toBe(firstTier.invites - halfway)
    })

    it('should show reached as true when at or beyond max tier', () => {
      const lastTier = REWARD_RULES.TIER_BONUS[REWARD_RULES.TIER_BONUS.length - 1]
      const result = calculateNextTierBonus(lastTier.invites + 100)
      expect(result.reached).toBe(true)
      expect(result.progress).toBe(100)
      expect(result.invitesNeeded).toBe(0)
      expect(result.nextBonus).toBe(0)
    })

    it('should show progress toward next tier exactly at threshold', () => {
      const tier = REWARD_RULES.TIER_BONUS[1]
      const nextTier = REWARD_RULES.TIER_BONUS[2]
      const result = calculateNextTierBonus(tier.invites)
      expect(result.reached).toBe(false)
      expect(result.nextTier).toBe(nextTier.invites)
      expect(result.progress).toBe(Math.round((tier.invites / nextTier.invites) * 100))
      expect(result.invitesNeeded).toBe(nextTier.invites - tier.invites)
    })
  })

  describe('calculateSingleInviteReward', () => {
    it('should return 0 for null record', () => {
      expect(calculateSingleInviteReward(null)).toBe(0)
    })

    it('should include only new user bonus when no purchases', () => {
      const reward = calculateSingleInviteReward({})
      expect(reward).toBe(REWARD_RULES.NEW_USER_BONUS)
    })

    it('should include first purchase reward', () => {
      const reward = calculateSingleInviteReward({
        firstPurchaseAmount: 500
      })
      const expected = REWARD_RULES.NEW_USER_BONUS + calculateFirstPurchaseReward(500)
      expect(reward).toBeCloseTo(expected)
    })

    it('should include recurring purchase rewards', () => {
      const record = {
        firstPurchaseAmount: 500,
        recurringPurchases: [
          { amount: 300, month: 0 },
          { amount: 200, month: 1 }
        ]
      }
      const reward = calculateSingleInviteReward(record)
      const expected =
        REWARD_RULES.NEW_USER_BONUS +
        calculateFirstPurchaseReward(500) +
        calculateRecurringPurchaseReward(300, 0) +
        calculateRecurringPurchaseReward(200, 1)
      expect(reward).toBeCloseTo(expected)
    })

    it('should ignore recurring purchases beyond max months', () => {
      const record = {
        recurringPurchases: [
          { amount: 100, month: REWARD_RULES.RECURRING_MONTHS + 1 }
        ]
      }
      const reward = calculateSingleInviteReward(record)
      expect(reward).toBe(REWARD_RULES.NEW_USER_BONUS)
    })
  })

  describe('calculateTotalRewards', () => {
    it('should return zero summary for null', () => {
      const summary = calculateTotalRewards(null)
      expect(summary.totalRewards).toBe(0)
      expect(summary.settledRewards).toBe(0)
      expect(summary.pendingRewards).toBe(0)
      expect(summary.frozenRewards).toBe(0)
      expect(summary.convertedCount).toBe(0)
    })

    it('should return zero summary for empty array', () => {
      const summary = calculateTotalRewards([])
      expect(summary.totalRewards).toBe(0)
      expect(summary.convertedCount).toBe(0)
    })

    it('should correctly calculate total for mixed records', () => {
      const records = [
        {
          status: 'converted',
          firstPurchaseAmount: 200,
          rewardStatus: 'settled'
        },
        {
          status: 'converted',
          firstPurchaseAmount: 100,
          rewardStatus: 'pending'
        },
        {
          status: 'converted',
          firstPurchaseAmount: 150,
          rewardStatus: 'processing'
        },
        {
          status: 'converted',
          firstPurchaseAmount: 300,
          rewardStatus: 'frozen'
        }
      ]
      const summary = calculateTotalRewards(records)
      expect(summary.convertedCount).toBe(4)
      expect(summary.settledRewards).toBeGreaterThan(0)
      expect(summary.pendingRewards).toBeGreaterThan(0)
      expect(summary.frozenRewards).toBeGreaterThan(0)
      expect(summary.totalRewards).toBe(
        summary.settledRewards +
        summary.pendingRewards +
        summary.frozenRewards +
        summary.tierBonus
      )
    })

    it('should include tier bonus for enough conversions', () => {
      const firstTier = REWARD_RULES.TIER_BONUS[0]
      const records = []
      for (let i = 0; i < firstTier.invites + 5; i++) {
        records.push({
          status: 'converted',
          rewardStatus: 'settled'
        })
      }
      const summary = calculateTotalRewards(records)
      expect(summary.tierBonus).toBeGreaterThan(0)
      expect(summary.totalRewards).toBe(summary.settledRewards + summary.tierBonus)
    })
  })

  describe('calculateFreezeReleaseDate', () => {
    it('should return null for null date', () => {
      expect(calculateFreezeReleaseDate(null)).toBeNull()
    })

    it('should return null for invalid date string', () => {
      expect(calculateFreezeReleaseDate('not-a-date')).toBeNull()
    })

    it('should correctly add freeze days to conversion date', () => {
      const conversionDate = new Date('2024-01-01')
      const releaseDate = calculateFreezeReleaseDate(conversionDate.toISOString())
      const expected = new Date(conversionDate)
      expected.setDate(expected.getDate() + SETTLEMENT_RULES.FREEZE_DAYS)
      expect(new Date(releaseDate).toDateString()).toBe(expected.toDateString())
    })

    it('should use custom freeze days when provided', () => {
      const conversionDate = new Date('2024-01-01')
      const customDays = 7
      const releaseDate = calculateFreezeReleaseDate(conversionDate.toISOString(), customDays)
      const expected = new Date(conversionDate)
      expected.setDate(expected.getDate() + customDays)
      expect(new Date(releaseDate).toDateString()).toBe(expected.toDateString())
    })
  })

  describe('calculateFreezeDaysRemaining', () => {
    it('should return 0 for null conversion date', () => {
      expect(calculateFreezeDaysRemaining(null)).toBe(0)
    })

    it('should return 0 for invalid conversion date', () => {
      expect(calculateFreezeDaysRemaining('invalid')).toBe(0)
    })

    it('should return correct remaining days within freeze period', () => {
      const now = new Date('2024-01-05')
      const conversionDate = new Date('2024-01-01')
      const remaining = calculateFreezeDaysRemaining(
        conversionDate.toISOString(),
        now,
        15
      )
      expect(remaining).toBe(11)
    })

    it('should return 0 when beyond freeze period', () => {
      const now = new Date('2024-02-01')
      const conversionDate = new Date('2024-01-01')
      const remaining = calculateFreezeDaysRemaining(
        conversionDate.toISOString(),
        now
      )
      expect(remaining).toBe(0)
    })

    it('should return full freeze days when conversion just happened', () => {
      const now = new Date('2024-01-01T12:00:00')
      const conversionDate = new Date('2024-01-01T00:00:00')
      const remaining = calculateFreezeDaysRemaining(
        conversionDate.toISOString(),
        now,
        15
      )
      expect(remaining).toBeGreaterThanOrEqual(14)
      expect(remaining).toBeLessThanOrEqual(15)
    })
  })

  describe('formatCurrency', () => {
    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('¥0.00')
    })

    it('should return default for null', () => {
      expect(formatCurrency(null)).toBe('¥0.00')
    })

    it('should return default for undefined', () => {
      expect(formatCurrency(undefined)).toBe('¥0.00')
    })

    it('should format positive amount correctly', () => {
      expect(formatCurrency(1234.567)).toBe('¥1234.57')
    })

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(100.1)).toBe('¥100.10')
    })

    it('should support USD currency', () => {
      expect(formatCurrency(100, 'USD')).toBe('$100.00')
    })

    it('should support EUR currency', () => {
      expect(formatCurrency(100, 'EUR')).toBe('€100.00')
    })

    it('should default to CNY for unknown currency', () => {
      expect(formatCurrency(100, 'UNKNOWN')).toBe('¥100.00')
    })
  })
})
