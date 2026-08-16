import { resolveTTD409410OutputRate, type TTD409410OutputRateInput } from "./sc-ttd409-410-output-rate.ts";

export type TTD409410BenefitCalculationInput = TTD409410OutputRateInput & {
  outputTaxBase: number;
  normalOutputICMS?: number;
};

export type TTD409410BenefitCalculation = {
  status: "calculated" | "conditional";
  outputTaxBase: number;
  normalOutputICMS: number;
  targetOutputICMS: number | null;
  presumedCreditAmount: number | null;
  estimatedSavings: number | null;
  targetTaxLoadPercent: number | null;
  presumedCreditPercentOfOutputICMS: number | null;
  reasons: string[];
  warnings: string[];
};

/**
 * Converts the legally resolved target final load into a monetary presumed
 * credit. The tax base is the integral own-operation output base, not the
 * import customs value. This distinction is intentional.
 */
export function calculateTTD409410Benefit(input: TTD409410BenefitCalculationInput): TTD409410BenefitCalculation {
  if (!Number.isFinite(input.outputTaxBase) || input.outputTaxBase < 0) throw new Error("outputTaxBase inválida");
  const rule = resolveTTD409410OutputRate(input);
  if (rule.status !== "calculated" || rule.targetTaxLoadPercent === null || rule.presumedCreditPercentOfOutputICMS === null) {
    return {
      status: "conditional",
      outputTaxBase: input.outputTaxBase,
      normalOutputICMS: input.normalOutputICMS ?? input.outputTaxBase * (input.aliquotaPercent / 100),
      targetOutputICMS: null,
      presumedCreditAmount: null,
      estimatedSavings: null,
      targetTaxLoadPercent: rule.targetTaxLoadPercent,
      presumedCreditPercentOfOutputICMS: rule.presumedCreditPercentOfOutputICMS,
      reasons: rule.reasons,
      warnings: rule.warnings,
    };
  }
  const normalOutputICMS = input.normalOutputICMS ?? input.outputTaxBase * (input.aliquotaPercent / 100);
  const targetOutputICMS = input.outputTaxBase * (rule.targetTaxLoadPercent / 100);
  const presumedCreditAmount = Math.max(0, normalOutputICMS - targetOutputICMS);
  return {
    status: "calculated",
    outputTaxBase: input.outputTaxBase,
    normalOutputICMS,
    targetOutputICMS,
    presumedCreditAmount,
    estimatedSavings: presumedCreditAmount,
    targetTaxLoadPercent: rule.targetTaxLoadPercent,
    presumedCreditPercentOfOutputICMS: rule.presumedCreditPercentOfOutputICMS,
    reasons: rule.reasons,
    warnings: rule.warnings,
  };
}
