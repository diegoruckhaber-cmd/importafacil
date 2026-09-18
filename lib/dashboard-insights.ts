import {
  savedSimulationKind,
  savedSimulationStatus,
  savedSimulationTotal,
  type SavedSimulationRecord,
} from "./simulation-record.ts";

export type DashboardStatusFilter =
  | "all"
  | "calculated"
  | "alert"
  | "requires_input"
  | "blocked"
  | "unsupported";

export function buildDashboardInsights(records: SavedSimulationRecord[]) {
  const v2 = records.filter((record) => savedSimulationKind(record) === "v2");
  const statuses = v2.reduce<Record<string, number>>((acc, record) => {
    const status = savedSimulationStatus(record);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const latest = records[0] || null;
  const latestV2 = v2[0] || null;

  return {
    totalSaved: records.length,
    v2Count: v2.length,
    attentionCount:
      (statuses.alert || 0) +
      (statuses.requires_input || 0) +
      (statuses.blocked || 0) +
      (statuses.unsupported || 0),
    calculatedCount: statuses.calculated || 0,
    latestId: latest?.id || null,
    latestCostBrl: latest ? savedSimulationTotal(latest) : 0,
    latestV2Id: latestV2?.id || null,
    statuses,
  };
}

export function filterDashboardRecords(
  records: SavedSimulationRecord[],
  input: { query?: string; status?: DashboardStatusFilter },
) {
  const query = String(input.query || "").trim().toLocaleLowerCase("pt-BR");
  const status = input.status || "all";

  return records.filter((record) => {
    if (status !== "all") {
      if (savedSimulationKind(record) !== "v2") return false;
      if (savedSimulationStatus(record) !== status) return false;
    }
    if (!query) return true;
    const haystack = [
      record.name,
      record.input?.scenarioName,
      record.input?.destinationUf,
      record.result?.operation?.destinationUf,
    ]
      .map((value) => String(value || "").toLocaleLowerCase("pt-BR"))
      .join(" ");
    return haystack.includes(query);
  });
}
