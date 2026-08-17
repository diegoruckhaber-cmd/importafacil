export type ImportTransportMode = "maritime_long_course" | "cabotage" | "air" | "road" | "rail" | "not_informed";
export type ImportDeclarationType = "di" | "duimp";

export type SCImportAdditionalChargesInput = {
  freightBrl: number;
  transportMode: ImportTransportMode;
  declarationType: ImportDeclarationType;
  additions?: number;
};

export type SCImportAdditionalChargesResult = {
  afrmmRate: number;
  afrmmBrl: number;
  siscomexBrl: number;
  warnings: string[];
};

/** Current statutory/reference parameters used by the SC import calculation. */
export function resolveSCImportAdditionalCharges(input: SCImportAdditionalChargesInput): SCImportAdditionalChargesResult {
  const afrmmApplicable = input.transportMode === "maritime_long_course" || input.transportMode === "cabotage";
  const afrmmRate = afrmmApplicable ? 0.08 : 0;
  const afrmmBrl = Math.max(0, input.freightBrl) * afrmmRate;
  const additions = Math.max(1, Math.floor(input.additions ?? 1));
  const siscomexBrl = input.declarationType === "di" ? 185 + 29.5 * additions : 0;
  const warnings: string[] = [];

  if (input.transportMode === "not_informed") warnings.push("Modal de transporte não informado; AFRMM não calculado.");
  if (input.declarationType === "duimp") warnings.push("Taxa Siscomex da DI não aplicada ao cenário Duimp.");

  return { afrmmRate, afrmmBrl, siscomexBrl, warnings };
}
