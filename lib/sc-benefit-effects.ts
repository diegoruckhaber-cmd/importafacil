export type SCBenefitEffect = {
  kind: "none" | "import_differment" | "base_reduction" | "presumed_credit" | "conditional";
  importICMSPayableFactor?: number;
  outputICMSRateFactor?: number;
  creditOnOutput?: boolean;
  notes: string[];
};

export type SCBenefitComparison = {
  normalICMS: number;
  benefitICMS: number | null;
  estimatedSavings: number | null;
  status: "calculated" | "conditional";
  explanation: string[];
};

/**
 * Represents the economic effect of an SC regime separately from eligibility.
 * Rates/factors must come from the validated rule/catalog layer; this module
 * intentionally does not hard-code a legal percentage.
 */
export function compareSCBenefit(
  normalICMS: number,
  effect: SCBenefitEffect,
  benefitICMS?: number,
): SCBenefitComparison {
  if (!Number.isFinite(normalICMS) || normalICMS < 0) {
    throw new Error("normalICMS inválido");
  }

  if (effect.kind === "conditional" || benefitICMS === undefined) {
    return {
      normalICMS,
      benefitICMS: null,
      estimatedSavings: null,
      status: "conditional",
      explanation: [
        ...effect.notes,
        "O benefício foi identificado, mas o efeito financeiro não pode ser calculado sem os parâmetros jurídicos/econômicos validados.",
      ],
    };
  }

  if (!Number.isFinite(benefitICMS) || benefitICMS < 0) {
    throw new Error("benefitICMS inválido");
  }

  const savings = Math.max(0, normalICMS - benefitICMS);

  return {
    normalICMS,
    benefitICMS,
    estimatedSavings: savings,
    status: "calculated",
    explanation: effect.notes,
  };
}
