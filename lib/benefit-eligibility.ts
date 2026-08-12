export type BenefitCondition = {
  field: string;
  operator: "equals" | "in" | "notIn" | "exists" | "dateBetween" | "requiresValidation";
  value?: string | string[];
  note?: string;
};

export type FiscalBenefitRule = {
  id: string;
  state: string;
  code?: string;
  name: string;
  tax: "ICMS" | "II" | "IPI" | "PIS_IMPORT" | "COFINS_IMPORT";
  validFrom: string;
  validTo?: string;
  legalSources: Array<{
    title: string;
    reference: string;
    url?: string;
  }>;
  conditions: BenefitCondition[];
  effect: {
    type: "rateReduction" | "baseReduction" | "creditPresumed" | "deferral" | "exemption" | "suspension" | "other";
    parameters: Record<string, string | number | boolean>;
  };
  requiresConcession: boolean;
  confidence: "validated" | "candidate" | "needsReview";
};

export type BenefitResolution = {
  applicable: "yes" | "no" | "conditional" | "insufficient-data";
  matched: FiscalBenefitRule[];
  warnings: string[];
};

export function resolveBenefits(
  rules: FiscalBenefitRule[],
  context: Record<string, unknown>,
  referenceDate: string,
): BenefitResolution {
  const warnings: string[] = [];
  const matched: FiscalBenefitRule[] = [];

  for (const rule of rules) {
    if (rule.validFrom > referenceDate || (rule.validTo && referenceDate > rule.validTo)) continue;

    let failed = false;
    let conditional = rule.confidence !== "validated" || rule.requiresConcession;

    for (const condition of rule.conditions) {
      if (condition.operator === "requiresValidation") {
        conditional = true;
        continue;
      }

      const actual = context[condition.field];
      if (condition.operator === "exists" && (actual === undefined || actual === null || actual === "")) {
        failed = true;
        break;
      }
      if (condition.operator === "equals" && actual !== condition.value) {
        failed = true;
        break;
      }
      if (condition.operator === "in" && !Array.isArray(condition.value) || (condition.operator === "in" && !condition.value.includes(String(actual)))) {
        failed = true;
        break;
      }
      if (condition.operator === "notIn" && Array.isArray(condition.value) && condition.value.includes(String(actual))) {
        failed = true;
        break;
      }
    }

    if (!failed) matched.push(rule);
  }

  for (const rule of matched) {
    if (rule.requiresConcession) warnings.push(`${rule.name}: depende de regime especial/ato concessório do contribuinte.`);
    if (rule.confidence !== "validated") warnings.push(`${rule.name}: regra ainda exige validação jurídica antes de ser usada como resultado definitivo.`);
  }

  if (!matched.length) return { applicable: "no", matched, warnings };
  if (warnings.length) return { applicable: "conditional", matched, warnings };
  return { applicable: "yes", matched, warnings };
}
