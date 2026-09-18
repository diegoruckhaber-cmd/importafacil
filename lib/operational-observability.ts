export const OPERATIONAL_OBSERVABILITY_CONTRACT = "importafacil-operational-observability-v1" as const;

export type OperationalEvent = {
  event:
    | "billing.checkout"
    | "billing.portal"
    | "billing.webhook"
    | "simulation.snapshot"
    | "beta.feedback";
  outcome: "success" | "rejected" | "failed" | "ignored" | "duplicate";
  durationMs: number;
  reasonCode?: string;
  mode?: string;
  eventType?: string;
  deploymentSha?: string;
};

const SAFE_TOKEN = /^[a-zA-Z0-9_.:-]{1,80}$/;

function safeToken(value: unknown) {
  const token = String(value ?? "").trim();
  return token && SAFE_TOKEN.test(token) ? token : undefined;
}

export function buildOperationalEvent(input: Omit<OperationalEvent, "durationMs" | "deploymentSha"> & { startedAtMs: number }): OperationalEvent {
  return {
    event: input.event,
    outcome: input.outcome,
    durationMs: Math.max(0, Date.now() - input.startedAtMs),
    reasonCode: safeToken(input.reasonCode),
    mode: safeToken(input.mode),
    eventType: safeToken(input.eventType),
    deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA || undefined,
  };
}

export function emitOperationalEvent(event: OperationalEvent) {
  const serialized = JSON.stringify({
    source: "importafacil",
    contract: OPERATIONAL_OBSERVABILITY_CONTRACT,
    ...event,
  });
  if (event.outcome === "failed") console.error(serialized);
  else if (event.outcome === "rejected") console.warn(serialized);
  else console.info(serialized);
}
