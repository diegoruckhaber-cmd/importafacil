export type TaxBenefitType =
  | "exemption"
  | "reduction"
  | "suspension"
  | "presumed-credit"
  | "deferred-payment"
  | "special-regime";

export type TaxBenefitRule = {
  id: string;
  name: string;
  tax: "II" | "IPI" | "PIS_IMPORT" | "COFINS_IMPORT" | "ICMS" | "IBS" | "CBS" | "IS";
  type: TaxBenefitType;
  validFrom: string;
  validTo?: string;
  source: string;
  legalBasis: string;
  ncmPrefixes?: string[];
  ufs?: string[];
  regimes?: string[];
  conditions: string[];
  rateReductionPercent?: number;
  effectiveRate?: number;
  creditPercent?: number;
  priority?: number;
};

export type BenefitResolution = {
  applied: TaxBenefitRule[];
  requiresManualValidation: boolean;
  warnings: string[];
};

const clean = (value: string) => String(value ?? "").replace(/\D/g, "");

export function resolveTaxBenefits(
  ncmInput: string,
  uf: string,
  regime: string,
  referenceDate: string,
  rules: TaxBenefitRule[],
): BenefitResolution {
  const ncm = clean(ncmInput);
  const normalizedUf = String(uf ?? "").toUpperCase();
  const normalizedRegime = String(regime ?? "").toLowerCase();
  const warnings: string[] = [];

  const candidates = rules
    .filter((rule) => rule.validFrom <= referenceDate && (!rule.validTo || referenceDate <= rule.validTo))
    .filter((rule) => !rule.ufs?.length || rule.ufs.includes(normalizedUf))
    .filter((rule) => !rule.regimes?.length || rule.regimes.includes(normalizedRegime))
    .filter((rule) => !rule.ncmPrefixes?.length || rule.ncmPrefixes.some((prefix) => ncm.startsWith(clean(prefix))))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const official = candidates.every((rule) => /gov\.br|sef\.|receita|siscomex|planalto/i.test(`${rule.source} ${rule.legalBasis}`));
  const requiresManualValidation = candidates.length > 0 && !official;

  if (requiresManualValidation) {
    warnings.push("Existe benefício cadastrado, mas a fonte não foi identificada como oficial. Valide antes de usar o resultado para decisão fiscal.");
  }

  if (candidates.some((rule) => rule.type === "special-regime" || rule.type === "presumed-credit")) {
    warnings.push("O benefício pode depender de ato concessório, habilitação ou condições específicas do contribuinte.");
  }

  return { applied: candidates, requiresManualValidation, warnings };
}
