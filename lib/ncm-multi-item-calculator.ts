import { resolveNcmTaxTreatment, type NcmTaxRule } from "./ncm-tax-engine";
import { calculateMultiItemImport, type ImportItem, type MultiItemImport, type MultiItemResult } from "./multi-item-import";

export type ResolvedMultiItemResult = MultiItemResult & {
  treatment: Array<{
    itemId: string;
    ncm: string;
    rates: Partial<Record<"II" | "IPI" | "PIS_IMPORT" | "COFINS_IMPORT", number>>;
    needsOfficialValidation: boolean;
    message: string;
  }>;
};

/**
 * Resolves NCM rules first, then feeds only resolved rates into the multi-item calculator.
 * Missing/uncertain fiscal rules are surfaced instead of silently becoming 0%.
 */
export function calculateMultiItemWithNcmRules(
  operation: MultiItemImport,
  referenceDate: string,
  rules: NcmTaxRule[],
  defaultIcmsRate = 0,
): ResolvedMultiItemResult {
  const treatment = operation.items.map((item) => {
    const resolution = resolveNcmTaxTreatment(item.ncm, referenceDate, rules);
    const rates: Partial<Record<"II" | "IPI" | "PIS_IMPORT" | "COFINS_IMPORT", number>> = {};
    for (const rule of resolution.rules) rates[rule.tax] = rule.rate;
    return {
      itemId: item.id,
      ncm: resolution.ncm,
      rates,
      needsOfficialValidation: resolution.needsOfficialValidation,
      message: resolution.message,
    };
  });

  const unresolved = treatment.filter((item) => item.needsOfficialValidation);
  const items: ImportItem[] = operation.items.map((item) => {
    const found = treatment.find((entry) => entry.itemId === item.id);
    return {
      ...item,
      iiRate: found?.rates.II ?? item.iiRate ?? 0,
      ipiRate: found?.rates.IPI ?? item.ipiRate ?? 0,
      pisImportRate: found?.rates.PIS_IMPORT ?? item.pisImportRate ?? 0,
      cofinsImportRate: found?.rates.COFINS_IMPORT ?? item.cofinsImportRate ?? 0,
      icmsRate: item.icmsRate ?? defaultIcmsRate,
    };
  });

  const calculated = calculateMultiItemImport({ ...operation, items });
  const warnings = [...calculated.warnings];
  if (unresolved.length) {
    warnings.push(`${unresolved.length} item(ns) estão sem tratamento tributário oficial validado e precisam de conferência antes de uma decisão definitiva.`);
  }

  return { ...calculated, warnings, treatment };
}
