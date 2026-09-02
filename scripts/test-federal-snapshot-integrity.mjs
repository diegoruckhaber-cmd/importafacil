import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const snapshotPath = path.join(root, "data", "federal", "official-snapshot-2026-07.json");
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

assert(snapshot && typeof snapshot === "object", "federal snapshot must be an object");
assert(Array.isArray(snapshot.records), "federal snapshot records must be an array");
assert(snapshot.records.length > 0, "federal snapshot must not be empty");
assert(snapshot.sources && typeof snapshot.sources === "object", "federal snapshot sources metadata is required");
assert(typeof snapshot.sources.mdic?.published === "string", "MDIC publication metadata is required");
assert(typeof snapshot.sources.rfbTipi?.updated === "string", "TIPI update metadata is required");

const seen = new Set();
for (const [index, row] of snapshot.records.entries()) {
  assert(row && typeof row === "object", `snapshot row ${index} must be an object`);
  assert.match(String(row.ncm).replace(/\D/g, ""), /^\d{8}$/, `snapshot row ${index}: NCM must have 8 digits`);
  assert(["mdic-ii", "rfb-ipi"].includes(row.sourceType), `snapshot row ${index}: unsupported sourceType`);
  assert(Number.isFinite(row.rate) && row.rate >= 0 && row.rate < 100, `snapshot row ${index}: invalid rate`);
  assert(typeof row.sheet === "string" && row.sheet.trim(), `snapshot row ${index}: sheet is required`);

  const key = `${row.sourceType}|${String(row.ncm).replace(/\D/g, "")}|${row.rate}|${row.sheet}`;
  assert(!seen.has(key), `duplicate snapshot row detected: ${key}`);
  seen.add(key);
}

const hasII = snapshot.records.some((row) => row.sourceType === "mdic-ii");
const hasIPI = snapshot.records.some((row) => row.sourceType === "rfb-ipi");
assert(hasII, "snapshot must contain II records");
assert(hasIPI, "snapshot must contain IPI records");

console.log(`federal snapshot integrity: OK (${snapshot.records.length} records)`);
