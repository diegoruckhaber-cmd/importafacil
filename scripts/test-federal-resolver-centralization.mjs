import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const api = read("app/api/federal-resolve/route.ts");
assert.match(api, /resolveFederalTaxes/);
assert.doesNotMatch(api, /official-snapshot-2026-07/);
assert.doesNotMatch(api, /resolveUniqueRate/);
assert.doesNotMatch(api, /node:fs/);

const lab = read("app/sc-federal-live/page.tsx");
assert.match(lab, /redirect\("\/simulacao-v2"\)/);
assert.doesNotMatch(lab, /federal-tax-resolution/);
assert.doesNotMatch(lab, /resolveFederalTaxes\s*\(/);

const v2Route = read("app/api/simulation-v2/route.ts") + read("lib/server-simulation-v2.ts");
assert.match(v2Route, /runImportSimulationV2/);

const unified = read("lib/unified-import-simulation.ts");
assert.match(unified, /resolveFederalTaxes/);
assert.doesNotMatch(unified, /primeira alíquota/i);
assert.doesNotMatch(unified, /official-snapshot-2026-07/);

console.log("Federal resolver centralization: OK");
