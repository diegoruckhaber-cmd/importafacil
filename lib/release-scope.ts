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
      label: "Beta controlado — escopo estadual homologado: SC",
      notice: "O cálculo estadual automático está homologado apenas para Santa Catarina. Outras UFs permanecem bloqueadas até homologação jurídica, regressões e ativação próprias.",
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
