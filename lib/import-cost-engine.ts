export type ExpenseTreatment = "customs_base" | "icms_import_base" | "operational_cost" | "conditional";

export type ImportExpense = {
  id: string;
  description: string;
  amount: number;
  treatment: ExpenseTreatment;
  allocation?: "value" | "weight" | "quantity" | "manual";
  note?: string;
};

export type ImportCostResult = {
  customsBaseExpenses: number;
  icmsImportBaseExpenses: number;
  operationalExpenses: number;
  conditionalExpenses: number;
  totalOperationalCost: number;
  totalKnownExpenses: number;
  warnings: string[];
};

/**
 * Separates fiscal-base treatment from the economic landed-cost view.
 * A local expense is never added to a tax base merely because it is part of
 * the import process; its treatment must be explicitly classified.
 */
export function calculateImportCost(expenses: ImportExpense[]): ImportCostResult {
  const warnings: string[] = [];
  let customsBaseExpenses = 0;
  let icmsImportBaseExpenses = 0;
  let operationalExpenses = 0;
  let conditionalExpenses = 0;

  for (const expense of expenses) {
    if (!Number.isFinite(expense.amount) || expense.amount < 0) {
      throw new Error(`Despesa inválida: ${expense.id}`);
    }

    switch (expense.treatment) {
      case "customs_base":
        customsBaseExpenses += expense.amount;
        break;
      case "icms_import_base":
        icmsImportBaseExpenses += expense.amount;
        break;
      case "operational_cost":
        operationalExpenses += expense.amount;
        break;
      case "conditional":
        conditionalExpenses += expense.amount;
        warnings.push(`Despesa ${expense.id} requer validação antes de integrar base tributária.`);
        break;
    }
  }

  return {
    customsBaseExpenses,
    icmsImportBaseExpenses,
    operationalExpenses,
    conditionalExpenses,
    totalOperationalCost: operationalExpenses + conditionalExpenses,
    totalKnownExpenses: customsBaseExpenses + icmsImportBaseExpenses + operationalExpenses + conditionalExpenses,
    warnings,
  };
}
