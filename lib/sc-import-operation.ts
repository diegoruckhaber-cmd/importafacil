import { calculateTributaryOperation, type TributaryResult } from "./tributary-engine.ts";

export type SCImportOperationInput = {
  quantity: number;
  unitFobUsd: number;
  exchangeRate: number;
  freightUsd: number;
  insuranceUsd: number;
  otherBrl?: number;
  icmsTaxableAdditionsBrl?: number;
  iiRate: number;
  ipiRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsRate: number;
};

export type SCImportOperationResult = {
  merchandiseBrl: number;
  freightBrl: number;
  insuranceBrl: number;
  valorAduaneiro: number;
  taxes: TributaryResult;
  totalLandedCostBeforeBenefit: number;
  landedCostPerUnitBeforeBenefit: number;
};

/**
 * Converts the commercial inputs used by the UI into the validated base
 * operation consumed by the tributary engine. It intentionally does not
 * apply a SC benefit: benefit eligibility/effect remains a separate layer.
 */
export function calculateSCImportOperation(input: SCImportOperationInput): SCImportOperationResult {
  const numeric = [
    ["quantity", input.quantity],
    ["unitFobUsd", input.unitFobUsd],
    ["exchangeRate", input.exchangeRate],
    ["freightUsd", input.freightUsd],
    ["insuranceUsd", input.insuranceUsd],
  ] as const;

  for (const [name, value] of numeric) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`${name} inválido`);
  }
  if (input.quantity <= 0) throw new Error("quantity deve ser maior que zero");
  if (input.exchangeRate <= 0) throw new Error("exchangeRate deve ser maior que zero");

  const merchandiseBrl = input.quantity * input.unitFobUsd * input.exchangeRate;
  const freightBrl = input.freightUsd * input.exchangeRate;
  const insuranceBrl = input.insuranceUsd * input.exchangeRate;
  const valorAduaneiro = merchandiseBrl + freightBrl + insuranceBrl;

  const taxes = calculateTributaryOperation({
    valorAduaneiro,
    iiRate: input.iiRate,
    ipiRate: input.ipiRate,
    pisImportRate: input.pisImportRate,
    cofinsImportRate: input.cofinsImportRate,
    icmsRate: input.icmsRate,
    otherBrl: input.otherBrl,
    icmsTaxableAdditionsBrl: input.icmsTaxableAdditionsBrl,
  });

  const totalLandedCostBeforeBenefit = valorAduaneiro + (input.otherBrl ?? 0) + taxes.totalTributos;

  return {
    merchandiseBrl,
    freightBrl,
    insuranceBrl,
    valorAduaneiro,
    taxes,
    totalLandedCostBeforeBenefit,
    landedCostPerUnitBeforeBenefit: totalLandedCostBeforeBenefit / input.quantity,
  };
}
