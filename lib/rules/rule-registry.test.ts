import { describe, expect, it } from 'vitest';
import { isExecutableRule, isRuleEffective, type TaxRule } from './rule-registry';

const rule: TaxRule = {
  id: 'TEST-II-001',
  tax: 'II',
  jurisdiction: 'federal',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  rate: 10,
  calculationMethod: 'ad_valorem',
  status: 'validated',
  sourceType: 'law',
  legalBasis: 'TEST',
  sourceUrl: 'https://example.invalid/test',
};

describe('versioned tax rule registry', () => {
  it('only applies a rule inside its effective period', () => {
    expect(isRuleEffective(rule, '2026-06-01')).toBe(true);
    expect(isRuleEffective(rule, '2025-12-31')).toBe(false);
    expect(isRuleEffective(rule, '2027-01-01')).toBe(false);
  });

  it('does not execute draft or blocked rules', () => {
    expect(isExecutableRule({ ...rule, status: 'draft' })).toBe(false);
    expect(isExecutableRule({ ...rule, status: 'blocked' })).toBe(false);
    expect(isExecutableRule({ ...rule, status: 'validated' })).toBe(true);
    expect(isExecutableRule({ ...rule, status: 'conditional' })).toBe(true);
  });
});
