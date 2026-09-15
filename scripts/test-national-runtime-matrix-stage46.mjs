import assert from "node:assert/strict";
import fs from "node:fs";
import { runImportSimulationV2 } from "../lib/simulation-v2.ts";
import { BRAZILIAN_UFS, resolveStateJurisdiction } from "../lib/state-jurisdiction-registry.ts";
import { resolveGeneralStateIcmsRule } from "../lib/state-general-icms-rules.ts";

const baseOperation = {
  scenarioName: "Stage 46 national runtime matrix",
  date: "2026-09-15",
  exchange: 5.5,
  freight: 100,
  insurance: 10,
  storage: 0,
  otherBrl: 0,
  transportMode: "air",
  declarationType: "di",
  targetMarginPercent: 20,
};

function item(overrides = {}) {
  return {
    itemId: "NATIONAL-RUNTIME-ITEM",
    name: "Verniz teste nacional",
    ncm: "32081020",
    origin: "México",
    quantity: 10,
    weightKg: 100,
    fobUnit: 20,
    icms: 17,
    ttd: "none",
    destination: "commercial_resale",
    ...overrides,
  };
}

function callSimulation(destinationUf, itemOverrides = {}) {
  return runImportSimulationV2({
    ...baseOperation,
    destinationUf,
    items: [item(itemOverrides)],
  });
}

const routeSource = fs.readFileSync("app/api/simulation-v2/route.ts", "utf8");
assert.match(routeSource, /runImportSimulationV2/);
assert.match(routeSource, /const result = runImportSimulationV2\(body\)/);
assert.match(routeSource, /buildSimulationV2LegalTrace\(result\)/);
assert.match(routeSource, /return NextResponse\.json\(/);

assert.equal(BRAZILIAN_UFS.length, 27);

for (const uf of BRAZILIAN_UFS) {
  const jurisdiction = resolveStateJurisdiction(uf);
  assert(jurisdiction, `${uf}: jurisdiction missing`);
  assert.equal(jurisdiction.status, "homologated", `${uf}: jurisdiction must remain homologated`);

  const normal = callSimulation(uf);
  assert.equal(normal.contract, "importafacil-simulation-v2", `${uf}: unexpected contract`);
  assert(["calculated", "alert"].includes(normal.status), `${uf}: unexpected normal status ${normal.status}`);
  assert.equal(normal.jurisdiction?.destinationUf, uf, `${uf}: wrong destination in runtime jurisdiction`);
  assert.equal(normal.jurisdiction?.status, "homologated", `${uf}: runtime jurisdiction not homologated`);
  assert.equal(normal.jurisdiction?.scope, jurisdiction.scope, `${uf}: runtime scope drift`);
  assert.equal(normal.jurisdiction?.homologatedUfs?.length, 27, `${uf}: runtime must expose 27 homologated UFs`);
  assert(normal.summary?.landedCostBrl > 0, `${uf}: runtime summary missing`);
  assert(normal.calculation?.items?.[0], `${uf}: runtime calculation missing`);

  if (uf === "SC") {
    assert.equal(normal.jurisdiction.stateEngine, "SC");
    assert.equal(normal.jurisdiction.scope, "full");
    continue;
  }

  const rule = resolveGeneralStateIcmsRule(uf);
  assert(rule, `${uf}: general ICMS rule missing`);
  assert.equal(normal.jurisdiction.stateEngine, "GENERAL", `${uf}: wrong runtime engine`);
  assert.equal(normal.jurisdiction.scope, "general_rate_only", `${uf}: general scope drift`);
  assert.equal(normal.calculation.items[0].icmsNormalRate, rule.ratePercent, `${uf}: runtime rate differs from homologated general rate`);
  assert.equal(normal.calculation.items[0].icmsImportEffectiveRate, rule.ratePercent, `${uf}: runtime effective rate differs from homologated general rate`);

  const blockedSpecial = callSimulation(uf, { ttd: "409" });
  assert.equal(blockedSpecial.contract, "importafacil-simulation-v2", `${uf}: blocked contract drift`);
  assert.equal(blockedSpecial.status, "blocked", `${uf}: TTD outside scope must be blocked`);
  assert.equal(blockedSpecial.summary, null, `${uf}: blocked scope must not expose summary`);
  assert.equal(blockedSpecial.calculation, null, `${uf}: blocked scope must not expose calculation`);
  assert(blockedSpecial.issues?.some((issue) => issue.code === "state_scope_unsupported"), `${uf}: missing state_scope_unsupported issue`);
  assert(blockedSpecial.attentionPoints?.some((message) => /apenas para a regra geral de ICMS/i.test(message)), `${uf}: missing explicit scope warning`);
}

const invalidUf = callSimulation("XX");
assert.equal(invalidUf.status, "blocked");
assert.equal(invalidUf.summary, null);
assert.equal(invalidUf.calculation, null);
assert(invalidUf.issues?.some((issue) => issue.code === "state_jurisdiction_unsupported"));
assert(invalidUf.attentionPoints?.some((message) => /UF XX não homologada/i.test(message)));

console.log("Stage 46: OK — canonical Simulation V2 runtime covers 27/27 UFs; API route delegation is locked; state scope remains structured fail-closed");
