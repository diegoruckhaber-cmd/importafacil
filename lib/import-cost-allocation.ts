export type CostAllocationMethod = "item_value" | "quantity" | "weight" | "volume" | "manual";

export type CostAllocationInput = {
  itemId: string;
  customsValue: number;
  quantity?: number;
  weightKg?: number;
  volumeM3?: number;
  manualShare?: number;
};

export type AllocatedItemCost = {
  itemId: string;
  share: number;
  allocatedCost: number;
};

export function allocateImportCost(
  totalCost: number,
  items: CostAllocationInput[],
  method: CostAllocationMethod,
): AllocatedItemCost[] {
  if (!Number.isFinite(totalCost) || totalCost < 0) throw new Error("totalCost inválido");
  if (!items.length) throw new Error("A operação precisa ter pelo menos um item");

  const metric = (item: CostAllocationInput): number => {
    if (method === "item_value") return item.customsValue;
    if (method === "quantity") return item.quantity ?? 0;
    if (method === "weight") return item.weightKg ?? 0;
    if (method === "volume") return item.volumeM3 ?? 0;
    return item.manualShare ?? 0;
  };

  const metrics = items.map(metric);
  const totalMetric = metrics.reduce((sum, value) => sum + value, 0);
  if (totalMetric <= 0) throw new Error("Não foi possível determinar uma base positiva para o rateio");

  return items.map((item, index) => {
    const share = metrics[index] / totalMetric;
    return {
      itemId: item.itemId,
      share,
      allocatedCost: totalCost * share,
    };
  });
}

export function validateAllocation(result: AllocatedItemCost[], totalCost: number): boolean {
  const allocated = result.reduce((sum, item) => sum + item.allocatedCost, 0);
  return Math.abs(allocated - totalCost) < 0.01;
}
