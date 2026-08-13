import assert from "node:assert/strict";
import { applySCImportBenefitToItems } from "../lib/item-sc-benefit-bridge.ts";

const tax = (icms) => ({
  icms: { base: icms / 0.17, rate: 0.17, calculated: icms, due: icms, payable: icms },
  ii: { base: 0, rate: 0, calculated: 0, due: 0, payable: 0 },
  ipi: { base: 0, rate: 0, calculated: 0, due: 0, payable: 0 },
  pisImport: { base: 0, rate: 0, calculated: 0, due: 0, payable: 0 },
  cofinsImport: { base: 0, rate: 0, calculated: 0, due: 0, payable: 0 },
  valorAduaneiro: 0,
  other: 0,
  icmsTaxableAdditions: 0,
  totalTributos: icms,
  desembolsoTributario: icms,
});

const result = applySCImportBenefitToItems([
  {
    itemId: "A",
    taxes: tax(10000),
    benefit: {
      decision: "apply",
      importDeferred: true,
      outputPresumedCredit: true,
      benefitICMS: null,
      estimatedSavings: null,
      reasons: ["TTD 409 elegível"],
      blockingIssues: [],
      source: "catalog",
    },
  },
  {
    itemId: "B",
    taxes: tax(5000),
    benefit: {
      decision: "conditional",
      importDeferred: false,
      outputPresumedCredit: false,
      benefitICMS: null,
      estimatedSavings: null,
      reasons: ["Falta validação"],
      blockingIssues: ["destination_required"],
      source: "catalog",
    },
  },
  {
    itemId: "C",
    taxes: tax(2000),
  },
]);

const a = result.items.find((item) => item.itemId === "A");
const b = result.items.find((item) => item.itemId === "B");
const c = result.items.find((item) => item.itemId === "C");

assert.equal(a.benefitImportICMS, 0);
assert.equal(a.importICMSSavings, 10000);
assert.equal(a.outputPresumedCredit, true);
assert.equal(b.benefitImportICMS, 5000);
assert.equal(b.importICMSSavings, 0);
assert.equal(c.benefitImportICMS, 2000);
assert.equal(result.totalNormalImportICMS, 17000);
assert.equal(result.totalBenefitImportICMS, 7000);
assert.equal(result.totalImportICMSSavings, 10000);
assert.equal(result.status, "conditional");
assert.equal(result.warnings.length, 1);

console.log("OK: item SC benefit bridge");
console.log(JSON.stringify(result, null, 2));
