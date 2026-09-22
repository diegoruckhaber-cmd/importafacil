import { getOperationalReadiness } from "../../../lib/operational-readiness";
import { NextResponse } from "next/server";
import { getControlledBetaAcceptance } from "../../../lib/controlled-beta-acceptance";

export const dynamic = "force-dynamic";

export async function GET() {
  const acceptance = getControlledBetaAcceptance();
  const operations = await getOperationalReadiness();
  const result = { ...acceptance, operations,
    checks: { ...acceptance.checks, operationalEvidenceCurrent: operations.status === "ready", noP0Blockers: acceptance.checks.noP0Blockers && operations.status === "ready" },
    status: operations.status === "ready" ? acceptance.status : "blocked",
    controlledBetaStatus: operations.status === "ready" ? acceptance.controlledBetaStatus : "blocked",
    unrestrictedCommercialStatus: operations.status === "ready" ? acceptance.unrestrictedCommercialStatus : "blocked_by_operations",
  };
  return NextResponse.json(result, {
    status: result.status === "ready_for_controlled_beta" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
