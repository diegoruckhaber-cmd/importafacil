export type MercosulEUResult = {
  applicable: boolean;
  rate: number | null;
  truncatedRate: number | null;
  warning?: string;
  source: string;
};

/**
 * Applies the 2026 Mercosul-EU tariff methodology when the caller already
 * has the agreement base rate and the current NMF/TEC rate. The tariff
 * schedule itself remains data-driven and must not be inferred from NCM.
 */
export function resolveMercosulEUImportII(input: {
  date: `${number}-${number}-${number}`;
  originIsEU: boolean;
  agreementBaseRate?: number;
  nmfRate?: number;
  reductionPercent?: number;
}): MercosulEUResult {
  const source = "Siscomex Importação nº 078/2026 / Acordo Provisório Mercosul-UE";
  if (!input.originIsEU) return { applicable: false, rate: null, truncatedRate: null, source };
  if (input.date < "2026-05-01") return { applicable: false, rate: null, truncatedRate: null, source };
  if (input.agreementBaseRate == null || input.nmfRate == null || input.reductionPercent == null) {
    return { applicable: true, rate: null, truncatedRate: null, source, warning: "Acordo Mercosul-UE identificado, mas faltam a alíquota-base, a NMF/TEC ou o percentual de desgravação para calcular o II." };
  }
  const selected = Math.min(input.agreementBaseRate, input.nmfRate);
  const rate = selected * (1 - input.reductionPercent / 100);
  const truncatedRate = Math.trunc(rate * 10) / 10;
  return { applicable: true, rate, truncatedRate, source };
}
