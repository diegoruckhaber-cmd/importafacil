import { evaluateRule, evaluateRules, TaxRule } from './rule-engine';

const rule: TaxRule = {
  id: 'TEST-SC-001',
  jurisdiction: 'SC',
  tax: 'ICMS',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  priority: 100,
  conditions: [
    { field: 'uf', operator: 'eq', value: 'SC' },
    { field: 'finalidade', operator: 'eq', value: 'comercializacao' },
    { field: 'ncm', operator: 'eq', value: '12345678' },
  ],
  actions: [{ type: 'set_rate', target: 'icms', value: 4 }],
  legalBasis: 'TEST',
  source: 'internal-test',
  confidence: 'validated',
};

describe('contextual rule engine', () => {
  it('matches when every condition is satisfied', () => {
    const result = evaluateRule(rule, { uf: 'SC', finalidade: 'comercializacao', ncm: '12345678' }, '2026-08-12');
    expect(result.matched).toBe(true);
    expect(result.applicable).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it('distinguishes missing data from an ineligible operation', () => {
    const missing = evaluateRule(rule, { uf: 'SC', ncm: '12345678' }, '2026-08-12');
    expect(missing.matched).toBe(false);
    expect(missing.missingFields).toContain('finalidade');

    const ineligible = evaluateRule(rule, { uf: 'SC', finalidade: 'industrializacao', ncm: '12345678' }, '2026-08-12');
    expect(ineligible.matched).toBe(false);
    expect(ineligible.missingFields).toHaveLength(0);
    expect(ineligible.reasons.length).toBeGreaterThan(0);
  });

  it('rejects rules outside their effective period', () => {
    const result = evaluateRule(rule, { uf: 'SC', finalidade: 'comercializacao', ncm: '12345678' }, '2027-01-01');
    expect(result.matched).toBe(false);
    expect(result.reasons[0]).toContain('vigência');
  });

  it('does not mark an unvalidated rule as applicable', () => {
    const unvalidated = { ...rule, id: 'TEST-UNVALIDATED', confidence: 'unvalidated' as const };
    const result = evaluateRule(unvalidated, { uf: 'SC', finalidade: 'comercializacao', ncm: '12345678' }, '2026-08-12');
    expect(result.matched).toBe(true);
    expect(result.applicable).toBe(false);
    expect(result.reasons[0]).toContain('não validada');
  });

  it('evaluates rules by priority', () => {
    const lower = { ...rule, id: 'LOW', priority: 1 };
    const higher = { ...rule, id: 'HIGH', priority: 10 };
    const results = evaluateRules([lower, higher], { uf: 'SC', finalidade: 'comercializacao', ncm: '12345678' }, '2026-08-12');
    expect(results.map(r => r.ruleId)).toEqual(['HIGH', 'LOW']);
  });
});
