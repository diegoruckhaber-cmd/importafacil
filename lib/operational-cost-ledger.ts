export type CostSource = "user" | "table" | "estimate" | "document";
export type AllocationMethod = "none" | "fob" | "weight" | "quantity" | "volume" | "customs-value" | "manual";

export type OperationalCost = {
  id: string;
  category:
    | "port"
    | "terminal"
    | "shipping-agent"
    | "customs-broker"
    | "storage"
    | "inland-freight"
    | "inspection"
    | "documentation"
    | "banking"
    | "other";
  description: string;
  amount: number;
  currency: "BRL" | "USD" | "EUR" | "OTHER";
  source: CostSource;
  allocation: AllocationMethod;
  taxBaseTreatment: "not-tax-base-by-default" | "candidate" | "confirmed-in-base";
  confirmed: boolean;
  itemId?: string;
};

export type AllocatedCost = OperationalCost & {
  allocatedAmount: number;
};

/**
 * Operational costs are a management-cost layer. They must never be injected
 * into a tax base merely because they increase the economic cost of import.
 * Tax-base treatment is decided separately by the applicable tax rule.
 */
export function allocateOperationalCost(
  cost: OperationalCost,
  items: Array<{ id: string; fob: number; weight: number; quantity: number; volume: number; customsValue: number }>,
): AllocatedCost[] {
  if (cost.allocation === "none" || cost.itemId) {
    return items.map((item) => ({
      ...cost,
      itemId: cost.itemId ?? item.id,
      allocatedAmount: cost.itemId === item.id ? cost.amount : 0,
    }));
  }

  const metric = (item: (typeof items)[number]) => {
    switch (cost.allocation) {
      case "fob": return item.fob;
      case "weight": return item.weight;
      case "quantity": return item.quantity;
      case "volume": return item.volume;
      case "customs-value": return item.customsValue;
      default: return 0;
    }
  };

  const totalMetric = items.reduce((sum, item) => sum + metric(item), 0);
  if (totalMetric <= 0) {
    throw new Error(`Cannot allocate ${cost.description}: allocation denominator is zero.`);
  }

  return items.map((item) => ({
    ...cost,
    itemId: item.id,
    allocatedAmount: cost.amount * (metric(item) / totalMetric),
  }));
}

export function reconcileAllocatedCosts(cost: OperationalCost, allocations: AllocatedCost[], tolerance = 0.01): boolean {
  const total = allocations.reduce((sum, allocation) => sum + allocation.allocatedAmount, 0);
  return Math.abs(total - cost.amount) <= tolerance;
}
