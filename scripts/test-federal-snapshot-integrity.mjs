import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const snapshotPath = path.join(root, "data", "federal", "official-snapshot-2026-07.json");
const manifestPath = path.join(root, "data", "federal", "snapshot-integrity-manifest.json");
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

assert(snapshot && typeof snapshot === "object", "federal snapshot must be an object");
assert(Array.isArray(snapshot.records), "federal snapshot records must be an array");
assert(snapshot.records.length > 0, "federal snapshot must not be empty");
assert(snapshot.sources && typeof snapshot.sources === "object", "federal snapshot sources metadata is required");
assert(typeof snapshot.sources.mdic?.published === "string", "MDIC publication metadata is required");
assert(typeof snapshot.sources.rfbTipi?.updated === "string", "TIPI update metadata is required");
assert(Array.isArray(manifest.snapshots) && manifest.snapshots.length > 0, "snapshot integrity manifest must not be empty");

for (const entry of manifest.snapshots) {
  assert(typeof entry.path === "string" && entry.path.length > 0, "integrity manifest path is required");
  assert.match(String(entry.blobSha), /^[0-9a-f]{40}$/, `invalid blob SHA for ${entry.path}`);
  const actual = execFileSync("git", ["ls-tree", "HEAD", entry.path], { encoding: "utf8" }).trim().split(/\s+/)[2];
  assert.equal(actual, entry.blobSha, `snapshot changed without updating integrity manifest: ${entry.path}`);
}

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

assert(snapshot.records.some((row) => row.sourceType === "mdic-ii"), "snapshot must contain II records");
assert(snapshot.records.some((row) => row.sourceType === "rfb-ipi"), "snapshot must contain IPI records");

console.log(`federal snapshot integrity: OK (${snapshot.records.length} records, ${manifest.snapshots.length} pinned files)`);
