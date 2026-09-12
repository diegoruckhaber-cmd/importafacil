export const INDEPENDENT_E2E_BENCHMARKS = [
  {
    id: "external-cleared-import-01",
    sourceType: "cleared_customs_declaration",
    scope: "SC multi-item import with preferential II treatment",
    date: "2026-08-07",
    customsValueBrl: 492380.97,
    federal: {
      statutoryIiRate: 12.6,
      effectiveIiRate: 11.4,
      ipiRate: 3.25,
      pisRate: 2.1,
      cofinsRate: 9.65,
      iiBrl: 56131.44,
      ipiBrl: 17826.66,
      pisBrl: 10340.0,
      cofinsBrl: 47514.77,
    },
    state: { icmsRate: 4.0, icmsBrl: 26073.62 },
    additions: { afrmmBrl: 1349.29, siscomexBrl: 223.64 },
    toleranceBrl: 0.05,
  },
  {
    id: "external-cleared-import-02",
    sourceType: "cleared_customs_declaration",
    scope: "SC mixed-NCM import secondary reconciliation",
    date: "2026-08-10",
    customsValueBrl: 568411.40,
    federal: {
      pisRate: 2.1,
      cofinsRate: 9.65,
      pisBrl: 11936.64,
      cofinsBrl: 54851.70,
    },
    additions: { afrmmBrl: 1350.65, siscomexBrl: 254.49 },
    toleranceBrl: 0.05,
  },
] as const;

/**
 * These fixtures are intentionally redacted and contain only numeric facts
 * needed for regression. Client, supplier, declaration and taxpayer identifiers
 * remain outside the public repository. They are external to ImportaFácil and
 * were extracted from completed customs records before this benchmark existed.
 */
