import { FEDERAL_SOURCE_BASELINE_2026 } from "./federal-source-freshness-gate-2026.ts";
import { FEDERAL_TARIFF_OFFICIAL_PAGE, FEDERAL_TARIFF_SOURCE_MANIFEST_VERSION } from "./federal-tariff-source-manifest-2026.ts";

const repository = "diegoruckhaber-cmd/importafacil";
const RFB_TIPI_OFFICIAL_PAGE = "https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/legislacao/documentos-e-arquivos/tipi.xlsx/view";
const RFB_TIPI_SOURCE_VERSION = FEDERAL_SOURCE_BASELINE_2026.RFB_TIPI.officialPageUpdatedAt;

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

export function mdicReconciliationStatus(audits: Array<{ id: string; status: string }>) {
  return audits.find((audit) => audit.id === "mdic")?.status === "passed" ? "current" : "pending";
}

export function newestFederalWorkbook(html: string) {
  const dates = [...html.matchAll(/(\d{2})-(\d{2})-(\d{4})-anexos-i-a-x-resolucao-gecex-272-21\.xlsx/gi)]
    .map((m) => `${m[3]}-${m[2]}-${m[1]}`).sort();
  return dates.at(-1) || null;
}

export function newestTipiUpdate(html: string) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ");
  const dates = [...text.matchAll(/(?:Atualizado em|última modificação)\s*(\d{2})\/(\d{2})\/(\d{4})/gi)]
    .map((m) => `${m[3]}-${m[2]}-${m[1]}`).sort();
  return dates.at(-1) || null;
}

async function fetchText(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
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

  const [federalHtml, tipiHtml] = await Promise.all([
    fetchText(FEDERAL_TARIFF_OFFICIAL_PAGE),
    fetchText(RFB_TIPI_OFFICIAL_PAGE),
  ]);

  const latestWorkbook = federalHtml ? newestFederalWorkbook(federalHtml) : null;
  const latestTipiUpdate = tipiHtml ? newestTipiUpdate(tipiHtml) : null;
  const sourceStatus = latestWorkbook === FEDERAL_TARIFF_SOURCE_MANIFEST_VERSION ? "current" : latestWorkbook ? "review_required" : "unknown";
  const tipiStatus = latestTipiUpdate === RFB_TIPI_SOURCE_VERSION ? "current" : latestTipiUpdate ? "review_required" : "unknown";

  const blockers = auditResults.filter((a) => a.status !== "passed").map((a) => `audit_${a.id}_${a.status}`);
  if (sourceStatus !== "current") blockers.push(`federal_source_${sourceStatus}`);
  if (tipiStatus !== "current") blockers.push(`tipi_source_${tipiStatus}`);

  const mdicStatus = mdicReconciliationStatus(auditResults);

  return {
    checkedAt: new Date().toISOString(), status: blockers.length ? "blocked" as const : "ready" as const,
    blockers, audits: auditResults,
    federalSource: { status: sourceStatus, publishedVersion: FEDERAL_TARIFF_SOURCE_MANIFEST_VERSION, latestWorkbook, url: FEDERAL_TARIFF_OFFICIAL_PAGE },
    tipiSource: { status: tipiStatus, publishedVersion: RFB_TIPI_SOURCE_VERSION, latestUpdate: latestTipiUpdate, url: RFB_TIPI_OFFICIAL_PAGE },
    mdicReconciliation: {
      status: mdicStatus,
      evidence: mdicStatus === "current"
        ? "latest successful main-branch MDIC audit"
        : "latest main-branch MDIC audit must pass",
    },
  };
}
