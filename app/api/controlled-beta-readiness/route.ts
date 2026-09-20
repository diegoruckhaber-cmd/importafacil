import { NextResponse } from "next/server";
import { getControlledBetaAcceptance } from "../../../lib/controlled-beta-acceptance";

export const dynamic = "force-dynamic";

export async function GET() {
  const acceptance = getControlledBetaAcceptance();
  return NextResponse.json(acceptance, {
    status: acceptance.status === "ready_for_controlled_beta" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
