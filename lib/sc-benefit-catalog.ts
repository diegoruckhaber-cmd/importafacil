export type SCBenefitCatalogRule = {
  id: string;
  ttd: 77 | 409 | 410;
  commercialResale: boolean;
  outputPresumedCredit: boolean;
  importDeferred: boolean;
  requiresConcessiveAct: boolean;
  notes: string[];
  source: string;
};

/** Central catalog for SC import-stage regimes. Monetary percentages are not hard-coded here. */
export const SC_BENEFIT_CATALOG: SCBenefitCatalogRule[] = [
  {
    id: "SC-TTD-77-INDUSTRIALIZATION",
    ttd: 77,
    commercialResale: false,
    outputPresumedCredit: false,
    importDeferred: true,
    requiresConcessiveAct: true,
    notes: [
      "TTD 77: diferimento na importação de mercadoria destinada a matéria-prima, material intermediário ou material secundário em processo de industrialização em SC.",
      "O TTD 77 é tratado como benefício de entrada; não se presume crédito presumido de saída do TTD 409/410.",
    ],
    source: "RICMS/SC Anexo 3, art. 10, II; COPAT 019/2026",
  },
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
      "A COPAT 019/2026 admite desembaraço integral sob TTD 410 e segregação posterior entre saídas comerciais e mercadorias destinadas à industrialização.",
    ],
    source: "RICMS/SC Anexo 2, art. 246; COPAT 019/2026",
  },
];

export function getSCBenefitCatalogRule(ttd: 77 | 409 | 410) {
  return SC_BENEFIT_CATALOG.find((rule) => rule.ttd === ttd) ?? null;
}
