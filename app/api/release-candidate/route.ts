import { NextResponse } from "next/server";
import { getReleaseCandidateStatus } from "../../../lib/release-candidate";

export const dynamic = "force-dynamic";

export async function GET() {
  const candidate = getReleaseCandidateStatus();
  return NextResponse.json(candidate, {
    status: candidate.technicalStatus === "ready_for_production_validation" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
