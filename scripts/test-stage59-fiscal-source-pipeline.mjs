import assert from "node:assert/strict";
import fs from "node:fs";

const federal = fs.readFileSync(".github/workflows/audit-official-federal-sources.yml", "utf8");
const stage2 = fs.readFileSync(".github/workflows/stage2-federal-source-audit.yml", "utf8");
const defense = fs.readFileSync(".github/workflows/sync-mdic-defesa-comercial.yml", "utf8");
const runbook = fs.readFileSync("docs/legislative-update-runbook.md", "utf8");

assert.match(federal, /schedule:/);
assert.match(federal, /workflow_dispatch:/);
assert.match(federal, /contents:\s*read/);
assert.match(federal, /official-snapshot-candidate\.json/);
assert.match(federal, /human_review_required_before_any_publication/);
assert.doesNotMatch(federal, /contents:\s*write/);
assert.doesNotMatch(federal, /git\s+push/);

assert.match(stage2, /workflow_dispatch:/);
assert.match(stage2, /contents:\s*read/);
assert.doesNotMatch(stage2, /contents:\s*write/);
assert.doesNotMatch(stage2, /git\s+push/);
assert.match(stage2, /Upload regenerated candidate for review/);

assert.match(defense, /schedule:/);
assert.match(defense, /contents:\s*read/);
assert.doesNotMatch(defense, /contents:\s*write/);
assert.doesNotMatch(defense, /git\s+push/);

assert.match(runbook, /Coleta automática não é publicação automática/);
assert.match(runbook, /pull request revisada/);

console.log("Stage 59 fiscal source pipeline regression passed.");
