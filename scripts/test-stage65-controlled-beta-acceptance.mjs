import assert from "node:assert/strict";
import fs from "node:fs";
import { getControlledBetaAcceptance } from "../lib/controlled-beta-acceptance.ts";

const acceptance = getControlledBetaAcceptance();
assert.equal(acceptance.contract,"importafacil-controlled-beta-acceptance-v1");
assert.equal(acceptance.customerSurfaceContract,"importafacil-commercial-surface-v1");
assert.equal(acceptance.status,"ready_for_controlled_beta");
assert.equal(acceptance.activeUfCount,27);
assert.equal(acceptance.controlledBetaStatus,"released_with_restrictions");
assert.equal(acceptance.unrestrictedCommercialStatus,"eligible_for_release_review");
assert.equal(acceptance.manualCommercialAuthorizationRequired,true);
assert.equal(acceptance.feedbackChannel,"authenticated_user_scoped");
assert.equal(acceptance.releaseScopeChangedByThisStage,false);
assert.ok(Object.values(acceptance.checks).every(Boolean));

const home=fs.readFileSync("app/page.tsx","utf8");
const simulator=fs.readFileSync("app/simulacao-v2/page.tsx","utf8");
assert.match(home,/Antes de importar, descubra se a conta fecha\./);
assert.match(home,/Simular gratuitamente/);
assert.match(home,/NÃO É SÓ UMA CALCULADORA/);
assert.match(simulator,/SIMULADOR DE IMPORTAÇÃO/);
assert.match(simulator,/Calcular importação/);
assert.match(simulator,/Opções avançadas e tratamentos específicos/);
assert.doesNotMatch(simulator,/IMPORTAFÁCIL · SIMULATION V2/);
assert.doesNotMatch(simulator,/Calcular Simulation V2/);
assert.doesNotMatch(simulator,/Escopo estadual:/);

const route=fs.readFileSync("app/api/controlled-beta-readiness/route.ts","utf8");
assert.match(route,/getControlledBetaAcceptance/);
assert.match(route,/ready_for_controlled_beta/);
assert.match(route,/Cache-Control/);

console.log("Stage 65 controlled beta acceptance regression passed.");
