import assert from "node:assert/strict";
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

function tuple(version) {
  const match = String(version || "").match(/^(\d+)\.(\d+)\.(\d+)$/);
  assert.ok(match, `Dependency version must be an exact stable semver: ${version}`);
  return match.slice(1).map(Number);
}

function atLeast(actual, minimum) {
  const a = tuple(actual);
  const b = tuple(minimum);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] > b[index]) return true;
    if (a[index] < b[index]) return false;
  }
  return true;
}

const next = pkg.dependencies?.next;
const react = pkg.dependencies?.react;
const reactDom = pkg.dependencies?.["react-dom"];

assert.equal(atLeast(next, "16.3.3"), true, `Next.js ${next} is below the August 2026 critical-security floor 16.3.3`);
assert.equal(atLeast(react, "19.2.6"), true, `React ${react} is below the patched 19.2 security floor`);
assert.equal(reactDom, react, "react and react-dom must remain on the same pinned stable version");

console.log(`Stage 47 dependency security: OK — next ${next}, react/react-dom ${react}`);
