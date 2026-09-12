import { NextResponse } from "next/server";
import { getStateHomologationPreflightContract } from "../../../../lib/state-homologation-package";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getStateHomologationPreflightContract(), {
    headers: { "Cache-Control": "no-store" },
  });
}
