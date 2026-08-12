import { resolveNcmTaxTreatment, type NcmTaxRule, type NcmTaxResolution } from "./ncm-tax-engine";
import type { ImportItem } from "./multi-item-import";

export type ItemTaxResolution = {
  itemId: string;
  description: string;
  ncm: string;
  resolution: NcmTaxResolution;
  iiRate?: number;
  ipiRate?: number;
  pisImportRate?: number;
  cofinsImportRate?: number;
};

function rateFor(rules: NcmTaxRule[], tax: NcmTaxRule["tax"]): number | undefined {
  const rule = rules.find((item) => item.tax === tax);
  return rule?.rate;
}

/**
 * Resolves tax rules for every item before the numerical calculation.
 * Missing/uncertain rules are surfaced instead of silently defaulting to zero.
 */
export function resolveImportItemsTaxTreatment(
  items: ImportItem[],
  referenceDate: string,
  rules: NcmTaxRule[],
): ItemTaxResolution[] {
  return items.map((item) => {
    const resolution = resolveNcmTaxTreatment(item.ncm, referenceDate, rules);
    return {
      itemId: item.id,
      description: item.description,
      ncm: resolution.ncm,
      resolution,
      iiRate: rateFor(resolution.rules, "II"),
      ipiRate: rateFor(resolution.rules, "IPI"),
      pisImportRate: rateFor(resolution.rules, "PIS_IMPORT"),
      cofinsImportRate: rateFor(resolution.rules, "COFINS_IMPORT"),
    };
  });
}
