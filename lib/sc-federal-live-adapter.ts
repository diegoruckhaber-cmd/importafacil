import { resolveFederalTaxes, type FederalTaxResolution } from "./federal-tax-resolution";

export type SCFederalItemInput = {
  date: `${number}-${number}-${number}`;
  iiRate?: number;
  ipiRate?: number;
  pisImportRate?: number;
  cofinsImportRate?: number;
  cofinsReducedBenefit?: boolean;
  cofinsAdditional060?: boolean;
  reducedIIRate?: number;
  iiBenefitKind?: "none" | "reduced_rate" | "exemption" | "suspension";
  iiCoveredByLC224?: boolean;
  iiExceptionToLC224?: boolean;
};

export type SCFederalLiveItem = FederalTaxResolution & {
  readyForAutomaticCalculation: boolean;
  requiresManualFederalInput: boolean;
};

/**
 * Adapter used by the SC operation UI.
 * It deliberately keeps the NCM lookup outside this layer: until a verified
 * NCM/TIPI source is connected, II/IPI are never guessed.
 */
export function resolveSCFederalItem(input: SCFederalItemInput): SCFederalLiveItem {
  const resolution = resolveFederalTaxes({
    date: input.date,
    statutoryIIRate: input.iiRate,
    reducedIIRate: input.reducedIIRate,
    iiBenefitKind: input.iiBenefitKind,
    iiCoveredByLC224: input.iiCoveredByLC224,
    iiExceptionToLC224: input.iiExceptionToLC224,
    pisImportRate: input.pisImportRate,
    cofinsStandardRate: input.cofinsImportRate,
    cofinsReducedBenefit: input.cofinsReducedBenefit,
    cofinsAdditional060: input.cofinsAdditional060,
    ipiRate: input.ipiRate,
  });

  const requiresManualFederalInput = resolution.warnings.some((warning) =>
    warning.includes("II não resolvido") || warning.includes("IPI não resolvido")
  );

  return {
    ...resolution,
    readyForAutomaticCalculation: !requiresManualFederalInput,
    requiresManualFederalInput,
  };
}
