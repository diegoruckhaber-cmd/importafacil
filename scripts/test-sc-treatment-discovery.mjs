import assert from "node:assert/strict";
import { discoverScTreatments } from "../lib/sc-treatment-discovery.ts";

const exact = discoverScTreatments({ ncm: "85438990", destination: "commercial_resale" });
assert.ok(exact.some((item) => item.id === "SC-AN3-ART10-IV-ACTIVE"), "explicit NCM regime should be discoverable");
assert.equal(exact.find((item) => item.id === "SC-AN3-ART10-IV-ACTIVE")?.confidence, "high");

const industrial = discoverScTreatments({ ncm: "32081020", destination: "industrialization" });
assert.ok(industrial.some((item) => item.id === "SC-AN3-ART10-II-INDUSTRIAL"), "industrialization regime should be discoverable");

const resale = discoverScTreatments({ ncm: "32081020", destination: "commercial_resale" });
assert.ok(resale.some((item) => item.id === "SC-AN3-ART10-III-COMMERCIAL"), "commercial regime should be discoverable");

assert.deepEqual(discoverScTreatments({ ncm: "123", destination: "commercial_resale" }), []);
console.log("SC treatment discovery: PASS");
