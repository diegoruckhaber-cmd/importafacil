import { calculateTributaryOperation, type TributaryResult } from "./tributary-engine";

export type ImportItem = {
  id: string;
  description: string;
  ncm: string;
  quantity: number;
  fobUsdUnit: number;
  freightUsd?: number;
  insuranceUsd?: number;
  otherBrl?: number;
  iiRate: number;
  ipiRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsRate: number;
};

export type MultiItemImport = {
  items: ImportItem[];
  exchangeRate: number;
};

export type MultiItemResult = {
  items: Array<ImportItem & {
    fobBrl: number;
    valorAduaneiro: number;
    taxes: TributaryResult;
    totalItem: number;
    unitLandedCost: number;
  }>;
  totals: {
    quantity: number;
    fobBrl: number;
    valorAduaneiro: number;
    tributos: number;
    totalImportacao: number;
    custoMedioPonderado: number;
  };
};

const n = (v: number | undefined) => Math.max(0, Number.isFinite(v ?? 0) ? (v ?? 0) : 0);

/**
 * Calculates a shipment containing multiple items/NCMs.
 * Freight, insurance and other shared costs can be allocated by each item's
 * FOB value. This keeps the calculation extensible for later allocation
 * methods (weight, volume, quantity or user-defined percentages).
 */
export function calculateMultiItemImport(operation: MultiItemImport): MultiItemResult {
  const exchangeRate = n(operation.exchangeRate);
  const items = operation.items ?? [];
  const totalFobUsd = items.reduce((sum, item) => sum + n(item.quantity) * n(item.fobUsdUnit), 0);
  const totalFreightUsd = items.reduce((sum, item) => sum + n(item.freightUsd), 0);
  const totalInsuranceUsd = items.reduce((sum, item) => sum + n(item.insuranceUsd), 0);
  const totalOtherBrl = items.reduce((sum, item) => sum + n(item.otherBrl), 0);

  const resultItems = items.map((item) => {
    const fobUsd = n(item.quantity) * n(item.fobUsdUnit);
    const share = totalFobUsd > 0 ? fobUsd / totalFobUsd : 0;
    const freightUsd = totalFreightUsd > 0 ? totalFreightUsd * share : 0;
    const insuranceUsd = totalInsuranceUsd > 0 ? totalInsuranceUsd * share : 0;
    const otherBrl = totalOtherBrl > 0 ? totalOtherBrl * share : 0;
    const valorAduaneiro = (fobUsd + freightUsd + insuranceUsd) * exchangeRate;

    const taxes = calculateTributaryOperation({
      valorAduaneiro,
      iiRate: item.iiRate,
      ipiRate: item.ipiRate,
      pisImportRate: item.pisImportRate,
      cofinsImportRate: item.cofinsImportRate,
      icmsRate: item.icmsRate,
      otherBrl,
    });

    const totalItem = valorAduaneiro + otherBrl + taxes.totalTributos;
    const unitLandedCost = item.quantity > 0 ? totalItem / item.quantity : 0;

    return {
      ...item,
      fobBrl: fobUsd * exchangeRate,
      valorAduaneiro,
      taxes,
      totalItem,
      unitLandedCost,
    };
  });

  const quantity = resultItems.reduce((sum, item) => sum + n(item.quantity), 0);
  const fobBrl = resultItems.reduce((sum, item) => sum + item.fobBrl, 0);
  const valorAduaneiro = resultItems.reduce((sum, item) => sum + item.valorAduaneiro, 0);
  const tributos = resultItems.reduce((sum, item) => sum + item.taxes.totalTributos, 0);
  const totalImportacao = resultItems.reduce((sum, item) => sum + item.totalItem, 0);

  return {
    items: resultItems,
    totals: {
      quantity,
      fobBrl,
      valorAduaneiro,
      tributos,
      totalImportacao,
      custoMedioPonderado: quantity > 0 ? totalImportacao / quantity : 0,
    },
  };
}
