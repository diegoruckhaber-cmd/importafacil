export type SimulationV2Telemetry = {
  event: "simulation_v2.completed" | "simulation_v2.failed";
  contract: "importafacil-simulation-v2";
  status: string;
  durationMs: number;
  itemCount: number;
  destinationUf?: string;
  issueCodes: string[];
  engine?: string;
  federalEngine?: string;
  deploymentSha?: string;
};

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

export function buildSimulationV2Telemetry(args: {
  result?: any;
  input?: any;
  startedAtMs: number;
  error?: unknown;
}): SimulationV2Telemetry {
  const result = args.result;
  const input = args.input;
  const failed = Boolean(args.error);
  const issueCodes = failed
    ? ["unhandled_simulation_error"]
    : unique((Array.isArray(result?.issues) ? result.issues : []).map((issue: any) => issue?.code));

  return {
    event: failed ? "simulation_v2.failed" : "simulation_v2.completed",
    contract: "importafacil-simulation-v2",
    status: failed ? "error" : String(result?.status ?? "unknown"),
    durationMs: Math.max(0, Date.now() - args.startedAtMs),
    itemCount: Array.isArray(input?.items) ? input.items.length : 0,
    destinationUf: input?.destinationUf ? String(input.destinationUf).toUpperCase() : undefined,
    issueCodes,
    engine: result?.engine ? String(result.engine) : undefined,
    federalEngine: result?.federalEngine ? String(result.federalEngine) : undefined,
    deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA || undefined,
  };
}

export function emitSimulationV2Telemetry(payload: SimulationV2Telemetry) {
  // Structured server log only. Do not add NCM, item description, exporter,
  // monetary values, user identifiers or raw exception messages here.
  const serialized = JSON.stringify({ source: "importafacil", ...payload });
  if (payload.event === "simulation_v2.failed" || ["blocked", "unsupported"].includes(payload.status)) {
    console.error(serialized);
  } else if (["requires_input", "alert"].includes(payload.status)) {
    console.warn(serialized);
  } else {
    console.info(serialized);
  }
}
