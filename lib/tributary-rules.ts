export type TaxRule = {
  code: string;
  name: string;
  base: "valor_aduaneiro" | "valor_aduaneiro_mais_ii" | "icms_por_dentro";
  rate: number;
  validFrom: string;
  validTo?: string;
  notes?: string;
};

/**
 * Rule catalog is intentionally explicit and versioned.
 * Rates here are baseline defaults, not an automatic NCM treatment lookup.
 * NCM-specific rates, exemptions, reductions, specific rates and special
 * regimes must be supplied by a future treatment-data provider.
 */
export const BASE_RULES: TaxRule[] = [
  { code: "II", name: "Imposto de Importação", base: "valor_aduaneiro", rate: 0, validFrom: "2026-01-01", notes: "Alíquota depende da NCM/origem/tratamento tarifário." },
  { code: "IPI", name: "IPI-Importação", base: "valor_aduaneiro_mais_ii", rate: 0, validFrom: "2026-01-01", notes: "Alíquota depende da NCM e da TIPI." },
  { code: "PIS_IMPORT", name: "PIS/Pasep-Importação", base: "valor_aduaneiro", rate: 2.1, validFrom: "2026-01-01", notes: "Alíquota geral ad valorem; há exceções e alíquotas específicas." },
  { code: "COFINS_IMPORT", name: "Cofins-Importação", base: "valor_aduaneiro", rate: 9.65, validFrom: "2026-01-01", notes: "Alíquota geral ad valorem; há exceções e alíquotas específicas." },
];

export function getBaselineRules(date = new Date("2026-08-10")): TaxRule[] {
  const iso = date.toISOString().slice(0, 10);
  return BASE_RULES.filter((r) => r.validFrom <= iso && (!r.validTo || iso <= r.validTo));
}
