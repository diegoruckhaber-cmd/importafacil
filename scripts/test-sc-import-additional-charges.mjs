import assert from "node:assert/strict";
import { resolveSCImportAdditionalCharges } from "../lib/sc-import-additional-charges.ts";

const longCourse = resolveSCImportAdditionalCharges({ freightBrl: 6600, transportMode: "maritime_long_course", declarationType: "di", additions: 1 });
assert.equal(longCourse.afrmmRate, 0.08);
assert.equal(longCourse.afrmmBrl, 528);
assert.equal(longCourse.siscomexBrl, 214.5);

const air = resolveSCImportAdditionalCharges({ freightBrl: 6600, transportMode: "air", declarationType: "di", additions: 1 });
assert.equal(air.afrmmBrl, 0);
assert.equal(air.siscomexBrl, 214.5);

const duimp = resolveSCImportAdditionalCharges({ freightBrl: 6600, transportMode: "maritime_long_course", declarationType: "duimp", additions: 1 });
assert.equal(duimp.afrmmBrl, 528);
assert.equal(duimp.siscomexBrl, 0);

console.log("SC import additional charges: OK");
