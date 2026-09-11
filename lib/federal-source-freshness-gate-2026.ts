export type FederalSourceSnapshot = {
  source: "MDIC_TARIFF" | "RFB_TIPI";
  sourceUpdatedAt: string;
  checkedAt: string;
};

/**
 * Publication metadata verified against the official source pages on 2026-09-10.
 * The gate intentionally does not infer tariff values; it only prevents a
 * future catalog refresh from silently using a stale official snapshot.
 */
export const FEDERAL_SOURCE_BASELINE_2026 = {
  MDIC_TARIFF: {
    officialPageUpdatedAt: "2026-09-08",
    latestPublishedGecexKnown: "Consolidado Anexos I a X publicado em 08/09/2026",
  },
  RFB_TIPI: {
    officialPageUpdatedAt: "2026-02-13",
    workbook: "TIPI 2022 - Atualizada ADE RFB 001/2026",
  },
} as const;

function day(value: string): number {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) throw new Error(`Invalid source date: ${value}`);
  return parsed;
}

export function isSnapshotAtLeastAsFresh(snapshot: FederalSourceSnapshot): boolean {
  const baseline = FEDERAL_SOURCE_BASELINE_2026[snapshot.source].officialPageUpdatedAt;
  return day(snapshot.sourceUpdatedAt) >= day(baseline);
}

export function assertFreshFederalSnapshot(snapshot: FederalSourceSnapshot): void {
  if (!isSnapshotAtLeastAsFresh(snapshot)) {
    const baseline = FEDERAL_SOURCE_BASELINE_2026[snapshot.source].officialPageUpdatedAt;
    throw new Error(`${snapshot.source} snapshot ${snapshot.sourceUpdatedAt} is stale; official baseline is ${baseline}.`);
  }
}
