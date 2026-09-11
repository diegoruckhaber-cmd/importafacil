import assert from "node:assert/strict";
import { resolveFederalTaxesFromSnapshot } from "../lib/federal-tax-resolution.ts";

const source = { published: "2026-09-08", sourceUrl: "https://www.gov.br/mdic/" };
const tipi = { updated: "2026-02-13", sourceUrl: "https://www.gov.br/receitafederal/" };
const makeSnapshot = (records) => ({ schemaVersion: 4, publicationStatus: "test", snapshotDate: "2026-09-08", sources: { mdic: source, rfbTipi: tipi }, records });
const baseIpi = { tax: "IPI", kind: "TIPI", ncm: "12345678", rate: 5, taxTreatment: "RATE", legalBasis: "TIPI" };
const baseIi = { tax: "II", kind: "BRAZIL_APPLIED", ncm: "12345678", rate: 12, legalBasis: "Anexo II" };
const tecIi = { tax: "II", kind: "TEC", ncm: "12345678", rate: 20, legalBasis: "Anexo I" };

// Base Brazilian applied rate must beat TEC regardless of workbook/array ordering.
for (const records of [[tecIi, baseIi, baseIpi], [baseIpi, baseIi, tecIi]]) {
  const result = resolveFederalTaxesFromSnapshot({ ncm: "12345678", date: "2026-09-10" }, makeSnapshot(records));
  assert.equal(result.ii.status, "resolved");
  assert.equal(result.iiRate, 12);
  assert.equal(result.ipiRate, 5);
}

// Competing base treatments must block instead of choosing the first row.
const competingBase = resolveFederalTaxesFromSnapshot({ ncm: "12345678", date: "2026-09-10" }, makeSnapshot([
  { ...baseIi, rate: 12 }, { ...baseIi, rate: 14 }, baseIpi,
]));
assert.equal(competingBase.ii.status, "requires_input");
assert.equal(competingBase.iiRate, null);
assert.ok(competingBase.blockingIssues.includes("ii_requires_input"));

// Active unconditional temporary annex overrides the base; expired one is ignored.
const activeTemporary = { tax: "II", kind: "DCC", ncm: "12345678", rate: 18, validFrom: "2026-06-01", validTo: "2026-12-31", legalBasis: "DCC" };
const active = resolveFederalTaxesFromSnapshot({ ncm: "12345678", date: "2026-09-10" }, makeSnapshot([baseIi, baseIpi, activeTemporary]));
assert.equal(active.iiRate, 18);
assert.equal(active.ii.treatment, "DCC");
const expired = resolveFederalTaxesFromSnapshot({ ncm: "12345678", date: "2027-01-01" }, makeSnapshot([baseIi, baseIpi, activeTemporary]));
assert.equal(expired.iiRate, 12);

// Quota-conditioned rate must block while quota evidence is unknown.
const quota = { tax: "II", kind: "SUPPLY_SHORTAGE", ncm: "12345678", rate: 0, quota: 1000, quotaUnit: "Toneladas", validFrom: "2026-01-01", validTo: "2026-12-31" };
const quotaUnknown = resolveFederalTaxesFromSnapshot({ ncm: "12345678", date: "2026-09-10" }, makeSnapshot([baseIi, baseIpi, quota]));
assert.equal(quotaUnknown.ii.status, "requires_input");
assert.equal(quotaUnknown.iiRate, null);
const quotaConfirmed = resolveFederalTaxesFromSnapshot({ ncm: "12345678", date: "2026-09-10", iiQuotaConfirmed: true }, makeSnapshot([baseIi, baseIpi, quota]));
assert.equal(quotaConfirmed.iiRate, 0);
const quotaRejected = resolveFederalTaxesFromSnapshot({ ncm: "12345678", date: "2026-09-10", iiQuotaConfirmed: false }, makeSnapshot([baseIi, baseIpi, quota]));
assert.equal(quotaRejected.iiRate, 12);

// Ex-conditioned II must block without Ex and resolve only on matching evidence.
const exIi = { tax: "II", kind: "LETEC", ncm: "12345678", rate: 4, exCode: "001", validFrom: "2026-01-01", validTo: "2026-12-31" };
const exUnknown = resolveFederalTaxesFromSnapshot({ ncm: "12345678", date: "2026-09-10" }, makeSnapshot([baseIi, baseIpi, exIi]));
assert.equal(exUnknown.ii.status, "requires_input");
assert.equal(exUnknown.iiRate, null);
const exMatched = resolveFederalTaxesFromSnapshot({ ncm: "12345678", date: "2026-09-10", iiExCode: "1" }, makeSnapshot([baseIi, baseIpi, exIi]));
assert.equal(exMatched.iiRate, 4);

// Two simultaneously eligible temporary rates are a real ambiguity and must block.
const multipleTemporary = resolveFederalTaxesFromSnapshot({ ncm: "12345678", date: "2026-09-10" }, makeSnapshot([
  baseIi, baseIpi,
  { ...activeTemporary, kind: "DCC", rate: 18 },
  { ...activeTemporary, kind: "LETEC", rate: 10 },
]));
assert.equal(multipleTemporary.ii.status, "requires_input");
assert.equal(multipleTemporary.iiRate, null);

// TIPI Ex with a materially different rate must not silently fall back to the general rate.
const ipiEx = { tax: "IPI", kind: "TIPI", ncm: "12345678", rate: 0, exCode: "001", taxTreatment: "RATE", legalBasis: "TIPI Ex" };
const ipiUnknown = resolveFederalTaxesFromSnapshot({ ncm: "12345678", date: "2026-09-10" }, makeSnapshot([baseIi, baseIpi, ipiEx]));
assert.equal(ipiUnknown.ipi.status, "requires_input");
assert.equal(ipiUnknown.ipiRate, null);
const ipiMatched = resolveFederalTaxesFromSnapshot({ ncm: "12345678", date: "2026-09-10", ipiExCode: "001" }, makeSnapshot([baseIi, baseIpi, ipiEx]));
assert.equal(ipiMatched.ipiRate, 0);

// TIPI NT semantics are preserved as zero rate plus explicit treatment.
const nt = resolveFederalTaxesFromSnapshot({ ncm: "87654321", date: "2026-09-10" }, makeSnapshot([
  { tax: "II", kind: "BRAZIL_APPLIED", ncm: "87654321", rate: 0 },
  { tax: "IPI", kind: "TIPI", ncm: "87654321", rate: 0, taxTreatment: "NT" },
]));
assert.equal(nt.ipiRate, 0);
assert.equal(nt.ipi.taxTreatment, "NT");

console.log("federal authoritative resolution: OK");
