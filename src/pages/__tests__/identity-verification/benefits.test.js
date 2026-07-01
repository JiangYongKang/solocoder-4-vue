import { describe, it, expect } from 'vitest'
import {
  VERIFICATION_BENEFITS,
  UNVERIFIED_RESTRICTIONS,
  getBenefitsByStatus,
  getRestrictionsByStatus,
  formatBenefitList
} from '../../identity-verification/benefits.js'

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
        expect(benefit.unlocked).toBe(true)
      }
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
      const benefits = getBenefitsByStatus('approved')
      for (const benefit of benefits) {
        expect(benefit.unlocked).toBe(true)
      }
    })

    it('should mark all benefits as unlocked when status is not approved', () => {
      const statuses = ['not_submitted', 'pending', 'rejected']
      for (const status of statuses) {
        const benefits = getBenefitsByStatus(status)
        for (const benefit of benefits) {
          expect(benefit.unlocked).toBe(true)
        }
      }
    })

    it('should return same number of benefits regardless of status', () => {
      const expectedCount = VERIFICATION_BENEFITS.length
      const statuses = ['not_submitted', 'pending', 'approved', 'rejected']

      for (const status of statuses) {
        const benefits = getBenefitsByStatus(status)
        expect(benefits).toHaveLength(expectedCount)
      }
    })

    it('should not mutate original benefits array', () => {
      const originalUnlocked = VERIFICATION_BENEFITS[0].unlocked
      getBenefitsByStatus('approved')
      expect(VERIFICATION_BENEFITS[0].unlocked).toBe(originalUnlocked)
    })
  })

  describe('getRestrictionsByStatus', () => {
    it('should return empty array when status is approved', () => {
      const restrictions = getRestrictionsByStatus('approved')
      expect(restrictions).toEqual([])
    })

    it('should return all restrictions when status is not approved', () => {
      const statuses = ['not_submitted', 'pending', 'rejected']
      for (const status of statuses) {
        const restrictions = getRestrictionsByStatus(status)
        expect(restrictions).toEqual(UNVERIFIED_RESTRICTIONS)
        expect(restrictions).toHaveLength(UNVERIFIED_RESTRICTIONS.length)
      }
    })
  })

  describe('formatBenefitList', () => {
    it('should return correct structure with all benefits unlocked for approved status', () => {
      const result = formatBenefitList('approved')

      expect(result.unlocked).toHaveLength(VERIFICATION_BENEFITS.length)
      expect(result.locked).toHaveLength(0)
      expect(result.total).toBe(VERIFICATION_BENEFITS.length)
      expect(result.unlockedCount).toBe(VERIFICATION_BENEFITS.length)
    })

    it('should return correct structure with all benefits unlocked for non-approved status', () => {
      const result = formatBenefitList('not_submitted')

      expect(result.unlocked).toHaveLength(VERIFICATION_BENEFITS.length)
      expect(result.locked).toHaveLength(0)
      expect(result.total).toBe(VERIFICATION_BENEFITS.length)
      expect(result.unlockedCount).toBe(VERIFICATION_BENEFITS.length)
    })

    it('should separate unlocked and locked benefits correctly', () => {
      const result = formatBenefitList('approved')

      for (const benefit of result.unlocked) {
        expect(benefit.unlocked).toBe(true)
      }
      for (const benefit of result.locked) {
        expect(benefit.unlocked).toBe(false)
      }
    })

    it('should have correct counts that add up', () => {
      const result = formatBenefitList('pending')
      expect(result.unlocked.length + result.locked.length).toBe(result.total)
      expect(result.unlockedCount).toBe(result.unlocked.length)
    })
  })
})
