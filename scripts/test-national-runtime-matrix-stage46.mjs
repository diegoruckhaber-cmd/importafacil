import assert from "node:assert/strict";
import { POST } from "../app/api/simulation-v2/route.ts";
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

async function callSimulation(destinationUf, itemOverrides = {}) {
  const request = new Request("http://localhost/api/simulation-v2", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...baseOperation,
      destinationUf,
      items: [item(itemOverrides)],
    }),
  });
  const response = await POST(request);
  return { httpStatus: response.status, body: await response.json() };
}

assert.equal(BRAZILIAN_UFS.length, 27);

for (const uf of BRAZILIAN_UFS) {
  const jurisdiction = resolveStateJurisdiction(uf);
  assert(jurisdiction, `${uf}: jurisdiction missing`);
  assert.equal(jurisdiction.status, "homologated", `${uf}: jurisdiction must remain homologated`);

  const normal = await callSimulation(uf);
  assert.equal(normal.httpStatus, 200, `${uf}: normal path must return HTTP 200`);
  assert.equal(normal.body.contract, "importafacil-simulation-v2", `${uf}: unexpected contract`);
  assert(["calculated", "alert"].includes(normal.body.status), `${uf}: unexpected normal status ${normal.body.status}`);
  assert.equal(normal.body.jurisdiction?.destinationUf, uf, `${uf}: wrong destination in runtime jurisdiction`);
  assert.equal(normal.body.jurisdiction?.status, "homologated", `${uf}: runtime jurisdiction not homologated`);
  assert.equal(normal.body.jurisdiction?.scope, jurisdiction.scope, `${uf}: runtime scope drift`);
  assert.equal(normal.body.jurisdiction?.homologatedUfs?.length, 27, `${uf}: runtime must expose 27 homologated UFs`);
  assert(normal.body.summary?.landedCostBrl > 0, `${uf}: runtime summary missing`);
  assert(normal.body.calculation?.items?.[0], `${uf}: runtime calculation missing`);
  assert(Array.isArray(normal.body.legalTrace), `${uf}: legal trace missing`);

  if (uf === "SC") {
    assert.equal(normal.body.jurisdiction.stateEngine, "SC");
    assert.equal(normal.body.jurisdiction.scope, "full");
    continue;
  }

  const rule = resolveGeneralStateIcmsRule(uf);
  assert(rule, `${uf}: general ICMS rule missing`);
  assert.equal(normal.body.jurisdiction.stateEngine, "GENERAL", `${uf}: wrong runtime engine`);
  assert.equal(normal.body.jurisdiction.scope, "general_rate_only", `${uf}: general scope drift`);
  assert.equal(normal.body.calculation.items[0].icmsNormalRate, rule.ratePercent, `${uf}: runtime rate differs from homologated general rate`);
  assert.equal(normal.body.calculation.items[0].icmsImportEffectiveRate, rule.ratePercent, `${uf}: runtime effective rate differs from homologated general rate`);

  const blockedSpecial = await callSimulation(uf, { ttd: "409" });
  assert.equal(blockedSpecial.httpStatus, 200, `${uf}: out-of-scope state treatment must use structured blocked response`);
  assert.equal(blockedSpecial.body.contract, "importafacil-simulation-v2", `${uf}: blocked contract drift`);
  assert.equal(blockedSpecial.body.status, "blocked", `${uf}: TTD outside scope must be blocked`);
  assert.equal(blockedSpecial.body.summary, null, `${uf}: blocked scope must not expose summary`);
  assert.equal(blockedSpecial.body.calculation, null, `${uf}: blocked scope must not expose calculation`);
  assert(blockedSpecial.body.issues?.some((issue) => issue.code === "state_scope_unsupported"), `${uf}: missing state_scope_unsupported issue`);
  assert(blockedSpecial.body.attentionPoints?.some((message) => /apenas para a regra geral de ICMS/i.test(message)), `${uf}: missing explicit scope warning`);
}

const invalidUf = await callSimulation("XX");
assert.equal(invalidUf.httpStatus, 200);
assert.equal(invalidUf.body.status, "blocked");
assert.equal(invalidUf.body.summary, null);
assert.equal(invalidUf.body.calculation, null);
assert(invalidUf.body.issues?.some((issue) => issue.code === "state_jurisdiction_unsupported"));
assert(invalidUf.body.attentionPoints?.some((message) => /UF XX não homologada/i.test(message)));

console.log("Stage 46: OK — Simulation V2 runtime matrix covers 27/27 UFs and state scope remains structured fail-closed");
