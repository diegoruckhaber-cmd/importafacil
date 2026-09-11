export type SavedSimulationRecord = {
  id: string;
  name: string | null;
  input: Record<string, any>;
  result: Record<string, any>;
  created_at: string;
};

export type SavedSimulationKind = "v2" | "sc" | "legacy";

export function savedSimulationKind(record: Pick<SavedSimulationRecord, "input" | "result">): SavedSimulationKind {
  if (record.result?.contract === "importafacil-simulation-v2") return "v2";
  if (record.result?.engine === "unified-multi-item-v1" && record.result?.summary) return "v2";
  if (Array.isArray(record.input?.items) && record.result?.totalLandedCostAfterBenefit != null) return "sc";
  return "legacy";
}

export function savedSimulationStatus(record: Pick<SavedSimulationRecord, "result">) {
  return String(record.result?.status ?? record.result?.calculation?.status ?? "calculated");
}

export function savedSimulationTotal(record: Pick<SavedSimulationRecord, "result">) {
  const result = record.result ?? {};
  if (result.summary?.landedCostBrl != null) return Number(result.summary.landedCostBrl);
  if (result.totalLandedCostAfterBenefit != null) return Number(result.totalLandedCostAfterBenefit);
  return Number(result.total ?? 0);
}

export function savedSimulationUnitCost(record: Pick<SavedSimulationRecord, "input" | "result">) {
  const result = record.result ?? {};
  if (result.contract === "importafacil-simulation-v2" || result.summary) {
    const items = Array.isArray(result.items) ? result.items : [];
    const totalQty = items.reduce((sum: number, item: any) => sum + Number(item.quantity ?? 0), 0);
    return totalQty > 0 ? savedSimulationTotal(record) / totalQty : savedSimulationTotal(record);
  }
  return Number(result.unit ?? 0);
}

export function savedSimulationTargetRevenue(record: Pick<SavedSimulationRecord, "result">) {
  return Number(record.result?.summary?.targetRevenueBrl ?? record.result?.sale ?? 0);
}

export function savedSimulationProfit(record: Pick<SavedSimulationRecord, "result">) {
  return Number(record.result?.summary?.estimatedProfitBrl ?? record.result?.profit ?? 0);
}

export function savedSimulationComparable(record: Pick<SavedSimulationRecord, "result">) {
  return record.result?.contract === "importafacil-simulation-v2" && record.result?.summary != null;
}

export function compareSavedSimulationV2(records: SavedSimulationRecord[]) {
  const eligible = records.filter(savedSimulationComparable);
  if (eligible.length < 2) throw new Error("Selecione pelo menos duas simulações V2 calculadas para comparar.");
  return eligible.map((record) => ({
    id: record.id,
    name: record.name || record.input?.scenarioName || "Simulação V2",
    createdAt: record.created_at,
    status: savedSimulationStatus(record),
    itemCount: Array.isArray(record.result?.items) ? record.result.items.length : 0,
    merchandiseBrl: Number(record.result?.summary?.merchandiseBrl ?? 0),
    customsValueBrl: Number(record.result?.summary?.customsValueBrl ?? 0),
    importTaxesBrl: Number(record.result?.summary?.importTaxesBrl ?? 0),
    defenseCommercialBrl: Number(record.result?.summary?.defenseCommercialBrl ?? 0),
    icmsImportSavingsBrl: Number(record.result?.summary?.icmsImportSavingsBrl ?? 0),
    landedCostBrl: savedSimulationTotal(record),
    targetRevenueBrl: savedSimulationTargetRevenue(record),
    estimatedProfitBrl: savedSimulationProfit(record),
  })).sort((a, b) => a.landedCostBrl - b.landedCostBrl);
}
