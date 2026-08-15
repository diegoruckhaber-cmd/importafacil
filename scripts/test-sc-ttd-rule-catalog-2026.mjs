import assert from "node:assert/strict";
import { resolveScTtd } from "../lib/sc-ttd-rule-catalog-2026.ts";

const commercial = resolveScTtd({ ttd: "410", destination: "COMMERCIALIZATION", ncm: "3208.10.20" });
assert.equal(commercial.eligible, true);
assert.equal(commercial.importTreatment, "DEFERRED");
assert.equal(commercial.subsequentTreatment, "PRESUMED_CREDIT");

const industrial = resolveScTtd({ ttd: "410", destination: "INDUSTRIALIZATION", ncm: "3208.10.20" });
assert.equal(industrial.eligible, false);

const ttd77 = resolveScTtd({ ttd: "77", destination: "INDUSTRIALIZATION", ncm: "3208.10.20" });
assert.equal(ttd77.eligible, true);
assert.equal(ttd77.importTreatment, "DEFERRED");

const excluded = resolveScTtd({ ttd: "409", destination: "COMMERCIALIZATION", ncm: "2710.12.49", exclusionKnown: true });
assert.equal(excluded.eligible, false);

const unknown = resolveScTtd({ ttd: "409", destination: "COMMERCIALIZATION", ncm: "" });
assert.equal(unknown.eligible, false);

console.log("SC TTD 2026 rule catalog tests: OK");
