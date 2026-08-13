export type SCBenefitCatalogRule = {
  id: string;
  ttd: 409 | 410;
  commercialResale: boolean;
  outputPresumedCredit: boolean;
  importDeferred: boolean;
  requiresConcessiveAct: boolean;
  notes: string[];
  source: string;
};

/**
 * Central catalog for the SC regime effects already supported by the legal layer.
 * Monetary percentages are intentionally NOT hard-coded here: they depend on
 * the specific concessive act and current legal parameters.
 */
export const SC_BENEFIT_CATALOG: SCBenefitCatalogRule[] = [
  {
    id: "SC-TTD-409-COMMERCIAL",
    ttd: 409,
    commercialResale: true,
    outputPresumedCredit: true,
    importDeferred: true,
    requiresConcessiveAct: true,
    notes: [
      "TTD 409: diferimento na importação para comercialização e crédito presumido na saída tributada subsequente, observadas as condições do ato concessivo.",
    ],
    source: "RICMS/SC Anexo 2, art. 246; COPAT 010/2026",
  },
  {
    id: "SC-TTD-410-COMMERCIAL",
    ttd: 410,
    commercialResale: true,
    outputPresumedCredit: true,
    importDeferred: true,
    requiresConcessiveAct: true,
    notes: [
      "TTD 410: diferimento na importação para comercialização e crédito presumido na saída tributada subsequente, observadas as condições do ato concessivo.",
    ],
    source: "RICMS/SC Anexo 2, art. 246; COPAT 019/2026",
  },
];

export function getSCBenefitCatalogRule(ttd: 409 | 410) {
  return SC_BENEFIT_CATALOG.find((rule) => rule.ttd === ttd) ?? null;
}
