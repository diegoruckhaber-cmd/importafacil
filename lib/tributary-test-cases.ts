import { calculateTributaryOperation } from "./tributary-engine";

export const BASELINE_CASE = {
  valorAduaneiro: 61_050,
  iiRate: 12,
  ipiRate: 0,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsRate: 17,
  otherBrl: 3_500,
};

export function runBaselineCase() {
  return calculateTributaryOperation(BASELINE_CASE);
}

/**
 * Fixtures for automated tests against authoritative examples and client
 * operations. These fixtures are mathematical test data, not legal opinions.
 */
export const TEST_CASES = [
  { name: "baseline-general-import", operation: BASELINE_CASE },
  { name: "zero-icms", operation: { ...BASELINE_CASE, icmsRate: 0 } },
  { name: "ipi-example", operation: { ...BASELINE_CASE, ipiRate: 3.25 } },
];
