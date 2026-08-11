export type NcmTaxRule = {
  id: string;
  ncm: string;
  tax: "II" | "IPI" | "PIS_IMPORT" | "COFINS_IMPORT";
  rate: number;
  validFrom: string;
  validTo?: string;
  source: string;
  legalBasis: string;
  priority?: number;
  kind?: "exact" | "prefix" | "ex";
};

export type NcmTaxResolution = {
  ncm: string;
  referenceDate: string;
  rules: NcmTaxRule[];
  needsOfficialValidation: boolean;
  confidence: "official-source" | "local-cache" | "unresolved";
  message: string;
};

export function normalizeNcm(value: string): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 8 ? digits : "";
}

function isInValidityWindow(rule: NcmTaxRule, date: string) {
  return rule.validFrom <= date && (!rule.validTo || date <= rule.validTo);
}

function matches(rule: NcmTaxRule, ncm: string) {
  const ruleNcm = normalizeNcm(rule.ncm);
  if (!ruleNcm) return false;
  if (rule.kind === "prefix") return ncm.startsWith(ruleNcm);
  return ruleNcm === ncm;
}

/**
 * Resolves only rules that are explicitly present in the local rule set.
 * Local rules are treated as cache/fallback, never as fiscal authority.
 */
export function resolveNcmTaxTreatment(
  ncmInput: string,
  referenceDate: string,
  rules: NcmTaxRule[],
): NcmTaxResolution {
  const ncm = normalizeNcm(ncmInput);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(referenceDate)
    ? referenceDate
    : new Date().toISOString().slice(0, 10);

  if (!ncm) {
    return {
      ncm: "",
      referenceDate: date,
      rules: [],
      needsOfficialValidation: true,
      confidence: "unresolved",
      message: "Informe uma NCM válida com 8 dígitos.",
    };
  }

  const matchesForDate = rules
    .filter((rule) => matches(rule, ncm) && isInValidityWindow(rule, date))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const hasOfficial = matchesForDate.some((rule) =>
    /receita|siscomex|classif|camex|tipi|tec/i.test(`${rule.source} ${rule.legalBasis}`),
  );

  return {
    ncm,
    referenceDate: date,
    rules: matchesForDate,
    needsOfficialValidation: !hasOfficial,
    confidence: hasOfficial ? "official-source" : matchesForDate.length ? "local-cache" : "unresolved",
    message: hasOfficial
      ? "Tratamento encontrado com referência oficial cadastrada."
      : matchesForDate.length
        ? "Há uma regra local, mas ela não é considerada autoridade fiscal. Valide nas fontes oficiais antes de usar o resultado para uma decisão definitiva."
        : "Nenhuma regra oficial vigente está cadastrada para esta NCM. O ImportaFácil não irá inventar uma alíquota.",
  };
}
