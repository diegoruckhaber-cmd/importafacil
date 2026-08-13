import type { TributaryResult } from "./tributary-engine";
import type { SCBenefitResolution } from "./sc-benefit-resolution";

export type ItemSCBenefitInput = {
  itemId: string;
  taxes: TributaryResult;
  benefit?: SCBenefitResolution;
};

export type ItemSCBenefitResult = {
  itemId: string;
  decision: "normal" | "apply" | "conditional" | "deny";
  importDeferred: boolean;
  outputPresumedCredit: boolean;
  normalImportICMS: number;
  benefitImportICMS: number;
  importICMSSavings: number;
  warnings: string[];
  reasons: string[];
};

export type SCBenefitBridgeResult = {
  items: ItemSCBenefitResult[];
  totalNormalImportICMS: number;
  totalBenefitImportICMS: number;
  totalImportICMSSavings: number;
  status: "calculated" | "conditional" | "blocked";
  warnings: string[];
};

/**
 * Applies only the validated import-stage effect of an SC benefit.
 *
 * Import deferral can reduce import-stage ICMS cash to zero when the legal
 * resolution is "apply". Presumed credit at the output stage is deliberately
 * not subtracted here; it belongs to the subsequent sale/output calculation.
 */
export function applySCImportBenefitToItems(items: ItemSCBenefitInput[]): SCBenefitBridgeResult {
  if (!items.length) throw new Error("A operação deve possuir ao menos um item");

  const warnings: string[] = [];
  const results = items.map((item) => {
    if (!item.itemId) throw new Error("itemId inválido");

    const normalImportICMS = item.taxes.icms.payable;
    const benefit = item.benefit;

    if (!benefit) {
      return {
        itemId: item.itemId,
        decision: "normal" as const,
        importDeferred: false,
        outputPresumedCredit: false,
        normalImportICMS,
        benefitImportICMS: normalImportICMS,
        importICMSSavings: 0,
        warnings: [],
        reasons: ["Nenhum benefício de SC foi associado ao item; tributação normal preservada."],
      };
    }

    if (benefit.decision === "deny") {
      return {
        itemId: item.itemId,
        decision: "deny" as const,
        importDeferred: false,
        outputPresumedCredit: false,
        normalImportICMS,
        benefitImportICMS: normalImportICMS,
        importICMSSavings: 0,
        warnings: [...benefit.blockingIssues],
        reasons: benefit.reasons,
      };
    }

    if (benefit.decision === "conditional") {
      return {
        itemId: item.itemId,
        decision: "conditional" as const,
        importDeferred: false,
        outputPresumedCredit: false,
        normalImportICMS,
        benefitImportICMS: normalImportICMS,
        importICMSSavings: 0,
        warnings: [...benefit.blockingIssues],
        reasons: benefit.reasons,
      };
    }

    const benefitImportICMS = benefit.importDeferred ? 0 : normalImportICMS;
    const importICMSSavings = Math.max(0, normalImportICMS - benefitImportICMS);

    return {
      itemId: item.itemId,
      decision: "apply" as const,
      importDeferred: benefit.importDeferred,
      outputPresumedCredit: benefit.outputPresumedCredit,
      normalImportICMS,
      benefitImportICMS,
      importICMSSavings,
      warnings: [],
      reasons: benefit.reasons,
    };
  });

  const hasBlocked = results.some((item) => item.decision === "deny");
  const hasConditional = results.some((item) => item.decision === "conditional");
  const bridgeWarnings = results.flatMap((item) => item.warnings.map((warning) => `${item.itemId}: ${warning}`));
  warnings.push(...bridgeWarnings);

  return {
    items: results,
    totalNormalImportICMS: results.reduce((sum, item) => sum + item.normalImportICMS, 0),
    totalBenefitImportICMS: results.reduce((sum, item) => sum + item.benefitImportICMS, 0),
    totalImportICMSSavings: results.reduce((sum, item) => sum + item.importICMSSavings, 0),
    status: hasBlocked ? "blocked" : hasConditional ? "conditional" : "calculated",
    warnings,
  };
}
