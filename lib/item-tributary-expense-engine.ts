import { allocateImportCost, type CostAllocationInput, type CostAllocationMethod } from "./import-cost-allocation.ts";
import { calculateTributaryOperation, type TaxLine, type TributaryResult } from "./tributary-engine.ts";

export type ItemTributaryInput = CostAllocationInput & {
  iiRate: number;
  ipiRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsRate: number;
  importDate?: `${number}-${number}-${number}`;
  iiLegalFoundation?: string;
  iiBenefitKind?: "none" | "reduced_rate" | "exemption" | "suspension";
  iiCoveredByLC224?: boolean;
  iiExceptionToLC224?: boolean;
  iiReducedRate?: number;
  cofinsReducedBenefit?: boolean;
  cofinsAdditional060?: boolean;
};

export type ItemImportExpense = {
  id: string;
  description: string;
  amount: number;
  treatment: "customs_base" | "icms_import_base" | "operational_cost" | "conditional";
  allocation?: CostAllocationMethod;
  itemId?: string;
  note?: string;
};

export type ItemTributaryResult = {
  itemId: string;
  baseCustomsValue: number;
  allocatedCustomsBaseExpenses: number;
  effectiveCustomsValue: number;
  allocatedIcmsImportBaseExpenses: number;
  allocatedOperationalExpenses: number;
  allocatedConditionalExpenses: number;
  totalAllocatedExpenses: number;
  taxes: TributaryResult;
  landedCost: number;
  landedCostPerUnit: number;
  taxLines: {
    ii: TaxLine;
    ipi: TaxLine;
    pisImport: TaxLine;
    cofinsImport: TaxLine;
    icms: TaxLine;
  };
  /** Versioned federal-rule metadata used by the audit/memory layer. */
  federal2026?: TributaryResult["federal2026"];
};

export type ItemTributaryOperationResult = {
  items: ItemTributaryResult[];
  totalCustomsValue: number;
  totalAllocatedExpenses: number;
  totalTaxes: number;
  totalLandedCost: number;
  warnings: string[];
};

type ExpenseBuckets = {
  customsBase: number;
  icmsImportBase: number;
  operational: number;
  conditional: number;
};

function addBucket(bucket: ExpenseBuckets, treatment: ItemImportExpense["treatment"], amount: number) {
  if (treatment === "customs_base") bucket.customsBase += amount;
  if (treatment === "icms_import_base") bucket.icmsImportBase += amount;
  if (treatment === "operational_cost") bucket.operational += amount;
  if (treatment === "conditional") bucket.conditional += amount;
}

function validateItem(item: ItemTributaryInput) {
  const numeric = [
    ["customsValue", item.customsValue],
    ["iiRate", item.iiRate],
    ["ipiRate", item.ipiRate],
    ["pisImportRate", item.pisImportRate],
    ["cofinsImportRate", item.cofinsImportRate],
    ["icmsRate", item.icmsRate],
  ] as const;

  for (const [name, value] of numeric) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`${name} inválido no item ${item.itemId}`);
  }
}

function allocateExpense(
  expense: ItemImportExpense,
  items: ItemTributaryInput[],
): Array<{ itemId: string; amount: number }> {
  if (expense.itemId) {
    if (!items.some((item) => item.itemId === expense.itemId)) {
      throw new Error(`Despesa ${expense.id} referencia item inexistente: ${expense.itemId}`);
    }
    return [{ itemId: expense.itemId, amount: expense.amount }];
  }

  if (!expense.allocation) {
    throw new Error(`Despesa ${expense.id} precisa informar o critério de rateio`);
  }

  const allocated = allocateImportCost(expense.amount, items, expense.allocation);
  return allocated.map((row) => ({ itemId: row.itemId, amount: row.allocatedCost }));
}

/**
 * Integrates shared/direct import expenses into the item-level tax calculation.
 * Fiscal treatment and economic landed cost remain separate decisions.
 */
export function calculateItemTributaryOperation(
  items: ItemTributaryInput[],
  expenses: ItemImportExpense[],
): ItemTributaryOperationResult {
  if (!items.length) throw new Error("A operação precisa ter pelo menos um item");

  const ids = new Set<string>();
  for (const item of items) {
    if (!item.itemId || ids.has(item.itemId)) throw new Error(`itemId inválido ou duplicado: ${item.itemId}`);
    ids.add(item.itemId);
    validateItem(item);
  }

  const buckets = new Map<string, ExpenseBuckets>();
  for (const item of items) {
    buckets.set(item.itemId, { customsBase: 0, icmsImportBase: 0, operational: 0, conditional: 0 });
  }

  const warnings: string[] = [];

  for (const expense of expenses) {
    if (!Number.isFinite(expense.amount) || expense.amount < 0) throw new Error(`Despesa inválida: ${expense.id}`);

    const allocations = allocateExpense(expense, items);
    for (const allocation of allocations) addBucket(buckets.get(allocation.itemId)!, expense.treatment, allocation.amount);

    if (expense.treatment === "conditional") {
      warnings.push(`Despesa ${expense.id} (${expense.description}) requer validação antes de integrar qualquer base tributária.`);
    }
  }

  const resultItems = items.map((item) => {
    const bucket = buckets.get(item.itemId)!;
    const effectiveCustomsValue = item.customsValue + bucket.customsBase;

    const taxes = calculateTributaryOperation({
      valorAduaneiro: effectiveCustomsValue,
      iiRate: item.iiRate,
      ipiRate: item.ipiRate,
      pisImportRate: item.pisImportRate,
      cofinsImportRate: item.cofinsImportRate,
      icmsRate: item.icmsRate,
      icmsTaxableAdditionsBrl: bucket.icmsImportBase,
      otherBrl: bucket.operational + bucket.conditional,
      importDate: item.importDate,
      iiLegalFoundation: item.iiLegalFoundation,
      iiBenefitKind: item.iiBenefitKind,
      iiCoveredByLC224: item.iiCoveredByLC224,
      iiExceptionToLC224: item.iiExceptionToLC224,
      iiReducedRate: item.iiReducedRate,
      cofinsReducedBenefit: item.cofinsReducedBenefit,
      cofinsAdditional060: item.cofinsAdditional060,
    });

    const totalAllocatedExpenses = bucket.customsBase + bucket.icmsImportBase + bucket.operational + bucket.conditional;
    const landedCost = item.customsValue + totalAllocatedExpenses + taxes.totalTributos;
    const quantity = item.quantity ?? 0;

    return {
      itemId: item.itemId,
      baseCustomsValue: item.customsValue,
      allocatedCustomsBaseExpenses: bucket.customsBase,
      effectiveCustomsValue,
      allocatedIcmsImportBaseExpenses: bucket.icmsImportBase,
      allocatedOperationalExpenses: bucket.operational,
      allocatedConditionalExpenses: bucket.conditional,
      totalAllocatedExpenses,
      taxes,
      landedCost,
      landedCostPerUnit: quantity > 0 ? landedCost / quantity : landedCost,
      taxLines: { ii: taxes.ii, ipi: taxes.ipi, pisImport: taxes.pisImport, cofinsImport: taxes.cofinsImport, icms: taxes.icms },
      federal2026: taxes.federal2026,
    } satisfies ItemTributaryResult;
  });

  return {
    items: resultItems,
    totalCustomsValue: resultItems.reduce((sum, item) => sum + item.effectiveCustomsValue, 0),
    totalAllocatedExpenses: resultItems.reduce((sum, item) => sum + item.totalAllocatedExpenses, 0),
    totalTaxes: resultItems.reduce((sum, item) => sum + item.taxes.totalTributos, 0),
    totalLandedCost: resultItems.reduce((sum, item) => sum + item.landedCost, 0),
    warnings,
  };
}
