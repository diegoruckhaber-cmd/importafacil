export type ScDecisionCase = {
  id: string;
  scenario: string;
  inputs: Record<string, unknown>;
  expectedDecision: "apply" | "deny" | "conditional";
  legalBasis: string;
  rationale: string;
};

/**
 * Regression corpus for the SC import-decision layer.
 * These are decision expectations, not invented tax rates.
 * Numeric tax outcomes must be produced only after the current
 * rate/base/TTD catalogs are resolved by the engine.
 */
export const SC_DECISION_REGRESSION_CASES: ScDecisionCase[] = [
  {
    id: "SC-409-COMMERCIAL",
    scenario: "TTD 409 import for subsequent commercial sale",
    inputs: { ttd: 409, destination: "commercial_resale", importEntryInSC: true },
    expectedDecision: "apply",
    legalBasis: "RICMS/SC Anexo 2, art. 246",
    rationale: "The regime covers importation for commercialization, subject to the specific concessive act and all conditions.",
  },
  {
    id: "SC-410-COMMERCIAL",
    scenario: "TTD 410 import for subsequent commercial sale",
    inputs: { ttd: 410, destination: "commercial_resale", importEntryInSC: true },
    expectedDecision: "apply",
    legalBasis: "RICMS/SC Anexo 2, art. 246",
    rationale: "The import deferral and subsequent presumptive-credit stages must be evaluated separately.",
  },
  {
    id: "SC-410-INDUSTRIALIZATION",
    scenario: "TTD 410 import subsequently destined to industrialization",
    inputs: { ttd: 410, destination: "industrialization" },
    expectedDecision: "conditional",
    legalBasis: "RICMS/SC Anexo 2, art. 246; Anexo 3, art. 10",
    rationale: "The import stage and the subsequent output treatment cannot be treated as one blanket benefit; destination drives the subsequent treatment.",
  },
  {
    id: "SC-409-410-SAME-NCM-FRACTION",
    scenario: "Imported coil fractionated without changing NCM position",
    inputs: { ttd: "409/410", operation: "fractionation", sameNcmPosition: true },
    expectedDecision: "apply",
    legalBasis: "COPAT 010/2026",
    rationale: "The official interpretation states that maintaining the same NCM position does not by itself prevent the presumptive credit.",
  },
  {
    id: "SC-409-410-NCM-CHANGE",
    scenario: "Imported coil fractionated and resulting product changes NCM position",
    inputs: { ttd: "409/410", operation: "fractionation", sameNcmPosition: false },
    expectedDecision: "deny",
    legalBasis: "COPAT 010/2026",
    rationale: "A change in NCM position can prevent the presumptive credit because the marketed product is no longer treated as the same imported good.",
  },
  {
    id: "SC-409-2128",
    scenario: "NCM expressly covered by a prohibition in Decree 2.128/2009",
    inputs: { ttd: 409, decree2128Prohibited: true },
    expectedDecision: "deny",
    legalBasis: "Decreto 2.128/2009; COPAT 004/2026",
    rationale: "The prohibition must be evaluated against the legal NCM description, not merely the commercial product name.",
  },
  {
    id: "SC-409-PARAGUAY",
    scenario: "Paraguayan-origin goods with entry and customs clearance in another state by road",
    inputs: { ttd: 409, origin: "Paraguay", customsClearanceInSC: false, roadEntryOtherUF: true },
    expectedDecision: "conditional",
    legalBasis: "COPAT 025/2026; RICMS/SC art. 246 and art. 110-B",
    rationale: "The specific COPAT permits the treatment in the analyzed configuration, but the regime conditions and the period-specific Mercosur requirements must be checked.",
  },
  {
    id: "SC-MERCOSUR-UNDER-50",
    scenario: "Mercosur aggregated threshold below 50%",
    inputs: { period: "2026-06-09/2027-06-08", mercosurRelevantImportShare: 49.99 },
    expectedDecision: "deny",
    legalBasis: "RICMS/SC art. 110-B; current 2026 rules",
    rationale: "The period-specific aggregate requirement is not met.",
  },
  {
    id: "SC-MERCOSUR-EXACT-50",
    scenario: "Mercosur aggregated threshold exactly 50%",
    inputs: { period: "2026-06-09/2027-06-08", mercosurRelevantImportShare: 50 },
    expectedDecision: "conditional",
    legalBasis: "RICMS/SC art. 110-B; current 2026 rules",
    rationale: "The percentage condition is met, but excluded NCMs and the remaining statutory conditions must still be evaluated.",
  },
  {
    id: "SC-TRANSFER-SAME-TITULAR",
    scenario: "Subsequent transfer to another establishment of the same holder in another state",
    inputs: { ttd: "409/410", operation: "same_holder_interstate_transfer" },
    expectedDecision: "conditional",
    legalBasis: "COPAT 068/2024; COPAT 060/2025",
    rationale: "Maintenance of the presumptive credit depends on the legal modality and conditions of the transfer.",
  },
  {
    id: "SC-409-77-MULTI-ITEM",
    scenario: "Single import with one item for resale and another for industrialization",
    inputs: {
      ttd: "409+77",
      items: [
        { id: "A", destination: "commercial_resale" },
        { id: "B", destination: "industrialization" },
      ],
    },
    expectedDecision: "conditional",
    legalBasis: "COPAT 019/2026; RICMS/SC Anexo 2 art. 246; Anexo 3 art. 10",
    rationale: "The engine must decide at item/destination level rather than applying one benefit to the entire DI.",
  },
  {
    id: "SC-409-REDUCTION-COMPATIBILITY",
    scenario: "TTD 409/410 combined with a specific reduction of tax base",
    inputs: { ttd: "409/410", hasSpecificBaseReduction: true },
    expectedDecision: "conditional",
    legalBasis: "COPAT 038/2024",
    rationale: "Benefits cannot be arithmetically stacked; the specific compatibility rule must determine the effective treatment.",
  },
  {
    id: "SC-NO-CONCESSIVE-ACT",
    scenario: "User selects TTD but provides no valid concessive act",
    inputs: { ttd: 410, concessiveActValid: false },
    expectedDecision: "deny",
    legalBasis: "RICMS/SC Anexo 2, art. 246 and concessive-act conditions",
    rationale: "The calculator must never infer eligibility solely from the TTD number entered by the user.",
  },
];

export const SC_DECISION_REGRESSION_CASE_COUNT = SC_DECISION_REGRESSION_CASES.length;
