import assert from "node:assert/strict";
import fs from "node:fs";

const federal = fs.readFileSync(".github/workflows/audit-official-federal-sources.yml", "utf8");
const stage2 = fs.readFileSync(".github/workflows/stage2-federal-source-audit.yml", "utf8");
const defense = fs.readFileSync(".github/workflows/sync-mdic-defesa-comercial.yml", "utf8");
const runbook = fs.readFileSync("docs/legislative-update-runbook.md", "utf8");

function assertReadOnlyWorkflow(source, label) {
  assert.match(source, /permissions:\s*\n\s*contents:\s*read/);
  assert.doesNotMatch(source, /^\s*contents:\s*write\s*$/m, label + " must not grant contents write");
  assert.doesNotMatch(source, /^\s*git\s+push(?:\s|$)/m, label + " must not push");
}

assert.match(federal, /schedule:/);
assert.match(federal, /workflow_dispatch:/);
assert.match(federal, /official-snapshot-candidate\.json/);
assert.match(federal, /human_review_required_before_any_publication/);
assertReadOnlyWorkflow(federal, "federal source audit");

assert.match(stage2, /workflow_dispatch:/);
assert.match(stage2, /Upload regenerated candidate for review/);
assertReadOnlyWorkflow(stage2, "historical Stage 2 reproducer");

assert.match(defense, /schedule:/);
assertReadOnlyWorkflow(defense, "defense-commercial audit");

assert.match(runbook, /Coleta automática não é publicação automática/);
assert.match(runbook, /pull request revisada/);

console.log("Stage 59 fiscal source pipeline regression passed.");
