import { NextResponse } from "next/server";
import { getLaunchReadiness } from "../../../lib/launch-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getLaunchReadiness(), {
    headers: { "Cache-Control": "no-store" },
  });
}
