import type { FederalTariffEntry } from "./federal-tariff-catalog.ts";

/**
 * Small, explicitly sourced smoke-test seed for the 2026 tariff layer.
 *
 * This is NOT the complete federal tariff database. Production automation
 * must consume the official MDIC/Camex current tariff dataset. The seed exists
 * so the resolver can be exercised with a real NCM while the full data-loader
 * is being completed.
 */
export const FEDERAL_TARIFF_2026_SMOKE_SEED: FederalTariffEntry[] = [
  {
    ncm: "3208.10.20",
    rate: 11.2,
    source: "TEC",
    validFrom: "2022-01-01",
    legalBasis: "Resolução Gecex nº 391/2022, Anexo II; conferência com a base consolidada de Tarifas Vigentes do MDIC.",
    priority: 100,
  },
];
