import { STATE_JURISDICTION_REGISTRY, type StateJurisdictionEntry } from "./state-jurisdiction-registry.ts";

export const STATE_ACTIVATION_GUARD_CONTRACT = "importafacil-state-activation-guard-v1" as const;

export type StateActivationApproval = {
  uf: string;
  approvalId: string;
  stateEngineId: string;
  legalReviewVerified: boolean;
  regressionsVerified: boolean;
};

/**
 * Second key for state activation. This is governance metadata only; it contains
 * no rates, formulas, benefits or substantive fiscal eligibility rules.
 */
export const STATE_ACTIVATION_APPROVALS: readonly StateActivationApproval[] = [
  {
    uf: "SC",
    approvalId: "baseline-sc-production",
    stateEngineId: "SC",
    legalReviewVerified: true,
    regressionsVerified: true,
  },
];

export function evaluateStateActivation(
  registry: readonly StateJurisdictionEntry[] = STATE_JURISDICTION_REGISTRY,
  approvals: readonly StateActivationApproval[] = STATE_ACTIVATION_APPROVALS,
) {
  const violations: string[] = [];
  const activeUfs: string[] = [];

  for (const entry of registry) {
    if (entry.status !== "homologated") continue;
    const approval = approvals.find((candidate) => candidate.uf.toUpperCase() === entry.uf);
    if (!approval) {
      violations.push(`${entry.uf}: homologated_without_activation_approval`);
      continue;
    }
    if (!approval.legalReviewVerified) violations.push(`${entry.uf}: legal_review_not_verified`);
    if (!approval.regressionsVerified) violations.push(`${entry.uf}: regressions_not_verified`);
    if (!entry.stateEngine || approval.stateEngineId !== entry.stateEngine) violations.push(`${entry.uf}: state_engine_approval_mismatch`);
    if (
      approval.legalReviewVerified &&
      approval.regressionsVerified &&
      entry.stateEngine != null &&
      approval.stateEngineId === entry.stateEngine
    ) activeUfs.push(entry.uf);
  }

  return {
    contract: STATE_ACTIVATION_GUARD_CONTRACT,
    policy: "two_key_fail_closed" as const,
    status: violations.length === 0 ? "safe" as const : "blocked" as const,
    activeUfs,
    violations,
  };
}

export function assertStateActivationSafe() {
  const result = evaluateStateActivation();
  if (result.status !== "safe") throw new Error(`State activation guard blocked: ${result.violations.join("; ")}`);
  return result;
}
