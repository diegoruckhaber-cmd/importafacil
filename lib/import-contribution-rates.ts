export type ImportContributionResolution = {
  pisImportRate: number;
  cofinsImportRate: number;
  source: string;
};

/**
 * NCM-specific PIS/Cofins-Importação rates that differ from the general rates.
 *
 * Lei nº 10.865/2004, art. 8º, § 5º: positions 40.11 and 40.13 are subject to
 * 2.68% PIS/Pasep-Importação and 12.35% Cofins-Importação.
 *
 * The catalog is intentionally conservative: only rates with an explicit
 * statutory NCM-position rule are overridden here. Other NCMs keep the general
 * rates until their specific legal treatment is modeled and validated.
 */
export function resolveImportContributionRates(ncm: string): ImportContributionResolution {
  const normalized = ncm.replace(/\D/g, "");

  if (normalized.startsWith("4011") || normalized.startsWith("4013")) {
    return {
      pisImportRate: 2.68,
      cofinsImportRate: 12.35,
      source: "Lei nº 10.865/2004, art. 8º, § 5º — posições NCM 40.11 e 40.13",
    };
  }

  return {
    pisImportRate: 2.1,
    cofinsImportRate: 9.65,
    source: "Lei nº 10.865/2004, art. 8º, inciso I — alíquotas gerais",
  };
}
