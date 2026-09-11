import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "importafacil",
    apiContract: "importafacil-simulation-v2",
    simulationEngine: "unified-multi-item-v1",
    federalEngine: "authoritative-federal-v2",
    federalSnapshot: "official-snapshot-2026-09-08",
    stateScope: "SC",
    deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown"
  }, { headers: { "Cache-Control": "no-store" } });
}
