export type TaxBenefitType = "exemption" | "reduction" | "suspension" | "presumed-credit" | "deferred-payment" | "special-regime";
export type TaxBenefitRule = {
  id: string; name: string; tax: "II" | "IPI" | "PIS_IMPORT" | "COFINS_IMPORT" | "ICMS" | "IBS" | "CBS" | "IS";
  type: TaxBenefitType; validFrom: string; validTo?: string; source: string; legalBasis: string;
  ncmPrefixes?: string[]; ufs?: string[]; regimes?: string[]; conditions: string[];
  rateReductionPercent?: number; effectiveRate?: number; creditPercent?: number; priority?: number;
};
export type BenefitResolution = { applied: TaxBenefitRule[]; requiresManualValidation: boolean; warnings: string[] };
const clean = (value: string) => String(value ?? "").replace(/\D/g, "");
export function resolveTaxBenefits(ncmInput: string, uf: string, regime: string, referenceDate: string, rules: TaxBenefitRule[]): BenefitResolution {
  const ncm = clean(ncmInput); const normalizedUf = String(uf ?? "").toUpperCase(); const normalizedRegime = String(regime ?? "").toLowerCase(); const warnings: string[] = [];
  const candidates = rules.filter(r => r.validFrom <= referenceDate && (!r.validTo || referenceDate <= r.validTo)).filter(r => !r.ufs?.length || r.ufs.includes(normalizedUf)).filter(r => !r.regimes?.length || r.regimes.includes(normalizedRegime)).filter(r => !r.ncmPrefixes?.length || r.ncmPrefixes.some(p => ncm.startsWith(clean(p)))).sort((a,b)=>(b.priority??0)-(a.priority??0));
  const official = candidates.every(r => /gov\.br|sef\.|receita|siscomex|planalto/i.test(`${r.source} ${r.legalBasis}`));
  const requiresManualValidation = candidates.length > 0 && !official;
  if (requiresManualValidation) warnings.push("Existe benefício cadastrado, mas a fonte não foi identificada como oficial. Valide antes de usar o resultado para decisão fiscal.");
  if (candidates.some(r => r.type === "special-regime" || r.type === "presumed-credit")) warnings.push("O benefício pode depender de ato concessório, habilitação ou condições específicas do contribuinte.");
  return { applied: candidates, requiresManualValidation, warnings };
}
