import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { validateTemporaryIICatalog } from "../lib/temporary-ii-catalog-validator.ts";

const catalogPath = path.join(process.cwd(), "data", "federal", "temporary-ii-alerts-2026.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

const currentIssues = validateTemporaryIICatalog(catalog);
assert.deepEqual(currentIssues, [], `Current temporary-II catalog must be internally consistent.\n${JSON.stringify(currentIssues, null, 2)}`);

function expectIssue(rows, code) {
  const issues = validateTemporaryIICatalog(rows);
  assert(issues.some((issue) => issue.code === code), `Expected ${code}, got ${JSON.stringify(issues)}`);
}

const general = {
  ncm: "99999999",
  temporaryRate: 25,
  validFrom: "2026-01-01",
  validTo: "2026-12-31",
  legalBasis: "Resolução teste",
  description: "Regra geral",
  treatmentType: "general",
};

expectIssue([{ ...general, ncm: "999" }], "NCM_INVALID");
expectIssue([{ ...general, temporaryRate: 100 }], "RATE_INVALID");
expectIssue([{ ...general, validFrom: "2026-02-30" }], "VALID_FROM_INVALID");
expectIssue([{ ...general, validFrom: "2026-12-31", validTo: "2026-01-01" }], "DATE_RANGE_INVALID");
expectIssue([{ ...general, treatmentType: "ex" }], "EX_NUMBER_MISSING");
expectIssue([{ ...general, treatmentType: "quota" }], "QUOTA_REFERENCE_MISSING");
expectIssue([
  { ...general },
  { ...general },
], "DUPLICATE_ROW");
expectIssue([
  { ...general, treatmentType: "quota", conditionReference: "Portaria teste", temporaryRate: 10 },
], "CONDITIONAL_WITHOUT_GENERAL");
expectIssue([
  { ...general },
  { ...general, temporaryRate: 30, legalBasis: "Resolução teste 2" },
], "CONFLICTING_GENERAL_RATES");
expectIssue([
  { ...general },
  { ...general, treatmentType: "ex", exNumber: "001", temporaryRate: 12 },
  { ...general, treatmentType: "ex", exNumber: "001", temporaryRate: 14, legalBasis: "Resolução teste 2" },
], "CONFLICTING_TREATMENT_RATES");

console.log(`temporary II catalog integrity audit: OK (${catalog.length} rows validated)`);
