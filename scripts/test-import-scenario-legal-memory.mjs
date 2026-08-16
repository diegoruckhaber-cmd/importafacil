import assert from "node:assert/strict";
import { compareImportScenario } from "../lib/import-scenario-comparator.ts";
import { buildScenarioLegalMemory } from "../lib/import-scenario-legal-memory.ts";

const base = {
  ncm: "32081020",
  quantity: 1000,
  fobUnitUsd: 10,
  exchangeRate: 5.5,
  freightUsd: 1200,
  insuranceUsd: 100,
  otherExpensesBrl: 3500,
  iiRate: 12,
  ipiRate: 0,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsRate: 17,
  destination: "commercial_resale",
  taxableOutput: true,
  importDate: "2026-08-16",
};

const normal = buildScenarioLegalMemory(compareImportScenario(base, "normal"));
assert.equal(normal.statusLabel, "Normal");
assert.equal(normal.importStage.normalRate, 17);
assert.equal(normal.importStage.effectiveRate, 17);

const ttd409 = buildScenarioLegalMemory(compareImportScenario({
  ...base,
  destination: "commercial_resale",
  preservesOriginalCharacteristics: true,
  sameNcmPosition: true,
}, "ttd409"));
assert.ok(["Aplicável", "Condicional", "Não aplicável"].includes(ttd409.statusLabel));
assert.equal(typeof ttd409.legalConclusion, "string");
assert.equal(typeof ttd409.outputStageNote, "string");
assert.equal(ttd409.importStage.normalRate, 17);

console.log("Import scenario legal memory: PASS");
