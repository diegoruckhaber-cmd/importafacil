export type RuleStatus = 'draft' | 'validated' | 'conditional' | 'blocked';
export type RuleSourceType = 'law' | 'decree' | 'instruction' | 'siscomex' | 'state_rule' | 'official_consultation';

export type TaxRule = {
  id: string;
  tax: 'II' | 'IPI' | 'PIS_IMPORT' | 'COFINS_IMPORT' | 'ICMS' | 'OTHER';
  jurisdiction: 'federal' | string;
  ncm?: string;
  ex?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  rate?: number;
  calculationMethod?: 'ad_valorem' | 'tax_inclusive' | 'specific' | 'reduction' | 'exemption' | 'suspension' | 'credit';
  status: RuleStatus;
  sourceType: RuleSourceType;
  legalBasis: string;
  sourceUrl: string;
  conditions?: string[];
  notes?: string;
};

/**
 * Versioned rule registry contract.
 *
 * The calculator must never infer a tax treatment from an incomplete rule.
 * A rule is executable only when its status is validated or when an explicit
 * conditional path has collected every required condition from the user.
 */
export const RULE_REGISTRY_VERSION = '2026.08.12';

export const isRuleEffective = (rule: TaxRule, operationDate: string): boolean => {
  return operationDate >= rule.effectiveFrom && (!rule.effectiveTo || operationDate <= rule.effectiveTo);
};

export const isExecutableRule = (rule: TaxRule): boolean =>
  rule.status === 'validated' || rule.status === 'conditional';
