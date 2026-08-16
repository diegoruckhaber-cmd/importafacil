import assert from "node:assert/strict";
import fs from "node:fs";

const source = JSON.parse(fs.readFileSync("data/federal/tipi-2026-source.json", "utf8"));
assert.equal(source.sourceType, "TIPI");
assert.equal(source.sourceVersion, "2026-02-13");
assert.equal(source.productionReady, false);
assert.match(source.officialPage, /gov\.br\/receitafederal/);
console.log("TIPI 2026 source manifest acceptance: OK");
