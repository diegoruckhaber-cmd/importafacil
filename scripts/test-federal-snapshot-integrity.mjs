import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const manifestPath = path.join(root, "data", "federal", "snapshot-integrity-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
assert.equal(manifest.version, 2, "semantic snapshot manifest version 2 is required");
assert.equal(manifest.activeFederalSnapshot, "data/federal/official-snapshot-2026-09-08.json");
assert(Array.isArray(manifest.snapshots) && manifest.snapshots.length > 0, "snapshot integrity manifest must not be empty");

for (const entry of manifest.snapshots) {
  assert(typeof entry.path === "string" && entry.path.length > 0, "integrity manifest path is required");
  assert.match(String(entry.blobSha), /^[0-9a-f]{40}$/, `invalid blob SHA for ${entry.path}`);
  const actual = execFileSync("git", ["ls-tree", "HEAD", entry.path], { encoding: "utf8" }).trim().split(/\s+/)[2];
  assert.equal(actual, entry.blobSha, `snapshot changed without updating integrity manifest: ${entry.path}`);
}

const snapshotPath = path.join(root, manifest.activeFederalSnapshot);
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
assert.equal(snapshot.schemaVersion, 4, "federal snapshot schemaVersion 4 is required");
assert.equal(snapshot.snapshotDate, "2026-09-08");
assert.equal(snapshot.sources?.mdic?.published, "2026-09-08");
assert.equal(snapshot.sources?.rfbTipi?.updated, "2026-02-13");
assert(Array.isArray(snapshot.records) && snapshot.records.length > 30000, "authoritative federal snapshot coverage is unexpectedly small");
assert(snapshot.records.some((row) => row.tax === "II" && row.kind === "BRAZIL_APPLIED"), "snapshot must contain Brazilian applied II rates");
assert(snapshot.records.some((row) => row.tax === "II" && row.kind === "TEC"), "snapshot must contain TEC rows");
assert(snapshot.records.some((row) => row.tax === "II" && row.kind === "SUPPLY_SHORTAGE" && row.quota != null), "snapshot must preserve quota-conditioned II rows");
assert(snapshot.records.some((row) => row.tax === "II" && row.exCode), "snapshot must preserve II Ex selectors");
assert(snapshot.records.some((row) => row.tax === "IPI" && row.taxTreatment === "NT"), "snapshot must preserve TIPI NT semantics");
assert(snapshot.records.some((row) => row.tax === "IPI" && row.exCode), "snapshot must preserve TIPI Ex selectors");
assert(snapshot.records.some((row) => row.kind === "AERONAUTICAL_SCOPE" && row.ncmPrefix), "snapshot must preserve Anexo III scope prefixes");

const baseRowsWithQuota = snapshot.records.filter((row) => row.tax === "II" && ["TEC", "BRAZIL_APPLIED"].includes(row.kind) && row.quota != null);
assert.equal(baseRowsWithQuota.length, 0, "TEC/BRAZIL_APPLIED rows must never carry quota metadata; quota belongs only to conditioned special treatments");

for (const [index, row] of snapshot.records.entries()) {
  assert(row && typeof row === "object", `snapshot row ${index} must be an object`);
  assert(["II", "IPI"].includes(row.tax), `snapshot row ${index}: unsupported tax`);
  if (row.ncm != null) assert.match(String(row.ncm), /^\d{8}$/, `snapshot row ${index}: NCM must have 8 digits`);
  if (row.ncmPrefix != null) assert.match(String(row.ncmPrefix), /^\d{4,8}$/, `snapshot row ${index}: NCM prefix invalid`);
  if (row.rate != null) assert(Number.isFinite(row.rate) && row.rate >= 0 && row.rate <= 100, `snapshot row ${index}: invalid rate`);
}

console.log(`federal semantic snapshot integrity: OK (${snapshot.records.length} records, ${manifest.snapshots.length} pinned files)`);
