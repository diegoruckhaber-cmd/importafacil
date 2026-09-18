import assert from "node:assert/strict";
import fs from "node:fs";

const home=fs.readFileSync("app/page.tsx","utf8");
const simulator=fs.readFileSync("app/simulacao-v2/page.tsx","utf8");
const layout=fs.readFileSync("app/layout.tsx","utf8");
const css=fs.readFileSync("app/globals.css","utf8");

for (const phrase of [
  "Antes de importar, descubra se a conta fecha.",
  "Simular gratuitamente",
  "NÃO É SÓ UMA CALCULADORA",
  "Comece grátis. Evolua quando fizer sentido.",
  "PRONTO PARA SIMULAR?"
]) assert.ok(home.includes(phrase), "missing commercial home phrase: "+phrase);

assert.match(home,/priceGrid/);
assert.match(home,/priceCard featured/);
assert.match(home,/href="\/upgrade"/);
assert.match(home,/href="\/simulacao-v2"/);

assert.match(simulator,/SIMULADOR DE IMPORTAÇÃO/);
assert.match(simulator,/Simule sua importação antes de fechar a compra/);
assert.match(simulator,/RESUMO DA OPERAÇÃO/);
assert.match(simulator,/Comece pelas premissas principais/);
assert.match(simulator,/O que você vai importar\?/);
assert.match(simulator,/Opções avançadas e tratamentos específicos/);
assert.match(simulator,/Calcular importação/);
assert.match(simulator,/Tratamento estadual:/);
assert.doesNotMatch(simulator,/IMPORTAFÁCIL · SIMULATION V2/);
assert.doesNotMatch(simulator,/Calcular Simulation V2/);
assert.doesNotMatch(simulator,/Escopo estadual:/);

assert.match(layout,/Cobertura tributária nas 27 UFs/);
assert.match(layout,/Entenda o escopo/);
assert.match(css,/\.marketingHeader/);
assert.match(css,/\.simulatorHero/);
assert.match(css,/\.advancedPanel/);
assert.match(css,/\.betaBar/);
assert.doesNotMatch(css,/^header\{background:#0b1530/m);

console.log("Commercial experience restoration regression passed.");
