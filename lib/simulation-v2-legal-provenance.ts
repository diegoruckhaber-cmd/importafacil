export type SimulationLegalTraceEntry = {
  itemId: string;
  area: "federal" | "defense_commercial" | "state";
  treatment: string;
  status: string;
  legalFoundation?: string;
  source?: string;
  sourceUrl?: string;
  validFrom?: string;
  validUntil?: string;
  reason?: string;
};

function compact(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function federalValidity(component: any) {
  const candidates = Array.isArray(component?.candidates) ? component.candidates : [];
  const starts = compact(candidates.map((candidate: any) => candidate?.validFrom));
  const ends = compact(candidates.map((candidate: any) => candidate?.validTo));
  return {
    validFrom: starts.length === 1 ? starts[0] : undefined,
    validUntil: ends.length === 1 ? ends[0] : undefined,
  };
}

export function buildSimulationV2LegalTrace(result: any): SimulationLegalTraceEntry[] {
  const entries: SimulationLegalTraceEntry[] = [];
  for (const item of Array.isArray(result?.items) ? result.items : []) {
    const itemId = String(item?.itemId ?? "ITEM");
    for (const [label, component] of [["II", item?.federal?.ii], ["IPI", item?.federal?.ipi]] as const) {
      if (!component) continue;
      const validity = federalValidity(component);
      entries.push({
        itemId,
        area: "federal",
        treatment: label,
        status: String(component.status ?? "unknown"),
        legalFoundation: component.legalBasis || undefined,
        source: component.source || undefined,
        sourceUrl: component.sourceUrl || undefined,
        ...validity,
        reason: compact(component.warnings ?? []).join(" ") || undefined,
      });
    }

    const defense = item?.federal?.defenseCommercial;
    if (defense && defense.status !== "not_applicable") {
      entries.push({
        itemId,
        area: "defense_commercial",
        treatment: defense.measure === "countervailing" ? "Medida compensatória" : "Medida antidumping",
        status: String(defense.status ?? "unknown"),
        legalFoundation: defense.legalFoundation || undefined,
        source: defense.source || undefined,
        sourceUrl: defense.sourceUrl || undefined,
        validUntil: defense.validUntil || undefined,
        reason: compact([defense.scopeCondition, ...(defense.warnings ?? [])]).join(" ") || undefined,
      });
    }

    const sc = item?.sc;
    const hasSpecialStateTreatment = sc && (String(sc.ttd ?? "none") !== "none" || (sc.specialRegimeIds?.length ?? 0) > 0 || (sc.blockingIssues?.length ?? 0) > 0);
    if (hasSpecialStateTreatment) {
      entries.push({
        itemId,
        area: "state",
        treatment: String(sc.ttd ?? "Regime especial SC"),
        status: String(sc.decision ?? sc.benefitDecision ?? "unknown"),
        legalFoundation: compact([...(sc.decisionReasons ?? []), ...(sc.benefitReasons ?? [])]).join(" ") || undefined,
        source: "Motor estadual SC homologado — catálogo jurídico versionado do ImportaFácil",
        reason: compact(sc.blockingIssues ?? []).join(" ") || undefined,
      });
    }
  }
  return entries;
}

export function formatSimulationV2LegalTrace(entry: SimulationLegalTraceEntry) {
  const validity = entry.validFrom || entry.validUntil
    ? ` Vigência${entry.validFrom ? ` desde ${entry.validFrom}` : ""}${entry.validUntil ? ` até ${entry.validUntil}` : ""}.`
    : "";
  const foundation = entry.legalFoundation ? ` Fundamento: ${entry.legalFoundation}.` : "";
  const source = entry.source ? ` Fonte: ${entry.source}.` : "";
  const url = entry.sourceUrl ? ` ${entry.sourceUrl}` : "";
  const reason = entry.reason ? ` Observação: ${entry.reason}` : "";
  return `${entry.itemId} · ${entry.treatment} · ${entry.status}.${foundation}${validity}${source}${url}${reason}`.replace(/\.\s*\./g, ".");
}
