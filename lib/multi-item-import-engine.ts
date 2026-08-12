import { calculateTributaryOperation, type TributaryOperation, type TributaryResult } from "./tributary-engine";

export type ImportItem = {
  id: string;
  description: string;
  ncm: string;
  quantity: number;
  unitPriceUsd: number;
  netWeightKg: number;
  iiRate: number;
  ipiRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
};

export type ImportShipment = {
  fx: number;
  internationalFreightUsd: number;
  internationalInsuranceUsd: number;
  otherBrl?: number;
  icmsRate: number;
  freightAllocation: "net_weight" | "fob_value";
  insuranceAllocation: "fob_value";
  items: ImportItem[];
};

export type CalculatedImportItem = ImportItem & {
  fobUsd: number;
  fobBrl: number;
  freightUsd: number;
  insuranceUsd: number;
  valorAduaneiro: number;
  taxes: TributaryResult;
};

export type MultiItemImportResult = {
  items: CalculatedImportItem[];
  totals: {
    quantity: number;
    fobUsd: number;
    fobBrl: number;
    freightUsd: number;
    insuranceUsd: number;
    valorAduaneiro: number;
    ii: number;
    ipi: number;
    pisImport: number;
    cofinsImport: number;
    icms: number;
    totalTributos: number;
    otherBrl: number;
    totalDesembolso: number;
  };
  warnings: string[];
};

const n = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);

function proportional(value: number, part: number, total: number) {
  return total > 0 ? value * (part / total) : 0;
}

/**
 * Calculates a shipment containing multiple commercial items.
 *
 * Freight follows the Receita/Siscomex baseline: when the allocation method
 * is net weight, freight is allocated in direct proportion to each item's
 * net weight. Insurance is allocated by FOB value. This mirrors the official
 * DUIMP guidance for the first valuation method.
 */
export function calculateMultiItemImport(shipment: ImportShipment): MultiItemImportResult {
  const fx = n(shipment.fx);
  const items = shipment.items ?? [];
  const totalFobUsd = items.reduce((sum, item) => sum + n(item.quantity) * n(item.unitPriceUsd), 0);
  const totalWeight = items.reduce((sum, item) => sum + n(item.netWeightKg), 0);
  const freightUsd = n(shipment.internationalFreightUsd);
  const insuranceUsd = n(shipment.internationalInsuranceUsd);
  const otherBrl = n(shipment.otherBrl ?? 0);
  const warnings: string[] = [];

  if (!items.length) warnings.push("A operação precisa ter pelo menos um item.");
  if (shipment.freightAllocation === "net_weight" && totalWeight <= 0 && freightUsd > 0) {
    warnings.push("Não foi possível ratear o frete por peso porque o peso líquido total é zero.");
  }

  const calculatedItems: CalculatedImportItem[] = items.map((item) => {
    const fobUsd = n(item.quantity) * n(item.unitPriceUsd);
    const freightPart = shipment.freightAllocation === "net_weight"
      ? proportional(freightUsd, n(item.netWeightKg), totalWeight)
      : proportional(freightUsd, fobUsd, totalFobUsd);
    const insurancePart = proportional(insuranceUsd, fobUsd, totalFobUsd);
    const fobBrl = fobUsd * fx;
    const valorAduaneiro = (fobUsd + freightPart + insurancePart) * fx;

    const operation: TributaryOperation = {
      valorAduaneiro,
      iiRate: item.iiRate,
      ipiRate: item.ipiRate,
      pisImportRate: item.pisImportRate,
      cofinsImportRate: item.cofinsImportRate,
      icmsRate: shipment.icmsRate,
      // Other expenses remain at shipment level until the state/legal rule
      // determines whether and how each expense belongs in the ICMS base.
      otherBrl: 0,
    };

    return {
      ...item,
      fobUsd,
      fobBrl,
      freightUsd: freightPart,
      insuranceUsd: insurancePart,
      valorAduaneiro,
      taxes: calculateTributaryOperation(operation),
    };
  });

  const sum = (selector: (item: CalculatedImportItem) => number) => calculatedItems.reduce((total, item) => total + selector(item), 0);
  const taxes = (selector: (taxes: TributaryResult) => number) => calculatedItems.reduce((total, item) => total + selector(item.taxes), 0);

  return {
    items: calculatedItems,
    totals: {
      quantity: sum((item) => n(item.quantity)),
      fobUsd: sum((item) => item.fobUsd),
      fobBrl: sum((item) => item.fobBrl),
      freightUsd: sum((item) => item.freightUsd),
      insuranceUsd: sum((item) => item.insuranceUsd),
      valorAduaneiro: sum((item) => item.valorAduaneiro),
      ii: taxes((tax) => tax.ii.payable),
      ipi: taxes((tax) => tax.ipi.payable),
      pisImport: taxes((tax) => tax.pisImport.payable),
      cofinsImport: taxes((tax) => tax.cofinsImport.payable),
      icms: taxes((tax) => tax.icms.payable),
      totalTributos: taxes((tax) => tax.totalTributos),
      otherBrl,
      totalDesembolso: sum((item) => item.valorAduaneiro) + taxes((tax) => tax.totalTributos) + otherBrl,
    },
    warnings,
  };
}
