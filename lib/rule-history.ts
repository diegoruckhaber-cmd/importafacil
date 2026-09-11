import { LEGAL_FOUNDATION_2026 } from "./legal-foundation-registry-2026.ts";
import {
  FEDERAL_TARIFF_CATALOG_STATUS,
  FEDERAL_TARIFF_SOURCE_MANIFEST_VERSION,
} from "./federal-tariff-source-manifest-2026.ts";

export const RULE_HISTORY_CONTRACT = "importafacil-rule-history-v1" as const;

export type RuleHistoryEntry = {
  id: string;
  scope: string;
  authority: string;
  title: string;
  effectiveFrom: string | null;
  officialUrl: string;
  notes: string;
};

/** Read-only audit projection over canonical legal/federal registries. */
export function getRuleHistory() {
  return {
    contract: RULE_HISTORY_CONTRACT,
    federalSnapshot: FEDERAL_TARIFF_CATALOG_STATUS.snapshot,
    federalManifestVersion: FEDERAL_TARIFF_SOURCE_MANIFEST_VERSION,
    entries: LEGAL_FOUNDATION_2026.map<RuleHistoryEntry>((source) => ({
      id: source.id,
      scope: source.scope,
      authority: source.authority,
      title: source.title,
      effectiveFrom: source.effectiveFrom ?? null,
      officialUrl: source.officialUrl,
      notes: source.notes,
    })),
  };
}
