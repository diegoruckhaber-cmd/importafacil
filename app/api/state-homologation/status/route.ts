import { NextResponse } from "next/server";
import { assertStateActivationSafe } from "../../../../lib/state-activation-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(assertStateActivationSafe(), {
    headers: { "Cache-Control": "no-store" },
  });
}
