import { NextResponse } from "next/server";
import { runImportSimulationV2, type SimulationV2Input } from "../../../lib/simulation-v2";

export async function POST(request: Request) {
  try {
    const body = await request.json() as SimulationV2Input;
    const result = runImportSimulationV2(body);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      {
        contract: "importafacil-simulation-v2",
        status: "blocked",
        error: error instanceof Error ? error.message : "Não foi possível processar a Simulation V2.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
