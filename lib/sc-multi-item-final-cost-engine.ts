import { calculateItemTributaryOperation, type ItemImportExpense, type ItemTributaryInput } from "./item-tributary-expense-engine";
import { applySCImportBenefitToItems, type ItemSCBenefitResult } from "./item-sc-benefit-bridge";
import type { SCBenefitResolution } from "./sc-benefit-resolution";

export type SCMultiItemFinalCostInput = {
  items: ItemTributaryInput[];
  expenses: ItemImportExpense[];
  benefitsByItem?: Record<string, SCBenefitResolution>;
};

export type SCMultiItemFinalCostItem = {
  itemId: string;
  baseCustomsValue: number;
  effectiveCustomsValue: number;
  allocatedCustomsBaseExpenses: number;
  allocatedIcmsImportBaseExpenses: number;
  allocatedOperationalExpenses: number;
  allocatedConditionalExpenses: number;
  totalAllocatedExpenses: number;
  normalTaxTotal: number;
  benefitTaxTotal: number;
  importICMSSavings: number;
  landedCostBeforeBenefit: number;
  landedCostAfterBenefit: number;
  landedCostPerUnitAfterBenefit: number;
  taxLines: {
    ii: ReturnType<typeof calculateItemTributaryOperation>["items"][number]["taxLines"]["ii"];
    ipi: ReturnType<typeof calculateItemTributaryOperation>["items"][number]["taxLines"]["ipi"];
    pisImport: ReturnType<typeof calculateItemTributaryOperation>["items"][number]["taxLines"]["pisImport"];
    cofinsImport: ReturnType<typeof calculateItemTributaryOperation>["items"][number]["taxLines"]["cofinsImport"];
    icms: ReturnType<typeof calculateItemTributaryOperation>["items"][number]["taxLines"]["icms"];
  };
  benefit: ItemSCBenefitResult;
  warnings: string[];

  /** Backward-compatible aliases consumed by the current operation memory UI. */
  customsValue: number;
  allocatedExpensesTotal: number;
};

export type SCMultiItemFinalCostResult = {
  items: SCMultiItemFinalCostItem[];
  totalCustomsValue: number;
  totalAllocatedExpenses: number;
  totalNormalTaxes: number;
  totalBenefitTaxes: number;
  totalImportICMSSavings: number;
  totalLandedCostBeforeBenefit: number;
  totalLandedCostAfterBenefit: number;
  status: "calculated" | "conditional" | "blocked";
  warnings: string[];
};

/**
 * Final composition layer for the current SC item pipeline:
 * DI/items -> expense classification/allocation -> tax bases -> normal taxes
 * -> validated import-stage SC benefit -> final item landed cost.
 *
 * Output-stage presumed credit is intentionally not deducted from landed cost;
 * it belongs to the subsequent sales/output calculation.
 */
export function calculateSCMultiItemFinalCost(input: SCMultiItemFinalCostInput): SCMultiItemFinalCostResult {
  const taxResult = calculateItemTributaryOperation(input.items, input.expenses);

  const benefitResult = applySCImportBenefitToItems(
    taxResult.items.map((item) => ({
      itemId: item.itemId,
      taxes: item.taxes,
      benefit: input.benefitsByItem?.[item.itemId],
    })),
  );

  const benefitByItem = new Map(benefitResult.items.map((item) => [item.itemId, item]));

  const items = taxResult.items.map((item) => {
    const benefit = benefitByItem.get(item.itemId)!;
    const normalTaxTotal = item.taxes.totalTributos;
    const benefitTaxTotal = Math.max(0, normalTaxTotal - benefit.importICMSSavings);
    const landedCostBeforeBenefit = item.landedCost;
    const landedCostAfterBenefit = Math.max(0, landedCostBeforeBenefit - benefit.importICMSSavings);
    const quantity = input.items.find((source) => source.itemId === item.itemId)?.quantity ?? 0;

    return {
      itemId: item.itemId,
      baseCustomsValue: item.baseCustomsValue,
      effectiveCustomsValue: item.effectiveCustomsValue,
      allocatedCustomsBaseExpenses: item.allocatedCustomsBaseExpenses,
      allocatedIcmsImportBaseExpenses: item.allocatedIcmsImportBaseExpenses,
      allocatedOperationalExpenses: item.allocatedOperationalExpenses,
      allocatedConditionalExpenses: item.allocatedConditionalExpenses,
      totalAllocatedExpenses: item.totalAllocatedExpenses,
      normalTaxTotal,
      benefitTaxTotal,
      importICMSSavings: benefit.importICMSSavings,
      landedCostBeforeBenefit,
      landedCostAfterBenefit,
      landedCostPerUnitAfterBenefit: quantity > 0 ? landedCostAfterBenefit / quantity : landedCostAfterBenefit,
      taxLines: item.taxLines,
      benefit,
      warnings: benefit.warnings,
      customsValue: item.effectiveCustomsValue,
      allocatedExpensesTotal: item.totalAllocatedExpenses,
    } satisfies SCMultiItemFinalCostItem;
  });

  const warnings = [...taxResult.warnings, ...benefitResult.warnings];
  const hasBlocked = benefitResult.status === "blocked";
  const hasConditional = benefitResult.status === "conditional" || taxResult.warnings.length > 0;

  return {
    items,
    totalCustomsValue: taxResult.totalCustomsValue,
    totalAllocatedExpenses: taxResult.totalAllocatedExpenses,
    totalNormalTaxes: items.reduce((sum, item) => sum + item.normalTaxTotal, 0),
    totalBenefitTaxes: items.reduce((sum, item) => sum + item.benefitTaxTotal, 0),
    totalImportICMSSavings: items.reduce((sum, item) => sum + item.importICMSSavings, 0),
    totalLandedCostBeforeBenefit: items.reduce((sum, item) => sum + item.landedCostBeforeBenefit, 0),
    totalLandedCostAfterBenefit: items.reduce((sum, item) => sum + item.landedCostAfterBenefit, 0),
    status: hasBlocked ? "blocked" : hasConditional ? "conditional" : "calculated",
    warnings,
  };
}
