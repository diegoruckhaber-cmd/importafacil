export type CompanyTaxRegime = "simples-nacional" | "lucro-presumido" | "lucro-real" | "nao-informado";
export type IcmsCreditTreatment = "integral" | "parcial" | "nao-creditavel" | "a-validar";

export type TaxProfile = {
  regime: CompanyTaxRegime;
  destinationUf: string;
  icmsRate: number;
  icmsCreditTreatment: IcmsCreditTreatment;
  pisCofinsCreditable: boolean | "parcial" | "a-validar";
  includeIpiInIcmsBase: boolean | "a-validar";
  icmsBaseReductionPercent?: number;
  notes?: string[];
};

export type CreditAnalysis = {
  icmsCredit: number | null;
  pisImportCredit: number | null;
  cofinsImportCredit: number | null;
  totalPotentialCredit: number | null;
  status: "calculated" | "partial" | "requires-validation";
  warnings: string[];
};

const nonNegative = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);

export function analyzeImportTaxCredits(
  tax: { icms: number; pisImport: number; cofinsImport: number },
  profile: TaxProfile,
): CreditAnalysis {
  const warnings: string[] = [];
  let status: CreditAnalysis["status"] = "calculated";
  let icmsCredit: number | null = null;
  if (profile.icmsCreditTreatment === "integral") icmsCredit = nonNegative(tax.icms);
  else if (profile.icmsCreditTreatment === "nao-creditavel") icmsCredit = 0;
  else {
    warnings.push("O crédito de ICMS depende de regra específica; não foi presumido pelo motor.");
    status = profile.icmsCreditTreatment === "parcial" ? "partial" : "requires-validation";
  }
  let pisImportCredit: number | null = null;
  let cofinsImportCredit: number | null = null;
  if (profile.pisCofinsCreditable === true) {
    pisImportCredit = nonNegative(tax.pisImport);
    cofinsImportCredit = nonNegative(tax.cofinsImport);
  } else if (profile.pisCofinsCreditable === false) {
    pisImportCredit = 0;
    cofinsImportCredit = 0;
  } else {
    warnings.push("A apropriação de créditos de PIS/Cofins-Importação precisa ser validada conforme regime, produto e utilização.");
    status = "requires-validation";
  }
  const knownCredits = [icmsCredit, pisImportCredit, cofinsImportCredit].filter((v): v is number => v !== null);
  const totalPotentialCredit = knownCredits.length === 3 ? knownCredits.reduce((sum, value) => sum + value, 0) : null;
  return { icmsCredit, pisImportCredit, cofinsImportCredit, totalPotentialCredit, status, warnings };
}
