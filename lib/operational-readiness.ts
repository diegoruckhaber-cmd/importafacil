import { FEDERAL_TARIFF_OFFICIAL_PAGE, FEDERAL_TARIFF_SOURCE_MANIFEST_VERSION } from "./federal-tariff-source-manifest-2026.ts";

const repository = "diegoruckhaber-cmd/importafacil";
const audits = [
  { id: "mdic", workflow: "sync-mdic-defesa-comercial.yml", maxAgeHours: 48 },
  { id: "federal", workflow: "audit-official-federal-sources.yml", maxAgeHours: 192 },
] as const;

export function assessAuditRun(run: any, maxAgeHours: number, now = Date.now()) {
  const checkedAt = Date.parse(run?.updated_at || "");
  if (!Number.isFinite(checkedAt) || checkedAt > now + 60_000) return "unknown";
  if (run.status !== "completed") return "pending";
  if (run.conclusion !== "success") return "failed";
  return now - checkedAt > maxAgeHours * 3_600_000 ? "stale" : "passed";
}

export function newestFederalWorkbook(html: string) {
  const dates = [...html.matchAll(/(\d{2})-(\d{2})-(\d{4})-anexos-i-a-x-resolucao-gecex-272-21\.xlsx/gi)]
    .map((m) => `${m[3]}-${m[2]}-${m[1]}`).sort();
  return dates.at(-1) || null;
}

export async function getOperationalReadiness() {
  const auditResults = await Promise.all(audits.map(async (audit) => {
    try {
      const response = await fetch(`https://api.github.com/repos/${repository}/actions/workflows/${audit.workflow}/runs?branch=main&per_page=1`, {
        headers: { Accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(8000), cache: "no-store",
      });
      if (!response.ok) throw new Error("Audit unavailable");
      const run = (await response.json()).workflow_runs?.[0];
      return { id: audit.id, status: assessAuditRun(run, audit.maxAgeHours), maxAgeHours: audit.maxAgeHours,
        runId: run?.id ?? null, checkedAt: run?.updated_at ?? null, conclusion: run?.conclusion ?? null,
        url: run?.html_url ?? null, commit: run?.head_sha ?? null };
    } catch {
      return { id: audit.id, status: "unknown", maxAgeHours: audit.maxAgeHours, runId: null, checkedAt: null, conclusion: null, url: null, commit: null };
    }
  }));
  let latestWorkbook: string | null = null;
  try {
    const response = await fetch(FEDERAL_TARIFF_OFFICIAL_PAGE, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (response.ok) latestWorkbook = newestFederalWorkbook(await response.text());
  } catch { /* Missing evidence must not turn green. */ }
  const sourceStatus = latestWorkbook === FEDERAL_TARIFF_SOURCE_MANIFEST_VERSION ? "current" : latestWorkbook ? "review_required" : "unknown";
  const blockers = auditResults.filter((a) => a.status !== "passed").map((a) => `audit_${a.id}_${a.status}`);
  if (sourceStatus !== "current") blockers.push(`federal_source_${sourceStatus}`);
  // A successful collection alone does not reconcile pending legal conditions
  // or authorize publication of the candidate. Remove only with reviewed evidence.
  blockers.push("mdic_legal_reconciliation_pending");
  return {
    checkedAt: new Date().toISOString(), status: blockers.length ? "blocked" as const : "ready" as const,
    blockers, audits: auditResults,
    federalSource: { status: sourceStatus, publishedVersion: FEDERAL_TARIFF_SOURCE_MANIFEST_VERSION, latestWorkbook, url: FEDERAL_TARIFF_OFFICIAL_PAGE },
    mdicReconciliation: { status: "pending", evidence: "docs/stage67-operational-integrity.md" },
  };
}
