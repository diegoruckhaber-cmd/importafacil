export type RuleConfidence = 'validated' | 'conditional' | 'unvalidated';

export type RuleCondition = {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'not_in' | 'gte' | 'lte' | 'exists';
  value?: string | number | boolean | Array<string | number>;
};

export type RuleAction = {
  type: 'set_rate' | 'set_base_component' | 'apply_factor' | 'flag' | 'block';
  target: string;
  value?: number | string | boolean;
};

export type TaxRule = {
  id: string;
  jurisdiction: string;
  tax: string;
  effectiveFrom: string;
  effectiveTo?: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  legalBasis: string;
  source: string;
  confidence: RuleConfidence;
};

export type RuleEvaluation = {
  ruleId: string;
  matched: boolean;
  applicable: boolean;
  missingFields: string[];
  reasons: string[];
  confidence: RuleConfidence;
};

export type RuleContext = Record<string, unknown>;

const getValue = (context: RuleContext, field: string) => context[field];

function conditionMatches(condition: RuleCondition, context: RuleContext): { matched: boolean; missing: boolean } {
  const actual = getValue(context, condition.field);
  if (condition.operator === 'exists') return { matched: actual !== undefined && actual !== null, missing: false };
  if (actual === undefined || actual === null || actual === '') return { matched: false, missing: true };
  switch (condition.operator) {
    case 'eq': return { matched: actual === condition.value, missing: false };
    case 'neq': return { matched: actual !== condition.value, missing: false };
    case 'in': return { matched: Array.isArray(condition.value) && condition.value.includes(actual as never), missing: false };
    case 'not_in': return { matched: Array.isArray(condition.value) && !condition.value.includes(actual as never), missing: false };
    case 'gte': return { matched: Number(actual) >= Number(condition.value), missing: false };
    case 'lte': return { matched: Number(actual) <= Number(condition.value), missing: false };
  }
}

export function evaluateRule(rule: TaxRule, context: RuleContext, operationDate: string): RuleEvaluation {
  const start = new Date(rule.effectiveFrom).getTime();
  const end = rule.effectiveTo ? new Date(rule.effectiveTo).getTime() : Infinity;
  const date = new Date(operationDate).getTime();
  const reasons: string[] = [];
  const missingFields = new Set<string>();

  if (date < start || date > end) {
    return { ruleId: rule.id, matched: false, applicable: false, missingFields: [], reasons: ['Regra fora da vigência da operação'], confidence: rule.confidence };
  }

  for (const condition of rule.conditions) {
    const result = conditionMatches(condition, context);
    if (result.missing) missingFields.add(condition.field);
    if (!result.matched && !result.missing) reasons.push(`Condição não atendida: ${condition.field}`);
  }

  if (missingFields.size > 0) {
    return { ruleId: rule.id, matched: false, applicable: false, missingFields: [...missingFields], reasons: ['Dados insuficientes para determinar a aplicabilidade'], confidence: rule.confidence };
  }

  if (reasons.length > 0) {
    return { ruleId: rule.id, matched: false, applicable: false, missingFields: [], reasons, confidence: rule.confidence };
  }

  return { ruleId: rule.id, matched: true, applicable: rule.confidence !== 'unvalidated', missingFields: [], reasons: rule.confidence === 'unvalidated' ? ['Regra encontrada, mas ainda não validada'] : [], confidence: rule.confidence };
}

export function evaluateRules(rules: TaxRule[], context: RuleContext, operationDate: string): RuleEvaluation[] {
  return [...rules]
    .sort((a, b) => b.priority - a.priority)
    .map(rule => evaluateRule(rule, context, operationDate));
}
