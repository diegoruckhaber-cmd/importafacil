import { getLaunchReadiness } from "./launch-readiness.ts";
import { getReleaseScope } from "./release-scope.ts";
import { evaluateStateActivation } from "./state-activation-guard.ts";

export const RELEASE_CANDIDATE_CONTRACT = "importafacil-release-candidate-v1" as const;

export function getReleaseCandidateStatus() {
  const readiness = getLaunchReadiness();
  const release = getReleaseScope();
  const activation = evaluateStateActivation();

  const checks = {
    launchMatrixVerified:
      readiness.summary.totalItems === readiness.summary.verified &&
      readiness.summary.inProgress === 0 &&
      readiness.summary.pending === 0,
    noP0Blockers: readiness.summary.p0BlockingIds.length === 0,
    stateActivationSafe: activation.status === "safe",
    nationalStateCoverage: activation.activeUfs.length === 27,
    controlledBetaPreserved: release.controlledBeta.status === "released_with_restrictions",
    unrestrictedReleaseStillManual:
      release.unrestrictedCommercial.status === "eligible_for_release_review",
  };

  const technicalReady = Object.values(checks).every(Boolean);

  return {
    contract: RELEASE_CANDIDATE_CONTRACT,
    candidate: "RC-2026-09-18",
    technicalStatus: technicalReady ? "ready_for_production_validation" as const : "blocked" as const,
    checks,
    activeUfCount: activation.activeUfs.length,
    activeUfs: activation.activeUfs,
    p0BlockingIds: readiness.summary.p0BlockingIds,
    controlledBetaStatus: release.controlledBeta.status,
    unrestrictedCommercialStatus: release.unrestrictedCommercial.status,
    manualCommercialAuthorizationRequired: true,
    releaseScopeChangedByThisCandidate: false,
  };
}
