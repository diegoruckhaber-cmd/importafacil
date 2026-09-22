import { normalizeSCRequest } from "../../../lib/sc-request";
import { NextResponse } from "next/server";
import { calculateUnifiedImportSimulation, type UnifiedImportExpenseInput, type UnifiedImportItemInput, type UnifiedImportSimulationInput } from "../../../lib/unified-import-simulation";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const result = calculateUnifiedImportSimulation(normalizeSCRequest(body));
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível calcular a operação." }, { status: 400 });
  }
}
