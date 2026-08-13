import type { CostAllocationMethod } from "./import-cost-allocation";
import type { ItemImportExpense, ItemTributaryInput } from "./item-tributary-expense-engine";
import { allocateImportCost } from "./import-cost-allocation";

export type ExpenseAllocationTrace = {
  expenseId: string;
  description: string;
  treatment: ItemImportExpense["treatment"];
  allocation: CostAllocationMethod | "direct";
  totalAmount: number;
  itemId: string;
  share: number;
  allocatedAmount: number;
  note?: string;
};

/**
 * Produces an audit-friendly explanation of how every expense reached each item.
 * It does not calculate taxes; it only exposes the allocation path used by the
 * same allocation engine consumed by the tax/cost pipeline.
 */
export function traceItemExpenseAllocation(
  items: ItemTributaryInput[],
  expenses: ItemImportExpense[],
): ExpenseAllocationTrace[] {
  return expenses.flatMap((expense) => {
    if (expense.itemId) {
      return [{
        expenseId: expense.id,
        description: expense.description,
        treatment: expense.treatment,
        allocation: "direct" as const,
        totalAmount: expense.amount,
        itemId: expense.itemId,
        share: 1,
        allocatedAmount: expense.amount,
        note: expense.note,
      }];
    }

    if (!expense.allocation) {
      throw new Error(`Despesa ${expense.id} precisa informar o critério de rateio`);
    }

    return allocateImportCost(expense.amount, items, expense.allocation).map((allocation) => ({
      expenseId: expense.id,
      description: expense.description,
      treatment: expense.treatment,
      allocation: expense.allocation!,
      totalAmount: expense.amount,
      itemId: allocation.itemId,
      share: allocation.share,
      allocatedAmount: allocation.allocatedCost,
      note: expense.note,
    }));
  });
}
