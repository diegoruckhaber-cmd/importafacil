export const STATE_JURISDICTION_CONTRACT = "importafacil-state-jurisdiction-v1" as const;

export const BRAZILIAN_UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type BrazilianUf = (typeof BRAZILIAN_UFS)[number];
export type StateJurisdictionStatus = "homologated" | "unsupported";

export type StateJurisdictionEntry = {
  uf: BrazilianUf;
  status: StateJurisdictionStatus;
  stateEngine: "SC" | null;
  reasonCode: "homologated_sc" | "state_rules_not_homologated";
  legalFoundationIds: readonly string[];
};

const entries = BRAZILIAN_UFS.map<StateJurisdictionEntry>((uf) =>
  uf === "SC"
    ? {
        uf,
        status: "homologated",
        stateEngine: "SC",
        reasonCode: "homologated_sc",
        legalFoundationIds: [
          "LC-87-1996-ICMS",
          "SC-LEI-10297-1996",
          "SC-RICMS-2870-2001",
        ],
      }
    : {
        uf,
        status: "unsupported",
        stateEngine: null,
        reasonCode: "state_rules_not_homologated",
        legalFoundationIds: [],
      },
);

export const STATE_JURISDICTION_REGISTRY: readonly StateJurisdictionEntry[] = entries;

export function getStateJurisdictionRegistry() {
  return {
    contract: STATE_JURISDICTION_CONTRACT,
    policy: "fail_closed" as const,
    entries: STATE_JURISDICTION_REGISTRY,
    homologatedUfs: STATE_JURISDICTION_REGISTRY.filter((entry) => entry.status === "homologated").map((entry) => entry.uf),
  };
}

export function resolveStateJurisdiction(uf: string): StateJurisdictionEntry | null {
  const normalized = String(uf ?? "").trim().toUpperCase();
  return STATE_JURISDICTION_REGISTRY.find((entry) => entry.uf === normalized) ?? null;
}
