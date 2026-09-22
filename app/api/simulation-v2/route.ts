import { NextResponse } from "next/server";
import { type SimulationV2Input } from "../../../lib/simulation-v2";
import { executeOfficialSimulationV2 } from "../../../lib/server-simulation-v2";
import { buildSimulationV2Telemetry, emitSimulationV2Telemetry } from "../../../lib/simulation-v2-observability";

export async function POST(request: Request) {
  const startedAtMs = Date.now();
  let body: SimulationV2Input | undefined;
  try {
    body = await request.json() as SimulationV2Input;
    const result = executeOfficialSimulationV2(body);
    emitSimulationV2Telemetry(buildSimulationV2Telemetry({ result, input: body, startedAtMs }));
    return NextResponse.json(
      result,
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    emitSimulationV2Telemetry(buildSimulationV2Telemetry({ input: body, startedAtMs, error }));
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
