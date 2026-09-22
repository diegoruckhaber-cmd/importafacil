import { getOperationalReadiness } from "../../../lib/operational-readiness";
import { NextResponse } from "next/server";
import { getLaunchReadiness } from "../../../lib/launch-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = getLaunchReadiness();
  const operations = await getOperationalReadiness();
  return NextResponse.json({ ...readiness, operations, summary: { ...readiness.summary, p0BlockingIds: [...readiness.summary.p0BlockingIds, ...operations.blockers] }, release: {
    ...readiness.release,
    controlledBeta: operations.status === "ready" ? readiness.release.controlledBeta : "blocked",
    unrestrictedCommercial: operations.status === "ready" ? readiness.release.unrestrictedCommercial : "blocked_by_operations",
  } }, {
    status: operations.status === "ready" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
