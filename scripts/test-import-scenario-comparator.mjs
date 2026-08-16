import { compareImportScenarios } from "../lib/import-scenario-comparator.ts";

const input = {
  ncm: "32081020",
  quantity: 1000,
  fobUnitUsd: 10,
  exchangeRate: 5.5,
  freightUsd: 1200,
  insuranceUsd: 100,
  otherExpensesBrl: 3500,
  iiRate: 12.6,
  ipiRate: 0,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsRate: 17,
  importDate: "2026-08-16",
  destination: "commercial_resale",
  industrializationInSC: false,
  taxableOutput: true,
  preservesOriginalCharacteristics: true,
  sameNcmPosition: true,
  exclusionKnown: false,
};

const scenarios = compareImportScenarios(input);
if (scenarios.length !== 4) throw new Error("Comparador deve retornar normal, TTD 409, TTD 410 e TTD 77.");
if (scenarios[0].decision !== "normal") throw new Error("Cenário normal não passou pelo motor normal.");
for (const scenario of scenarios.slice(1)) {
  if (!['apply', 'conditional', 'deny'].includes(scenario.decision)) throw new Error(`Decisão inválida: ${scenario.scenario}`);
  if (scenario.decision !== "apply" && scenario.importICMSSavings !== 0) throw new Error(`${scenario.scenario} não pode gerar economia quando não aplicável.`);
}
const normal = scenarios[0];
if (normal.normalImportICMS !== normal.effectiveImportICMS) throw new Error("Regime normal deve manter ICMS efetivo igual ao normal.");
console.log("OK: comparador usa o motor tributário unificado e não aplica benefícios não elegíveis.");
