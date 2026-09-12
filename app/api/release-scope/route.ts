import { NextResponse } from "next/server";
import { getReleaseScope } from "../../../lib/release-scope";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getReleaseScope(), {
    headers: { "Cache-Control": "no-store" },
  });
}
