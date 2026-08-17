import { recommendImportScenario } from "../lib/import-scenario-recommendation.ts";

const base = (scenario, decision, cost, eligible = decision === "apply") => ({
  scenario, label: scenario, legallyEligible: eligible, decision,
  legalReasons: decision === "apply" ? ["Condições validadas."] : ["Condição não validada."],
  blockingIssues: [], source: "test", normalImportICMS: 1700, effectiveImportICMS: decision === "apply" ? 0 : 1700,
  importICMSSavings: decision === "apply" ? 1700 : 0, landedCostBeforeBenefit: 12000, landedCostAfterBenefit: cost,
  landedCostPerUnit: cost / 100, engineResult: {},
});

const recommended = recommendImportScenario([
  base("normal", "normal", 12000, true),
  base("ttd409", "apply", 10500),
  base("ttd410", "apply", 10300),
  base("ttd77", "deny", 9000, false),
]);
if (recommended.recommendedScenario !== "ttd410" || recommended.status !== "recommended") throw new Error("Recomendação econômica/jurídica incorreta.");

const conditional = recommendImportScenario([
  base("normal", "normal", 12000, true),
  base("ttd409", "conditional", 9000, false),
  base("ttd410", "deny", 8500, false),
  base("ttd77", "deny", 8000, false),
]);
if (conditional.status !== "conditional_only" || conditional.recommendedScenario !== "normal") throw new Error("Tratamento condicional não pode ser recomendado.");

console.log("OK: recomendação respeita elegibilidade jurídica antes da otimização econômica.");
