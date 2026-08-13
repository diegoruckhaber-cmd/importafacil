export type TTD409410CalculationInput = {
  normalImportICMS: number;
  normalOutputICMS: number;
  importDeferred: boolean;
  outputCreditPresumed: boolean;
  presumedCreditAmount?: number;
  outputDefermentAmount?: number;
};

export type TTD409410Calculation = {
  importICMSCash: number;
  outputICMSCash: number;
  totalICMSCash: number;
  normalICMSCash: number;
  estimatedSavings: number;
  status: "calculated" | "conditional";
  warnings: string[];
};

/**
 * Economic bridge for TTD 409/410.
 * It consumes already validated monetary effects; it does not infer a legal
 * percentage or eligibility by itself.
 */
export function calculateTTD409410(input: TTD409410CalculationInput): TTD409410Calculation {
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "number" && (!Number.isFinite(value) || value < 0)) {
      throw new Error(`${key} inválido`);
    }
  }

  const warnings: string[] = [];
  let importICMSCash = input.importDeferred ? 0 : input.normalImportICMS;
  let outputICMSCash = input.normalOutputICMS;

  if (input.outputCreditPresumed) {
    if (input.presumedCreditAmount === undefined) {
      return {
        importICMSCash,
        outputICMSCash: 0,
        totalICMSCash: importICMSCash,
        normalICMSCash: input.normalImportICMS + input.normalOutputICMS,
        estimatedSavings: 0,
        status: "conditional",
        warnings: ["Crédito presumido indicado sem valor monetário validado."],
      };
    }
    outputICMSCash = Math.max(0, outputICMSCash - input.presumedCreditAmount);
  }

  if (input.outputDefermentAmount !== undefined) {
    outputICMSCash = Math.max(0, outputICMSCash - input.outputDefermentAmount);
    warnings.push("Diferimento na saída foi informado como efeito monetário já validado.");
  }

  const totalICMSCash = importICMSCash + outputICMSCash;
  const normalICMSCash = input.normalImportICMS + input.normalOutputICMS;

  return {
    importICMSCash,
    outputICMSCash,
    totalICMSCash,
    normalICMSCash,
    estimatedSavings: Math.max(0, normalICMSCash - totalICMSCash),
    status: "calculated",
    warnings,
  };
}
