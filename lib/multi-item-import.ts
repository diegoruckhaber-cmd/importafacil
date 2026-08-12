import { calculateTributaryOperation, type TributaryResult } from "./tributary-engine";

export type FreightAllocationMethod = "net-weight" | "fob-value" | "quantity" | "volume" | "custom";

export type ImportItem = {
  id: string;
  description: string;
  ncm: string;
  quantity: number;
  fobUsdUnit: number;
  netWeightKg: number;
  volumeM3?: number;
  customAllocationPercent?: number;
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
  totalFreightUsd: number;
  totalInsuranceUsd: number;
  freightAllocation?: FreightAllocationMethod;
  otherBrl?: number;
};

export type MultiItemResult = {
  items: Array<ImportItem & {
    fobBrl: number;
    freightBrl: number;
    insuranceBrl: number;
    valorAduaneiro: number;
    taxes: TributaryResult;
    totalItem: number;
    unitLandedCost: number;
  }>;
  totals: {
    quantity: number;
    netWeightKg: number;
    fobBrl: number;
    freightBrl: number;
    insuranceBrl: number;
    valorAduaneiro: number;
    tributos: number;
    totalImportacao: number;
    custoMedioPonderado: number;
  };
  warnings: string[];
};

const n = (v: number | undefined) => Math.max(0, Number.isFinite(v ?? 0) ? (v ?? 0) : 0);

function share(item: ImportItem, items: ImportItem[], method: FreightAllocationMethod) {
  if (method === "custom") return n(item.customAllocationPercent) / 100;
  const value = method === "net-weight"
    ? n(item.netWeightKg)
    : method === "quantity"
      ? n(item.quantity)
      : method === "volume"
        ? n(item.volumeM3)
        : n(item.quantity) * n(item.fobUsdUnit);
  const total = items.reduce((sum, current) => {
    if (method === "net-weight") return sum + n(current.netWeightKg);
    if (method === "quantity") return sum + n(current.quantity);
    if (method === "volume") return sum + n(current.volumeM3);
    if (method === "custom") return sum + n(current.customAllocationPercent);
    return sum + n(current.quantity) * n(current.fobUsdUnit);
  }, 0);
  return total > 0 ? value / total : 0;
}

/**
 * Calculates a shipment containing multiple items/NCMs.
 * For the default legal-style allocation, international freight is allocated
 * by net weight and international insurance by FOB value, matching the
 * current DUIMP manual. Other allocation methods remain available for
 * analytical scenarios and must be labeled as such in the UI.
 */
export function calculateMultiItemImport(operation: MultiItemImport): MultiItemResult {
  const exchangeRate = n(operation.exchangeRate);
  const items = operation.items ?? [];
  const freightMethod = operation.freightAllocation ?? "net-weight";
  const warnings: string[] = [];

  if (!items.length) warnings.push("A operação precisa ter pelo menos um item.");
  if (freightMethod === "net-weight" && items.some((item) => n(item.netWeightKg) <= 0)) {
    warnings.push("Informe o peso líquido de todos os itens para ratear o frete por peso.");
  }
  if (freightMethod === "volume" && items.some((item) => n(item.volumeM3) <= 0)) {
    warnings.push("Informe o volume de todos os itens para ratear por cubagem.");
  }
  if (freightMethod === "custom") {
    const customTotal = items.reduce((sum, item) => sum + n(item.customAllocationPercent), 0);
    if (Math.abs(customTotal - 100) > 0.01) warnings.push("O rateio personalizado deve totalizar 100%.");
  }

  const resultItems = items.map((item) => {
    const fobUsd = n(item.quantity) * n(item.fobUsdUnit);
    const freightShare = share(item, items, freightMethod);
    const insuranceShare = share(item, items, "fob-value");
    const freightUsd = n(operation.totalFreightUsd) * freightShare;
    const insuranceUsd = n(operation.totalInsuranceUsd) * insuranceShare;
    const otherBrl = n(item.otherBrl) + n(operation.otherBrl) * share(item, items, "fob-value");
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
    return {
      ...item,
      fobBrl: fobUsd * exchangeRate,
      freightBrl: freightUsd * exchangeRate,
      insuranceBrl: insuranceUsd * exchangeRate,
      valorAduaneiro,
      taxes,
      totalItem,
      unitLandedCost: item.quantity > 0 ? totalItem / item.quantity : 0,
    };
  });

  const quantity = resultItems.reduce((sum, item) => sum + n(item.quantity), 0);
  const netWeightKg = resultItems.reduce((sum, item) => sum + n(item.netWeightKg), 0);
  const fobBrl = resultItems.reduce((sum, item) => sum + item.fobBrl, 0);
  const freightBrl = resultItems.reduce((sum, item) => sum + item.freightBrl, 0);
  const insuranceBrl = resultItems.reduce((sum, item) => sum + item.insuranceBrl, 0);
  const valorAduaneiro = resultItems.reduce((sum, item) => sum + item.valorAduaneiro, 0);
  const tributos = resultItems.reduce((sum, item) => sum + item.taxes.totalTributos, 0);
  const totalImportacao = resultItems.reduce((sum, item) => sum + item.totalItem, 0);

  return {
    items: resultItems,
    totals: {
      quantity,
      netWeightKg,
      fobBrl,
      freightBrl,
      insuranceBrl,
      valorAduaneiro,
      tributos,
      totalImportacao,
      custoMedioPonderado: quantity > 0 ? totalImportacao / quantity : 0,
    },
    warnings,
  };
}
