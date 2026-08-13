import { allocateImportCost, CostAllocationInput, CostAllocationMethod } from "./import-cost-allocation";

export type ImportItemCost = CostAllocationInput & {
  directCosts?: number;
};

export type ItemCostResult = {
  itemId: string;
  allocatedSharedCost: number;
  directCosts: number;
  totalAllocatedCost: number;
};

export function buildItemCostBreakdown(
  sharedCost: number,
  items: ImportItemCost[],
  method: CostAllocationMethod,
): ItemCostResult[] {
  const allocated = allocateImportCost(sharedCost, items, method);
  return allocated.map((row, index) => ({
    itemId: row.itemId,
    allocatedSharedCost: row.allocatedCost,
    directCosts: items[index].directCosts ?? 0,
    totalAllocatedCost: row.allocatedCost + (items[index].directCosts ?? 0),
  }));
}

export function validateItemCostBreakdown(
  result: ItemCostResult[],
  sharedCost: number,
  items: ImportItemCost[],
): boolean {
  const shared = result.reduce((sum, row) => sum + row.allocatedSharedCost, 0);
  const directExpected = items.reduce((sum, item) => sum + (item.directCosts ?? 0), 0);
  const directActual = result.reduce((sum, row) => sum + row.directCosts, 0);
  return Math.abs(shared - sharedCost) < 0.01 && Math.abs(directActual - directExpected) < 0.01;
}
