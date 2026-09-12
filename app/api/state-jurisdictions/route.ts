import { NextResponse } from "next/server";
import { getStateJurisdictionRegistry } from "../../../lib/state-jurisdiction-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getStateJurisdictionRegistry(), {
    headers: { "Cache-Control": "no-store" },
  });
}
