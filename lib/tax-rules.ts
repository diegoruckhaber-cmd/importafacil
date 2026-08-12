export type TaxRuleSource = "TEC" | "TIPI" | "CLASSIF" | "CAMEX" | "ACORDO" | "LEGISLACAO" | "MANUAL";

export type TaxType = "II" | "IPI" | "PIS_IMPORT" | "COFINS_IMPORT";

export type TaxRule = {
  ncm: string;
  ex?: string;
  tax: TaxType;
  rate: number;
  effectiveFrom: string;
  effectiveTo?: string;
  source: TaxRuleSource;
  legalBasis?: string;
  note?: string;
  priority?: number;
};

export type TaxRuleLookup = {
  ncm: string;
  date: string;
  ex?: string;
};

export type TaxRuleMatch = TaxRule & { matchedBy: "exact" | "prefix" };

const normalizeNcm = (value: string) => value.replace(/[^0-9]/g, "").slice(0, 8);

const isEffective = (rule: TaxRule, date: string) =>
  rule.effectiveFrom <= date && (!rule.effectiveTo || date <= rule.effectiveTo);

export function findTaxRules(lookup: TaxRuleLookup, rules: TaxRule[]): TaxRuleMatch[] {
  const ncm = normalizeNcm(lookup.ncm);
  if (ncm.length !== 8) return [];

  return rules
    .filter(rule => {
      const ruleNcm = normalizeNcm(rule.ncm);
      const ncmMatches = ruleNcm === ncm || ncm.startsWith(ruleNcm);
      const exMatches = !rule.ex || rule.ex === lookup.ex;
      return ncmMatches && exMatches && isEffective(rule, lookup.date);
    })
    .map(rule => ({
      ...rule,
      matchedBy: normalizeNcm(rule.ncm) === ncm ? "exact" as const : "prefix" as const,
    }))
    .sort((a, b) => {
      const exact = Number(b.matchedBy === "exact") - Number(a.matchedBy === "exact");
      if (exact) return exact;
      return (b.priority ?? 0) - (a.priority ?? 0);
    });
}

/**
 * Returns the selected rule for a tax type. Absence means the rate requires
 * an authoritative source lookup and must not be silently guessed.
 */
export function getRateForTax(rules: TaxRuleMatch[], tax: TaxType): TaxRuleMatch | undefined {
  return rules.find(rule => rule.tax === tax);
}
