export const STATE_GENERAL_ICMS_CONTRACT = "importafacil-state-general-icms-v1" as const;

export type GeneralStateIcmsRule = {
  uf: string;
  ratePercent: number;
  scope: "general_rate_only";
  effectiveFrom: string;
  legalBasis: readonly string[];
  sourceUrls: readonly string[];
  warning: string;
};

export const STATE_GENERAL_ICMS_RULES: readonly GeneralStateIcmsRule[] = [
  {
    uf: "SP",
    ratePercent: 18,
    scope: "general_rate_only",
    effectiveFrom: "2016-02-23",
    legalBasis: [
      "RICMS/SP (Decreto 45.490/2000), art. 52, I",
      "RICMS/SP (Decreto 45.490/2000), art. 37, IV",
      "RICMS/SP (Decreto 45.490/2000), art. 49",
    ],
    sourceUrls: [
      "https://legislacao.fazenda.sp.gov.br/Paginas/art052.aspx",
      "https://legislacao.fazenda.sp.gov.br/Paginas/art037.aspx",
    ],
    warning: "Escopo inicial de SP: aplica somente a alíquota geral de 18% do ICMS-importação. Benefícios, reduções, isenções, ST, regimes especiais e alíquotas específicas por produto não são avaliados nesta etapa.",
  },
];

export function resolveGeneralStateIcmsRule(uf: string): GeneralStateIcmsRule | null {
  const normalized = String(uf ?? "").trim().toUpperCase();
  return STATE_GENERAL_ICMS_RULES.find((rule) => rule.uf === normalized) ?? null;
}
