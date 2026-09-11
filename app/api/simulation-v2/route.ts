import { NextResponse } from "next/server";
import { runImportSimulationV2, type SimulationV2Input } from "../../../lib/simulation-v2";
import { buildSimulationV2LegalTrace, formatSimulationV2LegalTrace } from "../../../lib/simulation-v2-legal-provenance";
import { buildSimulationV2Telemetry, emitSimulationV2Telemetry } from "../../../lib/simulation-v2-observability";

export async function POST(request: Request) {
  const startedAtMs = Date.now();
  let body: SimulationV2Input | undefined;
  try {
    body = await request.json() as SimulationV2Input;
    const result = runImportSimulationV2(body);
    const legalTrace = buildSimulationV2LegalTrace(result);
    const attentionPoints = [
      ...(Array.isArray(result.attentionPoints) ? result.attentionPoints : []),
      ...legalTrace.map(formatSimulationV2LegalTrace),
    ];
    emitSimulationV2Telemetry(buildSimulationV2Telemetry({ result, input: body, startedAtMs }));
    return NextResponse.json(
      { ...result, legalTrace, attentionPoints: [...new Set(attentionPoints)] },
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
