export type ValidationIssue = {
  field: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

type NumericField = {
  field: string;
  value: unknown;
  min?: number;
  max?: number;
};

export function validateTributaryInput(input: Record<string, unknown>): ValidationResult {
  const issues: ValidationIssue[] = [];

  const numericFields: NumericField[] = [
    { field: "valorAduaneiro", value: input.valorAduaneiro, min: 0 },
    { field: "iiRate", value: input.iiRate, min: 0, max: 100 },
    { field: "ipiRate", value: input.ipiRate, min: 0, max: 100 },
    { field: "pisImportRate", value: input.pisImportRate, min: 0, max: 100 },
    { field: "cofinsImportRate", value: input.cofinsImportRate, min: 0, max: 100 },
    { field: "icmsRate", value: input.icmsRate, min: 0, max: 99.999999 },
    { field: "otherBrl", value: input.otherBrl ?? 0, min: 0 },
    { field: "icmsTaxableAdditionsBrl", value: input.icmsTaxableAdditionsBrl ?? 0, min: 0 },
  ];

  for (const item of numericFields) {
    if (typeof item.value !== "number" || !Number.isFinite(item.value)) {
      issues.push({ field: item.field, message: "deve ser um número finito" });
      continue;
    }
    if (item.min !== undefined && item.value < item.min) {
      issues.push({ field: item.field, message: `deve ser >= ${item.min}` });
    }
    if (item.max !== undefined && item.value > item.max) {
      issues.push({ field: item.field, message: `deve ser <= ${item.max}` });
    }
  }

  return { valid: issues.length === 0, issues };
}
