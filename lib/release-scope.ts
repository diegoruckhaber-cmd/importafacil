import { getLaunchReadiness } from "./launch-readiness.ts";
import { evaluateStateActivation } from "./state-activation-guard.ts";

export const RELEASE_SCOPE_CONTRACT = "importafacil-release-scope-v1" as const;

export function getReleaseScope() {
  const readiness = getLaunchReadiness();
  const activation = evaluateStateActivation();
  const p0Clear = readiness.summary.p0BlockingIds.length === 0;
  const activeUfs = activation.activeUfs;
  const nationalCoverage = activeUfs.length === 27;

  return {
    contract: RELEASE_SCOPE_CONTRACT,
    policy: "explicit_scope_fail_closed" as const,
    controlledBeta: {
      status: p0Clear && activation.status === "safe" ? "released_with_restrictions" as const : "blocked" as const,
      activeUfs,
      label: `Beta controlado — escopo estadual homologado: ${activeUfs.join(", ")}`,
      notice: "O cálculo estadual automático está ativo apenas nas UFs listadas. Para UFs com escopo general_rate_only, aplica-se somente a regra geral de ICMS de importação; benefícios, reduções, isenções, ST, regimes especiais e alíquotas específicas permanecem fora do escopo inicial.",
    },
    unrestrictedCommercial: {
      status: p0Clear && activation.status === "safe" && nationalCoverage ? "eligible_for_release_review" as const : "blocked_by_state_scope" as const,
      activeUfs,
      missingUfCount: 27 - activeUfs.length,
      notice: nationalCoverage
        ? "Cobertura estadual nacional homologada; release irrestrito pode seguir para revisão."
        : "Lançamento nacional irrestrito bloqueado enquanto a cobertura estadual homologada não alcançar todas as UFs.",
    },
  };
}
