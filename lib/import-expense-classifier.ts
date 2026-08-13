export type ImportExpense = {
  id: string;
  description: string;
  amount: number;
  category: "port" | "freight_agent" | "customs_broker" | "warehouse" | "transport" | "insurance" | "banking" | "other";
  taxBaseTreatment: "customs_value" | "icms_import_base" | "cost_only" | "conditional";
  allocation: "by_value" | "by_weight" | "by_volume" | "direct_item" | "manual";
  note: string;
};

export type ClassifiedExpense = ImportExpense & {
  includedInCustomsValue: boolean;
  includedInImportICMSBase: boolean;
};

/**
 * Classifies operational expenses without assuming that every local cost is
 * part of the ICMS import base. The legal classification remains explicit.
 */
export function classifyImportExpense(expense: ImportExpense): ClassifiedExpense {
  if (!Number.isFinite(expense.amount) || expense.amount < 0) {
    throw new Error(`Despesa inválida: ${expense.id}`);
  }

  if (expense.taxBaseTreatment === "conditional") {
    return {
      ...expense,
      includedInCustomsValue: false,
      includedInImportICMSBase: false,
    };
  }

  return {
    ...expense,
    includedInCustomsValue: expense.taxBaseTreatment === "customs_value",
    includedInImportICMSBase: expense.taxBaseTreatment === "icms_import_base" || expense.taxBaseTreatment === "customs_value",
  };
}

export function classifyImportExpenses(expenses: ImportExpense[]): ClassifiedExpense[] {
  return expenses.map(classifyImportExpense);
}

export function summarizeImportExpenses(expenses: ClassifiedExpense[]) {
  return expenses.reduce(
    (summary, expense) => {
      summary.total += expense.amount;
      if (expense.includedInCustomsValue) summary.customsValue += expense.amount;
      if (expense.includedInImportICMSBase) summary.icmsImportBase += expense.amount;
      if (!expense.includedInCustomsValue && !expense.includedInImportICMSBase) summary.costOnly += expense.amount;
      return summary;
    },
    { total: 0, customsValue: 0, icmsImportBase: 0, costOnly: 0 },
  );
}
