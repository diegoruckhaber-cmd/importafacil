import { resolveStateJurisdiction } from "./state-jurisdiction-registry.ts";

export const STATE_HOMOLOGATION_PACKAGE_CONTRACT = "importafacil-state-homologation-package-v1" as const;

export type StateLegalEvidence = {
  id: string;
  officialUrl: string;
  validityStatus: "verified" | "unknown";
  effectiveFrom: string | null;
  effectiveUntil: string | null;
};

export type StateHomologationPackage = {
  uf: string;
  stateEngineId: string;
  auditedAt: string;
  legalSources: StateLegalEvidence[];
  regressionScripts: string[];
};

export type StateHomologationPreflight = {
  contract: typeof STATE_HOMOLOGATION_PACKAGE_CONTRACT;
  uf: string;
  status: "eligible_for_review" | "blocked";
  blockingIssues: string[];
  activatesJurisdiction: false;
};

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function validateStateHomologationPackage(input: StateHomologationPackage): StateHomologationPreflight {
  const uf = String(input?.uf ?? "").trim().toUpperCase();
  const blockingIssues: string[] = [];
  const jurisdiction = resolveStateJurisdiction(uf);

  if (!jurisdiction) blockingIssues.push("invalid_or_unknown_uf");
  if (!String(input?.stateEngineId ?? "").trim()) blockingIssues.push("state_engine_required");
  if (!isoDate.test(String(input?.auditedAt ?? ""))) blockingIssues.push("audit_date_required");
  if (!Array.isArray(input?.regressionScripts) || input.regressionScripts.length === 0 || input.regressionScripts.some((script) => !String(script).trim())) {
    blockingIssues.push("regression_evidence_required");
  }
  if (!Array.isArray(input?.legalSources) || input.legalSources.length === 0) {
    blockingIssues.push("legal_sources_required");
  } else {
    for (const source of input.legalSources) {
      if (!String(source?.id ?? "").trim()) blockingIssues.push("legal_source_id_required");
      if (!/^https:\/\//i.test(String(source?.officialUrl ?? ""))) blockingIssues.push("official_https_source_required");
      if (source?.validityStatus !== "verified") blockingIssues.push("legal_validity_not_verified");
      if (source?.effectiveFrom != null && !isoDate.test(String(source.effectiveFrom))) blockingIssues.push("invalid_effective_from");
      if (source?.effectiveUntil != null && !isoDate.test(String(source.effectiveUntil))) blockingIssues.push("invalid_effective_until");
    }
  }

  return {
    contract: STATE_HOMOLOGATION_PACKAGE_CONTRACT,
    uf,
    status: blockingIssues.length === 0 ? "eligible_for_review" : "blocked",
    blockingIssues: [...new Set(blockingIssues)],
    activatesJurisdiction: false,
  };
}

export function getStateHomologationPreflightContract() {
  return {
    contract: STATE_HOMOLOGATION_PACKAGE_CONTRACT,
    policy: "fail_closed" as const,
    resultStatuses: ["eligible_for_review", "blocked"] as const,
    activatesJurisdiction: false as const,
    requiredEvidence: ["valid_uf", "state_engine", "audit_date", "legal_sources_with_verified_validity", "regression_scripts"] as const,
  };
}
