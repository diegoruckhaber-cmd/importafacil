import { resolveCofinsImport2026 } from "./federal-2026-import-rules";
import { resolveFederalII2026 } from "./federal-ii-2026-rules";

export type FederalTaxResolution = {
  pisImportRate: number; cofinsImportRate: number; cofinsDisplayRate: number; iiRate: number | null; ipiRate: number | null;
  automatic: { pisImport: boolean; cofinsImport: boolean; ii: boolean; ipi: boolean }; warnings: string[]; sources: string[];
};

/** Conservative federal layer for the SC MVP. Never invents NCM/TIPI rates. */
export function resolveFederalTaxes(input: { date: `${number}-${number}-${number}`; statutoryIIRate?: number; reducedIIRate?: number; iiBenefitKind?: "none" | "reduced_rate" | "exemption" | "suspension"; iiCoveredByLC224?: boolean; iiExceptionToLC224?: boolean; pisImportRate?: number; cofinsStandardRate?: number; cofinsReducedBenefit?: boolean; cofinsAdditional060?: boolean; ipiRate?: number }): FederalTaxResolution {
  const cofins = resolveCofinsImport2026({ date: input.date, standardRate: input.cofinsStandardRate, reducedBenefit: input.cofinsReducedBenefit, additional060: input.cofinsAdditional060 });
  const pisImportRate = input.pisImportRate ?? 2.1;
  const warnings: string[] = []; const sources = ["Siscomex Importação nº 025/2026", "Lei nº 10.865/2004"];
  let iiRate = input.statutoryIIRate ?? null;
  if (input.statutoryIIRate != null) { const ii = resolveFederalII2026({ date: input.date, statutoryRate: input.statutoryIIRate, reducedRate: input.reducedIIRate, benefitKind: input.iiBenefitKind ?? "none", coveredByLC224: input.iiCoveredByLC224, exceptionToLC224: input.iiExceptionToLC224 }); iiRate = ii.payableRate; if (ii.warning) warnings.push(ii.warning); sources.push(ii.source); }
  else warnings.push("II não resolvido automaticamente: informe a alíquota da NCM e o fundamento aplicável.");
  const ipiRate = input.ipiRate ?? null; if (ipiRate == null) warnings.push("IPI não resolvido automaticamente: informe a alíquota TIPI/NCM aplicável.");
  return { pisImportRate, cofinsImportRate: cofins.effectiveRate, cofinsDisplayRate: cofins.displayRate, iiRate, ipiRate, automatic: { pisImport: input.pisImportRate == null, cofinsImport: true, ii: false, ipi: false }, warnings, sources };
}
