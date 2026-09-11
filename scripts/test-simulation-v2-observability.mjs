import assert from "node:assert/strict";
import fs from "node:fs";
import { buildSimulationV2Telemetry } from "../lib/simulation-v2-observability.ts";

const startedAtMs = Date.now() - 25;
const telemetry = buildSimulationV2Telemetry({
  startedAtMs,
  input: {
    destinationUf: "sc",
    items: [
      { ncm: "32081020", name: "Sensitive item", exporter: "Sensitive exporter", fobUnit: 999 },
      { ncm: "29181400", name: "Another item", fobUnit: 123 },
    ],
  },
  result: {
    status: "requires_input",
    engine: "unified-multi-item-v1",
    federalEngine: "authoritative-federal-v2",
    issues: [
      { code: "federal_requires_input", message: "Sensitive legal message" },
      { code: "federal_requires_input", message: "duplicate" },
      { code: "state_rule_requires_input", itemId: "ITEM-001" },
    ],
  },
});

assert.equal(telemetry.event, "simulation_v2.completed");
assert.equal(telemetry.status, "requires_input");
assert.equal(telemetry.itemCount, 2);
assert.equal(telemetry.destinationUf, "SC");
assert.deepEqual(telemetry.issueCodes, ["federal_requires_input", "state_rule_requires_input"]);
assert(telemetry.durationMs >= 0);
assert.equal(telemetry.engine, "unified-multi-item-v1");

const serialized = JSON.stringify(telemetry);
for (const forbidden of ["32081020", "29181400", "Sensitive item", "Sensitive exporter", "999", "Sensitive legal message"]) {
  assert(!serialized.includes(forbidden), `telemetry leaked sensitive/raw simulation data: ${forbidden}`);
}

const failed = buildSimulationV2Telemetry({
  startedAtMs: Date.now(),
  input: { items: [{ ncm: "12345678" }] },
  error: new Error("raw internal failure details"),
});
assert.equal(failed.event, "simulation_v2.failed");
assert.equal(failed.status, "error");
assert.deepEqual(failed.issueCodes, ["unhandled_simulation_error"]);
assert(!JSON.stringify(failed).includes("raw internal failure details"));
assert(!JSON.stringify(failed).includes("12345678"));

const observability = fs.readFileSync("lib/simulation-v2-observability.ts", "utf8");
const route = fs.readFileSync("app/api/simulation-v2/route.ts", "utf8");
const health = fs.readFileSync("app/api/health/route.ts", "utf8");
assert.match(route, /emitSimulationV2Telemetry/);
assert.match(route, /buildSimulationV2Telemetry/);
assert.match(health, /deploymentSha/);
assert.match(health, /official-snapshot-2026-09-08/);
assert.doesNotMatch(observability, /\.ncm|\.name|\.exporter|fobUnit|merchandise|landedCost/);

console.log("Simulation V2 observability: OK — structured status/version telemetry without commercial or personal data");
