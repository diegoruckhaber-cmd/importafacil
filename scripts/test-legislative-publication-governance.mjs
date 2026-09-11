import assert from "node:assert/strict";
import fs from "node:fs";

const defenseWorkflow = fs.readFileSync(".github/workflows/sync-mdic-defesa-comercial.yml", "utf8");
const legacyFederalWorkflow = fs.readFileSync(".github/workflows/ingest-official-fiscal-data.yml", "utf8");
const runbook = fs.readFileSync("docs/legislative-update-runbook.md", "utf8");

for (const [name, workflow] of [["defense", defenseWorkflow], ["legacy federal", legacyFederalWorkflow]]) {
  assert.match(workflow, /contents:\s*read/, `${name} workflow must be read-only`);
  assert.doesNotMatch(workflow, /contents:\s*write/, `${name} workflow cannot publish fiscal data`);
  assert.doesNotMatch(workflow, /\bgit\s+push\b/, `${name} workflow cannot push fiscal data directly`);
  assert.match(workflow, /actions\/upload-artifact@v4/, `${name} workflow must expose a review candidate artifact`);
}

assert.match(defenseWorkflow, /schedule:/, "defense candidate audit should remain scheduled");
assert.match(defenseWorkflow, /human review|human-reviewed|review/i);
assert.match(runbook, /Coleta automática não é publicação automática/);
assert.match(runbook, /pull request revisada/i);
assert.match(runbook, /requires_input/);
assert.match(runbook, /npm run test:all/);
assert.match(runbook, /npm run build/);
assert.match(runbook, /Vercel/);
assert.match(runbook, /publicação de regra fiscal é supervisionada/i);
assert.match(runbook, /Não afirmar que toda mudança legislativa é automaticamente detectada, interpretada e publicada sem revisão/i);

console.log("Legislative publication governance: OK — automated collection cannot publish fiscal rules directly");
