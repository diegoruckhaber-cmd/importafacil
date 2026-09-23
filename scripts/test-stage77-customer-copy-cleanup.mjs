import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/not-found.tsx", "utf8");

assert.doesNotMatch(page, /Simulation V2/i);
assert.match(page, /nova simulação/i);
assert.match(page, /productContentPage/);
assert.match(page, /productLocked/);
assert.match(page, /Página inicial/);

console.log("Stage 77 customer copy cleanup regression passed.");
