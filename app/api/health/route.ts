import { NextResponse } from "next/server";
import { evaluateStateActivation } from "../../../lib/state-activation-guard";

export async function GET() {
  const stateActivation = evaluateStateActivation();
  const activeStateScope = stateActivation.status === "safe" ? stateActivation.activeUfs : [];

  return NextResponse.json({
    ok: stateActivation.status === "safe",
    service: "importafacil",
    apiContract: "importafacil-simulation-v2",
    simulationEngine: "unified-multi-item-v1",
    federalEngine: "authoritative-federal-v2",
    federalSnapshot: "official-snapshot-2026-09-08",
    stateScope: activeStateScope.length === 27 ? "national_27_uf" : "restricted",
    activeStateCount: activeStateScope.length,
    activeStateScope,
    stateActivationStatus: stateActivation.status,
    deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown"
  }, { headers: { "Cache-Control": "no-store" } });
}
