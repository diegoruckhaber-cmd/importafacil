import { NextResponse } from "next/server";
import { getRuleHistory } from "../../../lib/rule-history";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getRuleHistory(), {
    headers: { "Cache-Control": "no-store" },
  });
}
