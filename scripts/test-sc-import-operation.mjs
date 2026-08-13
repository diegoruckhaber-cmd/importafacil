import { calculateSCImportOperation } from "../lib/sc-import-operation.ts";

const result = calculateSCImportOperation({
  quantity: 1000,
  unitFobUsd: 10,
  exchangeRate: 5.5,
  freightUsd: 1200,
  insuranceUsd: 100,
  otherBrl: 3500,
  iiRate: 12,
  ipiRate: 0,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsRate: 17,
});

if (result.valorAduaneiro !== 61600) throw new Error(JSON.stringify(result));
if (result.taxes.ii.calculated !== 7392) throw new Error(JSON.stringify(result));
if (result.taxes.icms.payable <= 0) throw new Error(JSON.stringify(result));
if (result.landedCostPerUnitBeforeBenefit <= 0) throw new Error(JSON.stringify(result));

console.log("SC import operation adapter: PASS (static assertions)");
