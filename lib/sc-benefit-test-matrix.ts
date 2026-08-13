export type SCBenefitTest = {
  id: string;
  title: string;
  facts: string[];
  expected: string;
  severity: "critical" | "high" | "medium";
  source: string;
};

/**
 * Executable-test specification for the SC benefit layer.
 * These are decision tests: the engine must not apply a benefit unless the
 * required facts are present. Numeric rates are deliberately kept in the
 * legal rule catalog rather than duplicated here.
 */
export const SC_BENEFIT_TESTS: SCBenefitTest[] = [
  {
    id: "SC-TTD-001",
    title: "TTD 409 ordinary commercial import",
    facts: ["ttd=409", "commercialization=true", "eligible_port_sc=true", "valid_concession=true"],
    expected: "defer_import_icms_and_enable_subsequent_presumed_credit_if_output_is_eligible",
    severity: "critical",
    source: "RICMS/SC Anexo 2 art. 246",
  },
  {
    id: "SC-TTD-002",
    title: "TTD 410 with commercial output",
    facts: ["ttd=410", "commercialization=true", "valid_concession=true"],
    expected: "apply_ttd_410_rules_and_presumed_credit_only_to_eligible_output",
    severity: "critical",
    source: "RICMS/SC Anexo 2 art. 246",
  },
  {
    id: "SC-TTD-003",
    title: "TTD 410 plus industrial destination",
    facts: ["ttd=410", "industrialization=true", "same_ncm_after_process=false"],
    expected: "do_not_apply_presumed_credit_to_ineligible_industrial_output",
    severity: "critical",
    source: "COPAT 019/2026",
  },
  {
    id: "SC-TTD-004",
    title: "TTD 410 plus TTD 77 mixed destinations",
    facts: ["ttd=410", "ttd=77", "commercial_items=true", "industrial_items=true"],
    expected: "allow_integral_import_under_ttd_410_when_conditions_are_met_and_segment_output_treatment_by_destination",
    severity: "critical",
    source: "COPAT 019/2026",
  },
  {
    id: "SC-TTD-005",
    title: "Missing concession act",
    facts: ["ttd=409", "commercialization=true", "valid_concession=false"],
    expected: "do_not_grant_benefit;_return_missing_eligibility_evidence",
    severity: "critical",
    source: "Art. 246 regime-special requirement",
  },
  {
    id: "SC-TTD-006",
    title: "Decreto 2.128 blocked merchandise",
    facts: ["ttd=409", "decree_2128_blocked=true"],
    expected: "block_ttd_benefit",
    severity: "critical",
    source: "Decreto 2.128/2009 Anexo Único",
  },
  {
    id: "SC-TTD-007",
    title: "Decreto 2.128 same NCM but non-matching description",
    facts: ["ttd=409", "ncm=7013", "blocked_description_matches=false"],
    expected: "do_not_block_solely_from_ncm_if_legal_description_does_not_match",
    severity: "high",
    source: "COPAT 002/2026",
  },
  {
    id: "SC-TTD-008",
    title: "Fraccionamento keeps NCM position",
    facts: ["ttd=409", "fracionamento=true", "same_ncm_position=true", "characteristics_changed=false"],
    expected: "presumed_credit_remains_potentially_eligible",
    severity: "high",
    source: "COPAT 010/2026",
  },
  {
    id: "SC-TTD-009",
    title: "Fracionamento changes NCM position",
    facts: ["ttd=409", "fracionamento=true", "same_ncm_position=false"],
    expected: "block_presumed_credit_for_resulting_output",
    severity: "high",
    source: "COPAT 010/2026",
  },
  {
    id: "SC-TTD-010",
    title: "Mercosur import below 50 percent accumulated threshold",
    facts: ["mercosur_origin=true", "period=2026-06-09_to_2027-06-08", "sc_entry_share_lt_50=true"],
    expected: "do_not_assume_art_110b_condition_is_satisfied",
    severity: "critical",
    source: "RICMS/SC art. 110-B, current 2026 wording",
  },
  {
    id: "SC-TTD-011",
    title: "Mercosur import at 50 percent accumulated threshold",
    facts: ["mercosur_origin=true", "period=2026-06-09_to_2027-06-08", "sc_entry_share_eq_50=true", "not_excluded_catalog_item=true"],
    expected: "art_110b_threshold_condition_satisfied_if_all_other_conditions_are_met",
    severity: "critical",
    source: "RICMS/SC art. 110-B",
  },
  {
    id: "SC-TTD-012",
    title: "Transfer to same-owner establishment without election",
    facts: ["ttd=409", "transfer_same_owner_interstate=true", "taxable_event_election=false"],
    expected: "do_not_grant_presumed_credit_based_on_transfer_without_required_election",
    severity: "high",
    source: "COPAT 060/2025",
  },
  {
    id: "SC-TTD-013",
    title: "Transfer to same-owner establishment with election",
    facts: ["ttd=409", "transfer_same_owner_interstate=true", "taxable_event_election=true"],
    expected: "transfer_can_remain_eligible_subject_to_other_ttd_conditions",
    severity: "high",
    source: "COPAT 060/2025",
  },
  {
    id: "SC-TTD-014",
    title: "Subsequent output already covered by another deferment",
    facts: ["ttd=409", "output_deferred_by_other_regime=true", "art_246_paragraphs_23_24=false"],
    expected: "do_not_apply_presumed_credit_to_deferred_output",
    severity: "critical",
    source: "COPAT 051/2024",
  },
  {
    id: "SC-TTD-015",
    title: "Mixed import with different item destinations",
    facts: ["multi_item=true", "item_a=commercial", "item_b=industrial", "same_di=true"],
    expected: "calculate_and_decide_benefit_per_item_or_allocated_destination; never blanket_apply_one_output_rule",
    severity: "critical",
    source: "COPAT 019/2026",
  },
];

export function countCriticalSCBenefitTests(): number {
  return SC_BENEFIT_TESTS.filter((test) => test.severity === "critical").length;
}
