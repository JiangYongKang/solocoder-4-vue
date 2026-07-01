import { describe, expect, it } from 'vitest'
import {
    UNVERIFIED_RESTRICTIONS,
    VERIFICATION_BENEFITS,
    formatBenefitList,
    getBenefitsByStatus,
    getRestrictionsByStatus
} from '../../identity-verification/benefits.js'
import { VERIFICATION_STATUS } from '../../identity-verification/constants.js'

const NOT_SUBMITTED = VERIFICATION_STATUS.NOT_SUBMITTED
const PENDING = VERIFICATION_STATUS.PENDING
const APPROVED = VERIFICATION_STATUS.APPROVED
const REJECTED = VERIFICATION_STATUS.REJECTED

describe('benefits', () => {
  describe('VERIFICATION_BENEFITS', () => {
    it('should have 6 benefits defined', () => {
      expect(VERIFICATION_BENEFITS).toHaveLength(6)
    })

    it('should have correct structure for each benefit', () => {
      for (const benefit of VERIFICATION_BENEFITS) {
        expect(benefit.id).toBeDefined()
        expect(benefit.icon).toBeDefined()
        expect(benefit.title).toBeDefined()
        expect(benefit.description).toBeDefined()
        expect(typeof benefit.unlocked).toBe('boolean')
      }
    })

    it('should have some benefits initially unlocked and others locked', () => {
      const unlockedCount = VERIFICATION_BENEFITS.filter(b => b.unlocked).length
      const lockedCount = VERIFICATION_BENEFITS.filter(b => !b.unlocked).length

      expect(unlockedCount).toBeGreaterThan(0)
      expect(lockedCount).toBeGreaterThan(0)
      expect(unlockedCount + lockedCount).toBe(VERIFICATION_BENEFITS.length)
    })

    it('should have security_protection initially unlocked', () => {
      const security = VERIFICATION_BENEFITS.find(b => b.id === 'security_protection')
      expect(security).toBeDefined()
      expect(security.unlocked).toBe(true)
    })

    it('should have unlock_transaction initially locked until verified', () => {
      const tx = VERIFICATION_BENEFITS.find(b => b.id === 'unlock_transaction')
      expect(tx).toBeDefined()
      expect(tx.unlocked).toBe(false)
    })

    it('should have unique benefit IDs', () => {
      const ids = VERIFICATION_BENEFITS.map(b => b.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should include expected benefit categories', () => {
      const benefitIds = VERIFICATION_BENEFITS.map(b => b.id)
      expect(benefitIds).toContain('unlock_transaction')
      expect(benefitIds).toContain('increase_limit')
      expect(benefitIds).toContain('security_protection')
      expect(benefitIds).toContain('priority_service')
      expect(benefitIds).toContain('feature_access')
      expect(benefitIds).toContain('activity_participation')
    })
  })

  describe('UNVERIFIED_RESTRICTIONS', () => {
    it('should have 3 restrictions defined', () => {
      expect(UNVERIFIED_RESTRICTIONS).toHaveLength(3)
    })

    it('should have correct structure for each restriction', () => {
      for (const restriction of UNVERIFIED_RESTRICTIONS) {
        expect(restriction.id).toBeDefined()
        expect(restriction.icon).toBeDefined()
        expect(restriction.title).toBeDefined()
        expect(restriction.description).toBeDefined()
      }
    })

    it('should have unique restriction IDs', () => {
      const ids = UNVERIFIED_RESTRICTIONS.map(r => r.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('getBenefitsByStatus', () => {
    it('should mark all benefits as unlocked when status is approved', () => {
      const benefits = getBenefitsByStatus(APPROVED)
      for (const benefit of benefits) {
        expect(benefit.unlocked).toBe(true)
      }
    })

    it('should keep initial unlocked benefits unlocked when status is not approved', () => {
      const statuses = [NOT_SUBMITTED, PENDING, REJECTED]
      const initiallyUnlocked = VERIFICATION_BENEFITS.filter(b => b.unlocked)

      for (const status of statuses) {
        const benefits = getBenefitsByStatus(status)
        for (const initial of initiallyUnlocked) {
          const found = benefits.find(b => b.id === initial.id)
          expect(found.unlocked).toBe(true)
        }
      }
    })

    it('should keep initial locked benefits locked when status is not approved', () => {
      const statuses = [NOT_SUBMITTED, PENDING, REJECTED]
      const initiallyLocked = VERIFICATION_BENEFITS.filter(b => !b.unlocked)

      for (const status of statuses) {
        const benefits = getBenefitsByStatus(status)
        for (const initial of initiallyLocked) {
          const found = benefits.find(b => b.id === initial.id)
          expect(found.unlocked).toBe(false)
        }
      }
    })

    it('should return same number of benefits regardless of status', () => {
      const expectedCount = VERIFICATION_BENEFITS.length
      const statuses = [NOT_SUBMITTED, PENDING, APPROVED, REJECTED]

      for (const status of statuses) {
        const benefits = getBenefitsByStatus(status)
        expect(benefits).toHaveLength(expectedCount)
      }
    })

    it('should not mutate original benefits array', () => {
      const originalUnlocked = VERIFICATION_BENEFITS.map(b => ({ id: b.id, unlocked: b.unlocked }))
      getBenefitsByStatus(APPROVED)
      getBenefitsByStatus(NOT_SUBMITTED)

      for (let i = 0; i < VERIFICATION_BENEFITS.length; i++) {
        expect(VERIFICATION_BENEFITS[i].unlocked).toBe(originalUnlocked[i].unlocked)
      }
    })
  })

  describe('getRestrictionsByStatus', () => {
    it('should return empty array when status is approved', () => {
      const restrictions = getRestrictionsByStatus(APPROVED)
      expect(restrictions).toEqual([])
    })

    it('should return all restrictions when status is not approved', () => {
      const statuses = [NOT_SUBMITTED, PENDING, REJECTED]
      for (const status of statuses) {
        const restrictions = getRestrictionsByStatus(status)
        expect(restrictions).toEqual(UNVERIFIED_RESTRICTIONS)
        expect(restrictions).toHaveLength(UNVERIFIED_RESTRICTIONS.length)
      }
    })
  })

  describe('formatBenefitList', () => {
    it('should return correct structure with all benefits unlocked for approved status', () => {
      const result = formatBenefitList(APPROVED)

      expect(result.unlocked).toHaveLength(VERIFICATION_BENEFITS.length)
      expect(result.locked).toHaveLength(0)
      expect(result.total).toBe(VERIFICATION_BENEFITS.length)
      expect(result.unlockedCount).toBe(VERIFICATION_BENEFITS.length)
    })

    it('should return correct structure with mixed unlock status for non-approved status', () => {
      const statuses = [NOT_SUBMITTED, PENDING, REJECTED]
      const expectedUnlocked = VERIFICATION_BENEFITS.filter(b => b.unlocked).length
      const expectedLocked = VERIFICATION_BENEFITS.filter(b => !b.unlocked).length

      for (const status of statuses) {
        const result = formatBenefitList(status)

        expect(result.unlocked).toHaveLength(expectedUnlocked)
        expect(result.locked).toHaveLength(expectedLocked)
        expect(result.total).toBe(VERIFICATION_BENEFITS.length)
        expect(result.unlockedCount).toBe(expectedUnlocked)
      }
    })

    it('should have locked benefits present for not_submitted status', () => {
      const result = formatBenefitList(NOT_SUBMITTED)
      expect(result.locked.length).toBeGreaterThan(0)

      for (const benefit of result.locked) {
        expect(benefit.unlocked).toBe(false)
      }
    })

    it('should separate unlocked and locked benefits correctly', () => {
      const result = formatBenefitList(NOT_SUBMITTED)

      for (const benefit of result.unlocked) {
        expect(benefit.unlocked).toBe(true)
      }
      for (const benefit of result.locked) {
        expect(benefit.unlocked).toBe(false)
      }
    })

    it('should have correct counts that add up', () => {
      const statuses = [NOT_SUBMITTED, PENDING, APPROVED, REJECTED]
      for (const status of statuses) {
        const result = formatBenefitList(status)
        expect(result.unlocked.length + result.locked.length).toBe(result.total)
        expect(result.unlockedCount).toBe(result.unlocked.length)
      }
    })
  })
})
