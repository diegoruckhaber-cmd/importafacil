import { getReleaseCandidateStatus } from "./release-candidate.ts";

export const CONTROLLED_BETA_ACCEPTANCE_CONTRACT = "importafacil-controlled-beta-acceptance-v1" as const;
export const CUSTOMER_SURFACE_CONTRACT = "importafacil-commercial-surface-v1" as const;

export function getControlledBetaAcceptance() {
  const candidate = getReleaseCandidateStatus();

  const checks = {
    releaseCandidateReady: candidate.technicalStatus === "ready_for_production_validation",
    nationalCoverage: candidate.activeUfCount === 27,
    noP0Blockers: candidate.p0BlockingIds.length === 0,
    controlledBetaReleased: candidate.controlledBetaStatus === "released_with_restrictions",
    unrestrictedCommercialStillManual:
      candidate.unrestrictedCommercialStatus === "eligible_for_release_review" &&
      candidate.manualCommercialAuthorizationRequired === true,
  };

  const ready = Object.values(checks).every(Boolean);

  return {
    contract: CONTROLLED_BETA_ACCEPTANCE_CONTRACT,
    customerSurfaceContract: CUSTOMER_SURFACE_CONTRACT,
    status: ready ? "ready_for_controlled_beta" as const : "blocked" as const,
    checks,
    activeUfCount: candidate.activeUfCount,
    controlledBetaStatus: candidate.controlledBetaStatus,
    unrestrictedCommercialStatus: candidate.unrestrictedCommercialStatus,
    manualCommercialAuthorizationRequired: true,
    feedbackChannel: "authenticated_user_scoped" as const,
    releaseScopeChangedByThisStage: false,
  };
}
