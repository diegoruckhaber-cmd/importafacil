export type MercosulEuIiInput = {
  date: `${number}-${number}-${number}`;
  originCountryCode: string;
  ncm: string;
  baseOfferRate: number;
  appliedNmfRate: number;
  reductionPercent: number;
  agreementEligible: boolean;
  proofOfOriginAvailable: boolean;
  quotaApplicable?: boolean;
  quotaAuthorizationAvailable?: boolean;
};

export type MercosulEuIiResolution = {
  eligible: boolean;
  payableRate: number | null;
  selectedBaseRate: number | null;
  preferenceRate: number | null;
  truncated: boolean;
  automatic: boolean;
  warnings: string[];
  sources: string[];
};

function truncateOneDecimal(value: number): number {
  return Math.floor((value + Number.EPSILON) * 10) / 10;
}

/**
 * Resolves the Brazilian import II preference under the provisional
 * Mercosul-EU agreement. It deliberately requires the tariff inputs and
 * origin/proof conditions instead of guessing NCM eligibility.
 */
export function resolveMercosulEuIi(input: MercosulEuIiInput): MercosulEuIiResolution {
  const warnings: string[] = [];
  const sources = [
    "Siscomex Importação nº 078/2026",
    "Acordo Provisório de Comércio Mercosul-União Europeia — Anexo 2-A",
  ];

  const origin = input.originCountryCode.trim().toUpperCase();
  const isEuOrigin = origin.length === 2 && [
    "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
  ].includes(origin);

  if (!isEuOrigin) {
    return { eligible: false, payableRate: null, selectedBaseRate: null, preferenceRate: null, truncated: false, automatic: false, warnings: ["A preferência Mercosul-UE exige mercadoria originária de país da União Europeia."], sources };
  }
  if (!input.agreementEligible) {
    return { eligible: false, payableRate: null, selectedBaseRate: null, preferenceRate: null, truncated: false, automatic: false, warnings: ["NCM não marcada como elegível no cronograma do Acordo Mercosul-UE."], sources };
  }
  if (!input.proofOfOriginAvailable) warnings.push("Prova de origem preferencial não informada: a preferência não deve ser aplicada no cálculo final.");
  if (input.quotaApplicable && !input.quotaAuthorizationAvailable) warnings.push("Produto sujeito a cota tarifária: autorização/documento de cota não informado.");

  const selectedBaseRate = Math.min(input.baseOfferRate, input.appliedNmfRate);
  const rawRate = selectedBaseRate * (1 - input.reductionPercent / 100);
  const payableRate = truncateOneDecimal(rawRate);
  const preferenceRate = selectedBaseRate === 0 ? 100 : (1 - payableRate / selectedBaseRate) * 100;
  const usable = input.proofOfOriginAvailable && (!input.quotaApplicable || input.quotaAuthorizationAvailable);

  return {
    eligible: true,
    payableRate: usable ? payableRate : null,
    selectedBaseRate,
    preferenceRate: usable ? preferenceRate : null,
    truncated: true,
    automatic: usable,
    warnings,
    sources,
  };
}
