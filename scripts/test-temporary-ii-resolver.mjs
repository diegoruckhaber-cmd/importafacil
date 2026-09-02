import assert from "node:assert/strict";
import { buildTemporaryIIWarning, resolveTemporaryII } from "../lib/temporary-ii-resolver.ts";

const normal = resolveTemporaryII("28353920", "2026-09-02", 9);
assert(normal, "28353920 must resolve during its temporary measure");
assert.equal(normal.primary.temporaryRate, 17.5);
assert.equal(normal.alternatives.length, 0);
assert.match(buildTemporaryIIWarning(normal, 9), /cálculo permanece pela alíquota padrão/);

const ex = resolveTemporaryII("29054400", "2026-09-02", 7.2);
assert(ex, "29054400 must resolve during its temporary measure");
assert.equal(ex.primary.temporaryRate, 20);
assert.equal(ex.hasSpecificTreatment, true);
assert.equal(ex.alternatives.some((item) => /Ex 001/i.test(item.description)), true);
assert.match(buildTemporaryIIWarning(ex, 7.2), /tratamentos específicos/);

const expired = resolveTemporaryII("28353920", "2027-01-19", 9);
assert.equal(expired, undefined, "expired temporary measure must not resolve");

const before = resolveTemporaryII("28353920", "2026-01-18", 9);
assert.equal(before, undefined, "future temporary measure must not resolve before start date");

console.log("temporary II resolver audit: OK");
