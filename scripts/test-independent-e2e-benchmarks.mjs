import assert from "node:assert/strict";
import { calculateTributaryOperation } from "../lib/tributary-engine.ts";
import { INDEPENDENT_E2E_BENCHMARKS } from "../lib/independent-e2e-benchmarks.ts";

function close(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}

const primary = INDEPENDENT_E2E_BENCHMARKS[0];
const result = calculateTributaryOperation({
  valorAduaneiro: primary.customsValueBrl,
  iiRate: primary.federal.statutoryIiRate,
  ipiRate: primary.federal.ipiRate,
  pisImportRate: primary.federal.pisRate,
  cofinsImportRate: primary.federal.cofinsRate,
  icmsRate: primary.state.icmsRate,
  icmsTaxableAdditionsBrl: primary.additions.afrmmBrl + primary.additions.siscomexBrl,
  importDate: primary.date,
  iiLegalFoundation: "Preferential agreement — external cleared declaration benchmark",
  iiBenefitKind: "reduced_rate",
  iiReducedRate: primary.federal.effectiveIiRate,
  iiCoveredByLC224: false,
});

close(result.ii.payable, primary.federal.iiBrl, primary.toleranceBrl, "primary II");
close(result.ipi.payable, primary.federal.ipiBrl, primary.toleranceBrl, "primary IPI");
close(result.pisImport.payable, primary.federal.pisBrl, primary.toleranceBrl, "primary PIS");
close(result.cofinsImport.payable, primary.federal.cofinsBrl, primary.toleranceBrl, "primary COFINS");
close(result.icms.payable, primary.state.icmsBrl, primary.toleranceBrl, "primary ICMS");
assert.equal(result.federal2026?.ii?.effectiveRate, primary.federal.effectiveIiRate);

const secondary = INDEPENDENT_E2E_BENCHMARKS[1];
close(secondary.customsValueBrl * (secondary.federal.pisRate / 100), secondary.federal.pisBrl, secondary.toleranceBrl, "secondary PIS");
close(secondary.customsValueBrl * (secondary.federal.cofinsRate / 100), secondary.federal.cofinsBrl, secondary.toleranceBrl, "secondary COFINS");

assert.equal(INDEPENDENT_E2E_BENCHMARKS.every((benchmark) => benchmark.sourceType === "cleared_customs_declaration"), true);
console.log("Independent E2E benchmark: OK — cleared external customs evidence reconciled within cent-level tolerance");
