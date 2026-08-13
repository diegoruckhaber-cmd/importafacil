import { calculateSCImportOperation, type SCImportOperationInput } from "./sc-import-operation";
import { decideSCItem } from "./sc-decision-engine";
import { calculateTTD409410Benefit } from "./sc-ttd409-410-benefit-calculator";

export type SCRealCalculationInput = SCImportOperationInput & {
  ttd?: 409 | 410;
  destination?: "commercial_resale" | "industrialization";
  operation?: "internal" | "interstate";
  validConcession?: boolean;
  importEntryInSC?: boolean;
  decree2128Prohibited?: boolean;
  sameNcmPositionAfterFractionation?: boolean;
  outputValue?: number;
  outputICMSRate?: number;
  regimeHolderMonths?: number;
  specialAuthorizationForInitialPeriod?: boolean;
  specialProductRate?: boolean;
};

export type SCRealCalculationResult = {
  status: "calculated" | "conditional" | "denied";
  importCalculation: ReturnType<typeof calculateSCImportOperation>;
  decision: ReturnType<typeof decideSCItem>;
  benefit: ReturnType<typeof calculateTTD409410Benefit> | null;
  warnings: string[];
};

export function calculateSCRealOperation(input: SCRealCalculationInput): SCRealCalculationResult {
  const importCalculation = calculateSCImportOperation(input);
  const decision = decideSCItem({
    id: "operation",
    ttd: input.ttd,
    destination: input.destination,
    validConcession: input.validConcession,
    importEntryInSC: input.importEntryInSC,
    decree2128Prohibited: input.decree2128Prohibited,
    sameNcmPositionAfterFractionation: input.sameNcmPositionAfterFractionation,
  });

  if (decision.decision !== "apply" || input.ttd === undefined) {
    return {
      status: decision.decision === "deny" ? "denied" : "conditional",
      importCalculation,
      decision,
      benefit: null,
      warnings: ["O cálculo do benefício não foi executado porque a elegibilidade ainda não está confirmada."],
    };
  }

  if (input.destination !== "commercial_resale") {
    return {
      status: "conditional",
      importCalculation,
      decision,
      benefit: null,
      warnings: ["O tratamento financeiro da saída não foi confirmado para esta destinação."],
    };
  }

  if (typeof input.outputValue !== "number" || !Number.isFinite(input.outputValue) || typeof input.outputICMSRate !== "number" || !Number.isFinite(input.outputICMSRate)) {
    return {
      status: "conditional",
      importCalculation,
      decision,
      benefit: null,
      warnings: ["Informe o valor da saída e a alíquota interna para calcular o efeito do TTD na saída."],
    };
  }

  const outputValue = input.outputValue;
  const outputICMSRate = input.outputICMSRate;

  const benefit = calculateTTD409410Benefit({
    outputTaxBase: outputValue,
    normalOutputICMS: outputValue * (outputICMSRate / 100),
    destination: input.destination,
    operation: input.operation ?? "internal",
    aliquotaPercent: outputICMSRate,
    continuousTTDMonths: input.regimeHolderMonths ?? 0,
    authorizedEarlyFullBenefit: input.specialAuthorizationForInitialPeriod ?? false,
    productClass: input.specialProductRate ? "steel_copper_coke_aluminum_silver" : "other",
    sameNcmPosition: input.sameNcmPositionAfterFractionation,
  });

  return {
    status: benefit.status === "calculated" ? "calculated" : "conditional",
    importCalculation,
    decision,
    benefit,
    warnings: benefit.warnings,
  };
}
