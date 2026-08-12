import type { RuleContext, TaxRule } from './rule-engine';
import { resolveRule } from './rule-registry';
import type { TributaryOperation } from './tributary-engine';

export type RuleBridgeResult = {
  operation: TributaryOperation;
  selectedRuleId?: string;
  status: 'applicable' | 'insufficient_data' | 'not_applicable' | 'unvalidated';
  missingFields: string[];
  reasons: string[];
  audit: {
    ruleId?: string;
    legalBasis?: string;
    source?: string;
    confidence?: string;
  };
};

/**
 * Connects contextual rule resolution to the calculation layer.
 *
 * Safety invariant: only a validated, applicable rule can mutate a tax input.
 * Conditional/unvalidated rules are returned as metadata and never silently
 * alter the calculation.
 */
export function resolveTributaryOperation(
  baseOperation: TributaryOperation,
  rules: TaxRule[],
  context: RuleContext,
  operationDate: string,
): RuleBridgeResult {
  const resolution = resolveRule(rules, context, operationDate);
  const selected = resolution.selectedRule;
  const operation: TributaryOperation = { ...baseOperation };

  if (resolution.status === 'applicable' && selected) {
    for (const action of selected.actions) {
      if (action.type === 'set_rate' && typeof action.value === 'number') {
        if (action.target === 'iiRate') operation.iiRate = action.value;
        if (action.target === 'ipiRate') operation.ipiRate = action.value;
        if (action.target === 'pisImportRate') operation.pisImportRate = action.value;
        if (action.target === 'cofinsImportRate') operation.cofinsImportRate = action.value;
        if (action.target === 'icmsRate') operation.icmsRate = action.value;
      }
      if (action.type === 'set_base_component' && action.target === 'icmsTaxableAdditionsBrl' && typeof action.value === 'number') {
        operation.icmsTaxableAdditionsBrl = action.value;
      }
    }
  }

  return {
    operation,
    selectedRuleId: selected?.id,
    status: resolution.status,
    missingFields: resolution.missingFields,
    reasons: resolution.reasons,
    audit: {
      ruleId: selected?.id,
      legalBasis: selected?.legalBasis,
      source: selected?.source,
      confidence: selected?.confidence,
    },
  };
}
