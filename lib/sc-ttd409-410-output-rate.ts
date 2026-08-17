export type TTD409410OutputRateInput = {
  destination: "commercial_resale" | "industrialization";
  operation: "internal" | "interstate";
  aliquotaPercent: number;
  productClass?: "steel_copper_coke_aluminum_silver" | "other";
  continuousTTDMonths?: number;
  authorizedEarlyFullBenefit?: boolean;
  annualQualifiedOutputBrl?: number;
  requiredAnnualThresholdBrl?: number;
  sameNcmPosition?: boolean;
  originalCharacteristicsMaintained?: boolean;
  industrializationInSC?: boolean;
};

export type TTD409410OutputRateResult = {
  status: "calculated" | "conditional" | "not_applicable";
  targetTaxLoadPercent: number | null;
  presumedCreditPercentOfOutputICMS: number | null;
  reasons: string[];
  warnings: string[];
};

/**
 * Calculates the target final ICMS load for the ordinary commercial-output
 * branch of TTD 409/410. It intentionally does not calculate the tax amount.
 * The monetary engine can derive the presumed credit from the target load.
 *
 * Legal anchors reviewed against SEF/SC materials:
 * - RICMS/SC Anexo 2, art. 246, II: target final load of 1% in the ordinary
 *   branch and 0.6% for the listed metals.
 * - art. 246, §2º: 2.6% during the initial 36-month period, subject to the
 *   statutory exceptions/authorizations.
 * - COPAT 029/2026: §§23/24 are a distinct partial-deferment mechanism and
 *   are not restricted to TTD 410.
 * - COPAT 010/2026: industrialization/fracionamento requires separate NCM
 *   analysis and must not be treated as automatic commercial resale.
 */
export function resolveTTD409410OutputRate(input: TTD409410OutputRateInput): TTD409410OutputRateResult {
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (!Number.isFinite(input.aliquotaPercent) || input.aliquotaPercent <= 0 || input.aliquotaPercent >= 100) {
    throw new Error("aliquotaPercent inválida");
  }

  if (input.destination === "industrialization") {
    if (input.industrializationInSC !== true || input.originalCharacteristicsMaintained !== true || input.sameNcmPosition !== true) {
      return {
        status: "conditional",
        targetTaxLoadPercent: null,
        presumedCreditPercentOfOutputICMS: null,
        reasons: ["A saída para industrialização não atende, pelos dados informados, todas as condições para preservar automaticamente o tratamento do TTD 409/410."],
        warnings: ["Verificar local da industrialização, características originais e posição NCM do produto resultante."],
      };
    }
  }

  if (input.destination !== "commercial_resale") {
    return {
      status: "conditional",
      targetTaxLoadPercent: null,
      presumedCreditPercentOfOutputICMS: null,
      reasons: ["A regra de carga final de saída foi desenhada para a operação comercial; esta destinação exige regra específica."],
      warnings,
    };
  }

  if (input.operation !== "internal" && input.operation !== "interstate") {
    throw new Error("operation inválida");
  }

  const isMetal = input.productClass === "steel_copper_coke_aluminum_silver";
  const has36Months = (input.continuousTTDMonths ?? 0) >= 36;
  const annualThreshold = input.requiredAnnualThresholdBrl ?? 280_000_000;
  const reachesThreshold = (input.annualQualifiedOutputBrl ?? 0) >= annualThreshold;

  // An early move to the full benefit is only allowed when both conditions
  // represented by the input are satisfied: the statutory output threshold
  // is reached AND prior fiscal authorization is present. Merely checking
  // the authorization flag must never bypass the threshold.
  const authorizedEarlyFullBenefit = input.authorizedEarlyFullBenefit === true;
  const earlyException = authorizedEarlyFullBenefit && reachesThreshold;

  const targetTaxLoadPercent = (has36Months || earlyException || isMetal) ? (isMetal ? 0.6 : 1.0) : 2.6;

  if (!has36Months && !earlyException && !isMetal) {
    warnings.push("Aplicada a carga final de 2,6% do período inicial; para benefício integral antecipado, confirmar simultaneamente o atingimento do requisito anual e a autorização fiscal válida.");
  }

  if (isMetal) {
    reasons.push("Mercadoria enquadrada na categoria específica de aço, cobre, coque, alumínio ou prata: carga final de referência de 0,6%.");
  } else if (targetTaxLoadPercent === 2.6) {
    reasons.push("Estabelecimento sem 36 meses ininterruptos de regime, sem exceção comprovada: carga final de referência de 2,6%.");
  } else if (earlyException) {
    reasons.push("Requisito anual atingido e autorização fiscal válida informada: aplicação antecipada da carga final de referência de 1%.");
  } else {
    reasons.push("Carga final de referência de 1% para a operação comercial, observadas as demais condições do art. 246 e do ato concessivo.");
  }

  const rate = input.aliquotaPercent / 100;
  const target = targetTaxLoadPercent / 100;
  const presumedCreditPercentOfOutputICMS = Math.max(0, (rate - target) / rate * 100);

  return {
    status: "calculated",
    targetTaxLoadPercent,
    presumedCreditPercentOfOutputICMS,
    reasons,
    warnings,
  };
}
