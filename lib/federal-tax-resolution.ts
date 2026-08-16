import { resolveCofinsImport2026 } from "./federal-2026-import-rules.ts";
import { resolveFederalII2026 } from "./federal-ii-2026-rules.ts";
import { resolveFederalTariff } from "./federal-tariff-catalog.ts";
import { resolveFederalIpi } from "./federal-ipi-catalog.ts";

export type FederalTaxResolution = {
  pisImportRate: number; cofinsImportRate: number; cofinsDisplayRate: number; iiRate: number | null; ipiRate: number | null;
  automatic: { pisImport: boolean; cofinsImport: boolean; ii: boolean; ipi: boolean }; warnings: string[]; sources: string[];
};

/** Federal layer for the SC MVP. Explicit manual values still override catalogs. */
export function resolveFederalTaxes(input: {
  ncm?: string;
  date: `${number}-${number}-${number}`;
  statutoryIIRate?: number; reducedIIRate?: number;
  iiBenefitKind?: "none" | "reduced_rate" | "exemption" | "suspension";
  iiCoveredByLC224?: boolean; iiExceptionToLC224?: boolean;
  pisImportRate?: number; cofinsStandardRate?: number;
  cofinsReducedBenefit?: boolean; cofinsAdditional060?: boolean; ipiRate?: number;
}): FederalTaxResolution {
  const cofins = resolveCofinsImport2026({ date: input.date, standardRate: input.cofinsStandardRate, reducedBenefit: input.cofinsReducedBenefit, additional060: input.cofinsAdditional060 });
  const pisImportRate = input.pisImportRate ?? 2.1;
  const warnings: string[] = [];
  const sources = ["Siscomex Importação nº 025/2026", "Lei nº 10.865/2004"];

  let iiRate = input.statutoryIIRate ?? null;
  let iiAutomatic = false;
  if (input.statutoryIIRate != null) {
    const ii = resolveFederalII2026({ date: input.date, statutoryRate: input.statutoryIIRate, reducedRate: input.reducedIIRate, benefitKind: input.iiBenefitKind ?? "none", coveredByLC224: input.iiCoveredByLC224, exceptionToLC224: input.iiExceptionToLC224 });
    iiRate = ii.payableRate; iiAutomatic = true; if (ii.warning) warnings.push(ii.warning); sources.push(ii.source);
  } else if (input.ncm) {
    const tariff = resolveFederalTariff({ ncm: input.ncm, date: input.date });
    if (tariff.rate != null) {
      const ii = resolveFederalII2026({ date: input.date, statutoryRate: tariff.rate, reducedRate: input.reducedIIRate, benefitKind: input.iiBenefitKind ?? "none", coveredByLC224: input.iiCoveredByLC224, exceptionToLC224: input.iiExceptionToLC224 });
      iiRate = ii.payableRate; iiAutomatic = tariff.automatic && !ii.warning; sources.push(tariff.legalBasis ?? "MDIC Tarifa Vigente"); if (ii.warning) warnings.push(ii.warning); warnings.push(...tariff.warnings);
    } else warnings.push(...tariff.warnings);
  } else warnings.push("II não resolvido automaticamente: informe a NCM ou a alíquota e fundamento aplicável.");

  let ipiRate = input.ipiRate ?? null;
  let ipiAutomatic = false;
  if (input.ipiRate == null && input.ncm) {
    const ipi = resolveFederalIpi({ ncm: input.ncm, date: input.date });
    ipiRate = ipi.rate; ipiAutomatic = ipi.automatic; warnings.push(...ipi.warnings); if (ipi.legalBasis) sources.push(ipi.legalBasis);
  } else if (input.ipiRate == null) warnings.push("IPI não resolvido automaticamente: informe a NCM ou a alíquota TIPI aplicável.");

  return { pisImportRate, cofinsImportRate: cofins.effectiveRate, cofinsDisplayRate: cofins.displayRate, iiRate, ipiRate, automatic: { pisImport: input.pisImportRate == null, cofinsImport: true, ii: iiAutomatic, ipi: ipiAutomatic }, warnings, sources };
}
