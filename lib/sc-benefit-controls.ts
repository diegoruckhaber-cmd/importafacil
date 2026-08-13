import type { RuleCondition } from './rule-engine';

export type ScBenefitControl = {
  id: string;
  legalBasis: string;
  source: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'validated' | 'conditional';
  conditions: RuleCondition[];
  effect: 'block_presumed_credit' | 'requires_taxpayer_status_check' | 'requires_period_aggregate' | 'requires_regime_specific_check';
  notes: string[];
};

/**
 * Controls that must be checked before a Santa Catarina presumed-credit benefit
 * is allowed to affect a production calculation.
 *
 * These are deliberately separate from rate/credit rules: failure here blocks
 * the benefit rather than silently changing the tax arithmetic.
 */
export const SC_BENEFIT_CONTROLS_2026: ScBenefitControl[] = [
  {
    id: 'SC-CREDIT-PRESUMED-DEBT-2026',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 25-B, I, redação da Alteração 4.967',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1416.htm',
    effectiveFrom: '2026-02-12',
    status: 'validated',
    conditions: [
      { field: 'beneficiary.hasStateTaxDebt', operator: 'eq', value: true },
    ],
    effect: 'block_presumed_credit',
    notes: ['A existência de débito com a Fazenda estadual, inscrito ou não em dívida ativa, impede a fruição do crédito presumido.'],
  },
  {
    id: 'SC-CREDIT-PRESUMED-COMPLIANCE-2026',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 25-B, II, redação da Alteração 4.967',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1416.htm',
    effectiveFrom: '2026-02-12',
    status: 'conditional',
    conditions: [
      { field: 'beneficiary.isCompliantWithRequiredObligations', operator: 'eq', value: false },
    ],
    effect: 'requires_taxpayer_status_check',
    notes: ['O motor deve exigir confirmação da situação de conformidade prevista na legislação antes de aplicar crédito presumido.'],
  },
  {
    id: 'SC-TTD-110B-PERIOD-AGGREGATE',
    legalBasis: 'RICMS/SC-01, art. 110-B, III, Alteração 4.988',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1551.htm',
    effectiveFrom: '2026-06-09',
    effectiveTo: '2027-06-08',
    status: 'validated',
    conditions: [
      { field: 'product.originMercosur', operator: 'eq', value: true },
      { field: 'customs.entryState', operator: 'neq', value: 'SC' },
      { field: 'customs.entryMode', operator: 'eq', value: 'land' },
      { field: 'customs.clearanceState', operator: 'neq', value: 'SC' },
    ],
    effect: 'requires_period_aggregate',
    notes: ['A condição de 50% é aferida sobre o conjunto das importações originárias de países membros ou associados ao MERCOSUL no período. Uma operação isolada não comprova o requisito.'],
  },
  {
    id: 'SC-TTD-409-410-REGIME-SPECIFIC',
    legalBasis: 'Lei 17.763/2019, art. 1º e ato concessivo',
    source: 'https://legislacao.sef.sc.gov.br/html/leis/2019/lei_19_17763.htm',
    effectiveFrom: '2019-08-13',
    status: 'conditional',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'beneficiary.actValid', operator: 'eq', value: false },
    ],
    effect: 'requires_regime_specific_check',
    notes: ['O número do TTD, isoladamente, não comprova a fruição. O ato concessivo e suas condições devem ser considerados.'],
  },
];
