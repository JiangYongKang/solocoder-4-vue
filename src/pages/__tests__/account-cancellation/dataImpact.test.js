import { describe, it, expect } from 'vitest'
import {
  DATA_IMPACTS,
  IRREVERSIBLE_RISKS,
  getDataImpactsByScope,
  getIrreversibleItems,
  getHighRiskCategories,
  getScopeLabel,
  countDataItems
} from '../../account-cancellation/dataImpact.js'
import { DATA_CLEAR_SCOPE } from '../../account-cancellation/constants.js'

describe('dataImpact', () => {
  describe('DATA_IMPACTS', () => {
    it('should have all 5 categories', () => {
      expect(DATA_IMPACTS).toHaveLength(5)
    })

    it('should have required fields for each category', () => {
      for (const category of DATA_IMPACTS) {
        expect(category.id).toBeDefined()
        expect(category.icon).toBeDefined()
        expect(category.title).toBeDefined()
        expect(category.description).toBeDefined()
        expect(Array.isArray(category.items)).toBe(true)
        expect(category.items.length).toBeGreaterThan(0)
      }
    })

    it('should have required fields for each item', () => {
      for (const category of DATA_IMPACTS) {
        for (const item of category.items) {
          expect(item.name).toBeDefined()
          expect(item.scope).toBeDefined()
          expect(item.irreversible).toBeDefined()
          expect(typeof item.irreversible).toBe('boolean')
        }
      }
    })
  })

  describe('IRREVERSIBLE_RISKS', () => {
    it('should have at least 3 risks', () => {
      expect(IRREVERSIBLE_RISKS.length).toBeGreaterThanOrEqual(3)
    })

    it('should have required fields for each risk', () => {
      for (const risk of IRREVERSIBLE_RISKS) {
        expect(risk.id).toBeDefined()
        expect(risk.icon).toBeDefined()
        expect(risk.title).toBeDefined()
        expect(risk.description).toBeDefined()
      }
    })
  })

  describe('getDataImpactsByScope', () => {
    it('should return correct items for IMMEDIATE scope', () => {
      const result = getDataImpactsByScope(DATA_CLEAR_SCOPE.IMMEDIATE)
      expect(Array.isArray(result)).toBe(true)
      for (const category of result) {
        for (const item of category.items) {
          expect(item.scope).toBe(DATA_CLEAR_SCOPE.IMMEDIATE)
        }
      }
    })

    it('should return correct items for COOLING_PERIOD_END scope', () => {
      const result = getDataImpactsByScope(DATA_CLEAR_SCOPE.COOLING_PERIOD_END)
      expect(Array.isArray(result)).toBe(true)
      for (const category of result) {
        for (const item of category.items) {
          expect(item.scope).toBe(DATA_CLEAR_SCOPE.COOLING_PERIOD_END)
        }
      }
    })

    it('should return correct items for RETAINED scope', () => {
      const result = getDataImpactsByScope(DATA_CLEAR_SCOPE.RETAINED)
      expect(Array.isArray(result)).toBe(true)
      for (const category of result) {
        for (const item of category.items) {
          expect(item.scope).toBe(DATA_CLEAR_SCOPE.RETAINED)
        }
      }
    })

    it('should return empty array for non-existent scope', () => {
      const result = getDataImpactsByScope('non_existent')
      expect(result).toEqual([])
    })

    it('should not contain empty categories', () => {
      const scopes = Object.values(DATA_CLEAR_SCOPE)
      for (const scope of scopes) {
        const result = getDataImpactsByScope(scope)
        for (const category of result) {
          expect(category.items.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('getIrreversibleItems', () => {
    it('should return only irreversible items', () => {
      const result = getIrreversibleItems()
      expect(Array.isArray(result)).toBe(true)
      for (const category of result) {
        for (const item of category.items) {
          expect(item.irreversible).toBe(true)
        }
      }
    })

    it('should not contain reversible items', () => {
      const result = getIrreversibleItems()
      for (const category of result) {
        const reversibleItems = category.items.filter(i => i.irreversible === false)
        expect(reversibleItems).toHaveLength(0)
      }
    })
  })

  describe('getHighRiskCategories', () => {
    it('should return only high risk categories', () => {
      const result = getHighRiskCategories()
      expect(Array.isArray(result)).toBe(true)
      for (const category of result) {
        expect(category.warningLevel).toBe('high')
      }
    })
  })

  describe('getScopeLabel', () => {
    it('should return correct label for each scope', () => {
      expect(getScopeLabel(DATA_CLEAR_SCOPE.IMMEDIATE)).toBe('立即清除')
      expect(getScopeLabel(DATA_CLEAR_SCOPE.COOLING_PERIOD_END)).toBe('冷静期结束清除')
      expect(getScopeLabel(DATA_CLEAR_SCOPE.RETAINED)).toBe('依法保留')
    })

    it('should return empty string for invalid scope', () => {
      expect(getScopeLabel('invalid_scope')).toBe('')
    })
  })

  describe('countDataItems', () => {
    it('should return total and irreversible counts', () => {
      const counts = countDataItems()
      expect(counts.total).toBeDefined()
      expect(counts.irreversible).toBeDefined()
      expect(typeof counts.total).toBe('number')
      expect(typeof counts.irreversible).toBe('number')
      expect(counts.total).toBeGreaterThan(0)
      expect(counts.irreversible).toBeGreaterThan(0)
    })

    it('should have irreversible count not exceeding total', () => {
      const counts = countDataItems()
      expect(counts.irreversible).toBeLessThanOrEqual(counts.total)
    })

    it('should match manual count', () => {
      let total = 0
      let irreversible = 0
      for (const category of DATA_IMPACTS) {
        total += category.items.length
        irreversible += category.items.filter(i => i.irreversible).length
      }
      const counts = countDataItems()
      expect(counts.total).toBe(total)
      expect(counts.irreversible).toBe(irreversible)
    })
  })
})
