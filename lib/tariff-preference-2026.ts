export type TariffPreferenceDecision = {
  eligible: boolean;
  agreement?: string;
  legalFoundation?: string;
  preferentialRate?: number;
  quotaRequired: boolean;
  quotaStatus: "not_applicable" | "required" | "available" | "unavailable";
  warnings: string[];
  source: string;
};

/**
 * 2026 preference layer. This deliberately does not infer origin from the
 * country alone: preferential treatment requires the applicable agreement,
 * rules of origin and, where relevant, quota/foundation data.
 */
export function resolveTariffPreference2026(input: {
  date: `${number}-${number}-${number}`;
  ncm: string;
  originCountry: string;
  agreement?: "MERCOSUR_EU" | "OTHER";
  legalFoundation?: string;
  originEligible?: boolean;
  preferentialRate?: number;
  quotaRequired?: boolean;
  quotaAvailable?: boolean;
  exCode?: string;
}): TariffPreferenceDecision {
  const warnings: string[] = [];

  if (input.agreement !== "MERCOSUR_EU") {
    return {
      eligible: false,
      quotaRequired: false,
      quotaStatus: "not_applicable",
      warnings: ["Nenhum acordo tarifário 2026 parametrizado para esta operação; manter TEC/II normal até validação de outro acordo."],
      source: "Camada de preferências tarifárias 2026",
    };
  }

  if (input.date < "2026-05-01") {
    return {
      eligible: false,
      agreement: "MERCOSUR_EU",
      quotaRequired: false,
      quotaStatus: "not_applicable",
      warnings: ["O ITA Mercosul-UE passou a produzir efeitos provisoriamente em 01/05/2026."],
      source: "Acordo Provisório Mercosul-União Europeia / Siscomex 2026",
    };
  }

  if (input.originCountry.toUpperCase() !== "UE" && input.originCountry.toUpperCase() !== "UNIÃO EUROPEIA" && input.originCountry.toUpperCase() !== "EUROPEAN UNION") {
    return {
      eligible: false,
      agreement: "MERCOSUR_EU",
      quotaRequired: false,
      quotaStatus: "not_applicable",
      warnings: ["Acordo Mercosul-UE selecionado, mas o país de origem informado não foi identificado como Estado-Membro da UE."],
      source: "Acordo Provisório Mercosul-União Europeia / Siscomex 2026",
    };
  }

  if (!input.originEligible) {
    warnings.push("Preferência não deve ser aplicada sem validação da origem preferencial e da prova de origem exigida pelo acordo.");
  }

  if (input.quotaRequired) {
    if (input.quotaAvailable === true) {
      return {
        eligible: Boolean(input.originEligible),
        agreement: "MERCOSUR_EU",
        legalFoundation: input.legalFoundation,
        preferentialRate: input.preferentialRate,
        quotaRequired: true,
        quotaStatus: "available",
        warnings,
        source: "Acordo Provisório Mercosul-União Europeia / Siscomex 2026",
      };
    }
    warnings.push("A preferência depende de cota e a disponibilidade da cota não foi confirmada.");
    return {
      eligible: false,
      agreement: "MERCOSUR_EU",
      legalFoundation: input.legalFoundation,
      quotaRequired: true,
      quotaStatus: input.quotaAvailable === false ? "unavailable" : "required",
      warnings,
      source: "Acordo Provisório Mercosul-União Europeia / Siscomex 2026",
    };
  }

  return {
    eligible: Boolean(input.originEligible),
    agreement: "MERCOSUR_EU",
    legalFoundation: input.legalFoundation,
    preferentialRate: input.preferentialRate,
    quotaRequired: false,
    quotaStatus: "not_applicable",
    warnings,
    source: "Acordo Provisório Mercosul-União Europeia / Siscomex 2026",
  };
}
