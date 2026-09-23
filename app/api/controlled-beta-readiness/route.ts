import { getOperationalReadiness } from "../../../lib/operational-readiness";
import { NextResponse } from "next/server";
import { getControlledBetaAcceptance } from "../../../lib/controlled-beta-acceptance";
import { getHumanValidationReadiness } from "../../../lib/human-validation-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const acceptance = getControlledBetaAcceptance();
  const [operations, humanValidation] = await Promise.all([getOperationalReadiness(), getHumanValidationReadiness()]);
  const humanGate = humanValidation.status === "complete"
    ? acceptance.unrestrictedCommercialStatus
    : humanValidation.status === "unavailable"
      ? "blocked_by_human_evidence_unavailable"
      : "blocked_pending_human_validation";
  const result = { ...acceptance, operations, humanValidation,
    checks: { ...acceptance.checks, operationalEvidenceCurrent: operations.status === "ready", noP0Blockers: acceptance.checks.noP0Blockers && operations.status === "ready" },
    status: operations.status === "ready" ? acceptance.status : "blocked",
    controlledBetaStatus: operations.status === "ready" ? acceptance.controlledBetaStatus : "blocked",
    unrestrictedCommercialStatus: operations.status === "ready" ? humanGate : "blocked_by_operations",
  };
  return NextResponse.json(result, {
    status: result.status === "ready_for_controlled_beta" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
