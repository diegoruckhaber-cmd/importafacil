import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/simulacao-v2/page.tsx", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");

assert.doesNotMatch(page, /type="number"/, "native number spinners should not be used in simulator");
assert.match(page, /function NumericInput/);
assert.match(page, /inputMode="decimal"/);
assert.match(page, /mantenha pressionado para repetir/);
assert.match(page, /step=\{100\}/);
assert.match(page, /step=\{0\.01\}/);
assert.match(css, /\.numericControl/);
assert.match(css, /\.numericStep/);
assert.match(css, /font-size:15px/);
assert.match(css, /font-variant-numeric:tabular-nums/);

console.log("Stage 87 numeric input UX regression passed.");
