import { calculateSCMultiItemFinalCost, type SCMultiItemFinalCostResult } from "./sc-multi-item-final-cost-engine.ts";
import { resolveSCBenefit, type SCBenefitResolution } from "./sc-benefit-resolution.ts";

export type ImportScenario = "normal" | "ttd409" | "ttd410" | "ttd77";

export type ImportScenarioInput = {
  ncm: string;
  quantity: number;
  fobUnitUsd: number;
  exchangeRate: number;
  freightUsd: number;
  insuranceUsd: number;
  otherExpensesBrl: number;
  iiRate: number;
  ipiRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsRate: number;
  importDate?: `${number}-${number}-${number}`;
  destination?: "commercial_resale" | "industrialization" | "same_holder_transfer";
  industrializationInSC?: boolean;
  taxableOutput?: boolean;
  preservesOriginalCharacteristics?: boolean;
  sameNcmPosition?: boolean;
  exclusionKnown?: boolean;
  otherDeferment?: boolean;
  paragraph23Or24?: boolean;
  equivalentTaxableEventElection?: boolean;
};

export type ImportScenarioResult = {
  scenario: ImportScenario;
  label: string;
  legallyEligible: boolean;
  decision: "apply" | "conditional" | "deny" | "normal";
  legalReasons: string[];
  blockingIssues: string[];
  source: string;
  normalImportICMS: number;
  effectiveImportICMS: number;
  importICMSSavings: number;
  landedCostBeforeBenefit: number;
  landedCostAfterBenefit: number;
  landedCostPerUnit: number;
  engineResult: SCMultiItemFinalCostResult;
  benefitResolution?: SCBenefitResolution;
};

const LABELS: Record<ImportScenario, string> = {
  normal: "Regime normal",
  ttd409: "TTD 409",
  ttd410: "TTD 410",
  ttd77: "TTD 77",
};

function buildItem(input: ImportScenarioInput) {
  const customsValue = (input.quantity * input.fobUnitUsd + input.freightUsd + input.insuranceUsd) * input.exchangeRate;
  return {
    itemId: "comparison-item",
    customsValue,
    quantity: input.quantity,
    iiRate: input.iiRate,
    ipiRate: input.ipiRate,
    pisImportRate: input.pisImportRate,
    cofinsImportRate: input.cofinsImportRate,
    icmsRate: input.icmsRate,
    importDate: input.importDate,
  };
}

export function compareImportScenario(input: ImportScenarioInput, scenario: ImportScenario): ImportScenarioResult {
  const item = buildItem(input);
  const baseResult = calculateSCMultiItemFinalCost({
    items: [item],
    expenses: [{ id: "other-expenses", description: "Outras despesas", amount: input.otherExpensesBrl, treatment: "operational_cost" }],
  });

  if (scenario === "normal") {
    const row = baseResult.items[0];
    return {
      scenario,
      label: LABELS[scenario],
      legallyEligible: true,
      decision: "normal",
      legalReasons: ["Sem benefício estadual selecionado; cálculo tributário normal preservado."],
      blockingIssues: [],
      source: "Motor tributário SC + Federal",
      normalImportICMS: row.normalImportICMS,
      effectiveImportICMS: row.normalImportICMS,
      importICMSSavings: 0,
      landedCostBeforeBenefit: row.landedCostBeforeBenefit,
      landedCostAfterBenefit: row.landedCostBeforeBenefit,
      landedCostPerUnit: row.landedCostBeforeBenefit / input.quantity,
      engineResult: baseResult,
    };
  }

  const ttd = Number(scenario.replace("ttd", "")) as 77 | 409 | 410;
  const benefit = resolveSCBenefit({
    ttd,
    destination: input.destination ?? "commercial_resale",
    ncm: input.ncm,
    exclusionKnown: input.exclusionKnown,
    taxableOutput: input.taxableOutput,
    industrializationInSC: input.industrializationInSC,
    preservesOriginalCharacteristics: input.preservesOriginalCharacteristics,
    sameNcmPosition: input.sameNcmPosition,
    otherDeferment: input.otherDeferment,
    paragraph23Or24: input.paragraph23Or24,
    equivalentTaxableEventElection: input.equivalentTaxableEventElection,
    normalOutputICMS: 0,
  });

  const engineResult = benefit.decision === "apply"
    ? calculateSCMultiItemFinalCost({ items: [item], expenses: [{ id: "other-expenses", description: "Outras despesas", amount: input.otherExpensesBrl, treatment: "operational_cost" }], benefitsByItem: { "comparison-item": benefit } })
    : baseResult;
  const row = engineResult.items[0];

  return {
    scenario,
    label: LABELS[scenario],
    legallyEligible: benefit.decision === "apply",
    decision: benefit.decision,
    legalReasons: benefit.reasons,
    blockingIssues: benefit.blockingIssues,
    source: benefit.source,
    normalImportICMS: row.normalImportICMS,
    effectiveImportICMS: row.benefitImportICMS,
    importICMSSavings: row.importICMSSavings,
    landedCostBeforeBenefit: row.landedCostBeforeBenefit,
    landedCostAfterBenefit: row.landedCostAfterBenefit,
    landedCostPerUnit: row.landedCostPerUnitAfterBenefit,
    engineResult,
    benefitResolution: benefit,
  };
}

export function compareImportScenarios(input: ImportScenarioInput): ImportScenarioResult[] {
  return (["normal", "ttd409", "ttd410", "ttd77"] as ImportScenario[]).map((scenario) => compareImportScenario(input, scenario));
}
