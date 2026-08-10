import type { TaxRule } from "./tax-rules";

/**
 * Fixtures de desenvolvimento, não uma tabela oficial completa.
 * Não usar estes exemplos para estimar uma operação real.
 * As alíquotas reais devem vir do Classif/TEC/TIPI ou de regra legal aplicável.
 */
export const sampleTaxRules: TaxRule[] = [
  {
    ncm: "8517.62.59",
    tax: "II",
    rate: 0,
    effectiveFrom: "2026-01-01",
    source: "MANUAL",
    note: "Fixture de teste somente.",
  },
  {
    ncm: "8517.62.59",
    tax: "IPI",
    rate: 0,
    effectiveFrom: "2026-01-01",
    source: "MANUAL",
    note: "Fixture de teste somente.",
  },
];
