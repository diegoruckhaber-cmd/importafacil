import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateStateActivation } from "../lib/state-activation-guard.ts";

const activation = evaluateStateActivation();
assert.equal(activation.status, "safe");
assert.equal(activation.activeUfs.length, 27);

const healthRoute = fs.readFileSync("app/api/health/route.ts", "utf8");
assert.match(healthRoute, /evaluateStateActivation/);
assert.match(healthRoute, /national_27_uf/);
assert.match(healthRoute, /activeStateCount/);
assert.match(healthRoute, /activeStateScope/);
assert.doesNotMatch(healthRoute, /stateScope:\s*["']SC["']/);

console.log("Stage 47 health observability: OK — health endpoint derives national state scope from activation guard");
