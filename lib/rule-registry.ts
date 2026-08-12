import type { RuleContext, RuleEvaluation, TaxRule } from './rule-engine';
import { evaluateRules } from './rule-engine';

export type RuleResolutionStatus = 'applicable' | 'insufficient_data' | 'not_applicable' | 'unvalidated';

export type RuleResolution = {
  status: RuleResolutionStatus;
  selectedRule?: TaxRule;
  evaluations: RuleEvaluation[];
  missingFields: string[];
  reasons: string[];
};

/**
 * Resolves contextual rules without embedding legislation in calculation code.
 *
 * Safety rule: an unvalidated rule can never become an applicable production
 * rule. Missing data is reported separately from a failed eligibility test.
 */
export function resolveRule(rules: TaxRule[], context: RuleContext, operationDate: string): RuleResolution {
  const evaluations = evaluateRules(rules, context, operationDate);
  const validMatches = evaluations.filter(e => e.matched && e.applicable);
  const unvalidatedMatches = evaluations.filter(e => e.matched && e.confidence === 'unvalidated');
  const missingFields = [...new Set(evaluations.flatMap(e => e.missingFields))];

  if (validMatches.length > 0) {
    const selected = rules.find(r => r.id === validMatches[0].ruleId);
    return { status: 'applicable', selectedRule: selected, evaluations, missingFields: [], reasons: [] };
  }
  if (unvalidatedMatches.length > 0) {
    return { status: 'unvalidated', evaluations, missingFields: [], reasons: ['Existe regra potencialmente aplicável, mas sem validação suficiente'] };
  }
  if (missingFields.length > 0) {
    return { status: 'insufficient_data', evaluations, missingFields, reasons: ['É necessário informar os campos indicados para concluir a elegibilidade'] };
  }
  return { status: 'not_applicable', evaluations, missingFields: [], reasons: ['Nenhuma regra validada foi considerada aplicável'] };
}
