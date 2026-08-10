export type TaxRuleSource = "TEC" | "TIPI" | "CLASSIF" | "CAMEX" | "ACORDO" | "LEGISLACAO" | "MANUAL";

export type TaxRule = {
  ncm: string;
  ex?: string;
  tax: "II" | "IPI" | "PIS_IMPORT" | "COFINS_IMPORT";
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

/**
 * Resolve regras versionadas sem assumir que uma alíquota é eterna.
 * A tabela local é apenas uma camada de fallback/validação; a fonte oficial
 * deve prevalecer quando houver integração com Classif/Siscomex.
 */
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
      matchedBy: normalizeNcm(rule.ncm) === ncm ? "exact" : "prefix",
    }))
    .sort((a, b) => {
      const exact = Number(b.matchedBy === "exact") - Number(a.matchedBy === "exact");
      if (exact) return exact;
      return (b.priority ?? 0) - (a.priority ?? 0);
    });
}

/**
 * Não preenchemos alíquotas arbitrárias quando não existe regra confiável.
 * O consumidor deve tratar ausência como "necessita validação oficial".
 */
export function getRateForTax(rules: TaxRuleMatch[], tax: TaxRule) {
  return rules.find(rule => rule.tax === tax);
}
