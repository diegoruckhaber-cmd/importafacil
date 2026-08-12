export type TributaryValidationIssue = {
  field: string;
  code: string;
  message: string;
};

export type TributaryValidationResult = {
  valid: boolean;
  issues: TributaryValidationIssue[];
};

type RequiredNumericField = {
  name: string;
  value: unknown;
  min?: number;
  max?: number;
};

function validateNumericField(field: RequiredNumericField, issues: TributaryValidationIssue[]) {
  if (typeof field.value !== "number" || !Number.isFinite(field.value)) {
    issues.push({
      field: field.name,
      code: "INVALID_NUMBER",
      message: `${field.name} deve ser um número finito.`,
    });
    return;
  }

  if (field.min !== undefined && field.value < field.min) {
    issues.push({
      field: field.name,
      code: "BELOW_MINIMUM",
      message: `${field.name} não pode ser menor que ${field.min}.`,
    });
  }

  if (field.max !== undefined && field.value > field.max) {
    issues.push({
      field: field.name,
      code: "ABOVE_MAXIMUM",
      message: `${field.name} não pode ser maior que ${field.max}.`,
    });
  }
}

/**
 * Strict input validation for the baseline tax engine.
 *
 * This intentionally does not silently coerce bad values to zero. A tax
 * calculator must distinguish an actual zero from an invalid/missing input.
 */
export function validateTributaryInput(input: {
  valorAduaneiro: unknown;
  iiRate: unknown;
  ipiRate: unknown;
  pisImportRate: unknown;
  cofinsImportRate: unknown;
  icmsRate: unknown;
  otherBrl?: unknown;
  icmsTaxableAdditionsBrl?: unknown;
}): TributaryValidationResult {
  const issues: TributaryValidationIssue[] = [];

  validateNumericField({ name: "valorAduaneiro", value: input.valorAduaneiro, min: 0 }, issues);
  validateNumericField({ name: "iiRate", value: input.iiRate, min: 0, max: 100 }, issues);
  validateNumericField({ name: "ipiRate", value: input.ipiRate, min: 0, max: 100 }, issues);
  validateNumericField({ name: "pisImportRate", value: input.pisImportRate, min: 0, max: 100 }, issues);
  validateNumericField({ name: "cofinsImportRate", value: input.cofinsImportRate, min: 0, max: 100 }, issues);
  validateNumericField({ name: "icmsRate", value: input.icmsRate, min: 0, max: 100 }, issues);

  if (input.otherBrl !== undefined) {
    validateNumericField({ name: "otherBrl", value: input.otherBrl, min: 0 }, issues);
  }

  if (input.icmsTaxableAdditionsBrl !== undefined) {
    validateNumericField({
      name: "icmsTaxableAdditionsBrl",
      value: input.icmsTaxableAdditionsBrl,
      min: 0,
    }, issues);
  }

  if (typeof input.icmsRate === "number" && input.icmsRate >= 100) {
    issues.push({
      field: "icmsRate",
      code: "INVALID_ICMS_RATE",
      message: "A alíquota de ICMS deve ser inferior a 100% para o cálculo por dentro.",
    });
  }

  return { valid: issues.length === 0, issues };
}
