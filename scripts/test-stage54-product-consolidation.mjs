import assert from "node:assert/strict";
import fs from "node:fs";

const home=fs.readFileSync("app/page.tsx","utf8");
assert.match(home,/href="\/simulacao-v2"/);
assert.match(home,/Simular gratuitamente/);
assert.match(home,/NÃO É SÓ UMA CALCULADORA/);
assert.match(home,/BETA CONTROLADO/);
assert.match(home,/PLANOS/);
assert.match(home,/href="\/upgrade"/);
assert.doesNotMatch(home,/fetch\("\/api\/sc-federal-calculate"/);
assert.doesNotMatch(home,/Calcular operação/);

const redirects = new Map([
  ["app/sc-operation/page.tsx","/simulacao-v2?from=sc-operation"],
  ["app/sc-test/page.tsx","/simulacao-v2"],
  ["app/sc-federal-test/page.tsx","/simulacao-v2"],
  ["app/sc-save-test/page.tsx","/simulacao-v2"],
  ["app/sc-federal-live/page.tsx","/simulacao-v2"],
  ["app/sc-output/page.tsx","/simulacao-v2"],
  ["app/sc-audit/page.tsx","/regras"],
]);

for (const [path,target] of redirects) {
  const content=fs.readFileSync(path,"utf8");
  assert.match(content,/next\/navigation/);
  assert.ok(content.includes(`redirect("${target}")`), path+" must redirect to "+target);
}

const api=fs.readFileSync("app/api/sc-federal-calculate/route.ts","utf8");
assert.ok(api.length>100,"legacy API remains available for compatibility");

console.log("Stage 54 product consolidation regression passed.");
