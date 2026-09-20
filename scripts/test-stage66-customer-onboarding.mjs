import assert from "node:assert/strict";
import fs from "node:fs";
import { SIMULATOR_FIELD_GUIDANCE as HELP } from "../lib/simulator-field-guidance.ts";

for (const key of ["destinationUf","exchange","freight","insurance","storage","margin","transportMode","declaration","ncm","origin","fobUnit","weight","destination"]) {
  assert.equal(typeof HELP[key], "string");
  assert.ok(HELP[key].length >= 20, key + " guidance must be useful");
}

const page=fs.readFileSync("app/simulacao-v2/page.tsx","utf8");
assert.match(page,/COMO PREENCHER/);
assert.match(page,/evite estimar no escuro/i);
assert.match(page,/hint=\{HELP\.destinationUf\}/);
assert.match(page,/hint=\{HELP\.exchange\}/);
assert.match(page,/hint=\{HELP\.ncm\}/);
assert.match(page,/hint=\{HELP\.origin\}/);
assert.match(page,/hint=\{HELP\.fobUnit\}/);
assert.match(page,/hint=\{HELP\.weight\}/);
assert.match(page,/hint=\{HELP\.destination\}/);
assert.match(page,/className="fieldHint"/);
assert.match(page,/Opções avançadas e tratamentos específicos/);

const css=fs.readFileSync("app/globals.css","utf8");
assert.match(css,/\.simulatorGuide/);
assert.match(css,/\.fieldHint/);
assert.match(css,/@media\(max-width:760px\)/);

console.log("Stage 66 customer onboarding regression passed.");
