import { getOperationalReadiness } from "../../../lib/operational-readiness";
import { NextResponse } from "next/server";
import { getReleaseCandidateStatus } from "../../../lib/release-candidate";

export const dynamic = "force-dynamic";

export async function GET() {
  const candidate = getReleaseCandidateStatus();
  const operations = await getOperationalReadiness();
  const result = { ...candidate, operations,
    checks: { ...candidate.checks, operationalEvidenceCurrent: operations.status === "ready", noP0Blockers: candidate.checks.noP0Blockers && operations.status === "ready" },
    p0BlockingIds: [...candidate.p0BlockingIds, ...operations.blockers],
    technicalStatus: operations.status === "ready" ? candidate.technicalStatus : "blocked",
    controlledBetaStatus: operations.status === "ready" ? candidate.controlledBetaStatus : "blocked",
    unrestrictedCommercialStatus: operations.status === "ready" ? candidate.unrestrictedCommercialStatus : "blocked_by_operations",
  };
  return NextResponse.json(result, {
    status: result.technicalStatus === "ready_for_production_validation" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
