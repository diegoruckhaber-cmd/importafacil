import { runImportSimulationV2, type SimulationV2Input } from "./simulation-v2.ts";
import { buildSimulationV2LegalTrace, formatSimulationV2LegalTrace } from "./simulation-v2-legal-provenance.ts";

export function executeOfficialSimulationV2(body: SimulationV2Input) {
    const result = runImportSimulationV2(body);
    const legalTrace = buildSimulationV2LegalTrace(result);
    const attentionPoints = [
      ...(Array.isArray(result.attentionPoints) ? result.attentionPoints : []),
      ...legalTrace.map(formatSimulationV2LegalTrace),
    ];
    return { ...result, legalTrace, attentionPoints: [...new Set(attentionPoints)] };
}
