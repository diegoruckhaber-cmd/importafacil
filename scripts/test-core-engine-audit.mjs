import assert from 'node:assert/strict';
import { calculateTributaryOperation } from '../lib/tributary-engine.ts';
import { calculateSCMultiItemFinalCost } from '../lib/sc-multi-item-final-cost-engine.ts';
import { resolveSCImportAdditionalCharges } from '../lib/sc-import-additional-charges.ts';

const close = (actual, expected, tolerance = 0.01, label = 'value') => {
  assert(Number.isFinite(actual), `${label} must be finite`);
  assert(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
};

// 1) Federal tax formula baseline: II on customs value, IPI on customs+II,
// PIS/COFINS on customs value, ICMS gross-up over the legally modeled pre-base.
{
  const value = 100000;
  const result = calculateTributaryOperation({
    valorAduaneiro: value,
    iiRate: 10,
    ipiRate: 5,
    pisImportRate: 2.1,
    cofinsImportRate: 9.65,
    icmsRate: 17,
  });

  const ii = 10000;
  const ipi = 5500;
  const pis = 2100;
  const cofins = 9650;
  const icmsBase = (value + ii + ipi + pis + cofins) / 0.83;
  const icms = icmsBase * 0.17;

  close(result.ii.value, ii, 0.001, 'II');
  close(result.ipi.value, ipi, 0.001, 'IPI');
  close(result.pisImport.value, pis, 0.001, 'PIS');
  close(result.cofinsImport.value, cofins, 0.001, 'COFINS');
  close(result.icms.base, icmsBase, 0.001, 'ICMS base');
  close(result.icms.value, icms, 0.001, 'ICMS');
  close(result.totalTributos, ii + ipi + pis + cofins + icms, 0.001, 'total taxes');
}

// 2) Freight + insurance are added once to the customs base and once to economic cost.
{
  const result = calculateSCMultiItemFinalCost({
    items: [{
      itemId: 'A', customsValue: 100000, quantity: 1000, weightKg: 10000, volumeM3: 0,
      iiRate: 10, ipiRate: 0, pisImportRate: 2.1, cofinsImportRate: 9.65, icmsRate: 17,
    }],
    expenses: [
      { id: 'FREIGHT', description: 'Freight', amount: 10000, treatment: 'customs_base', allocation: 'item_value' },
      { id: 'INSURANCE', description: 'Insurance', amount: 1000, treatment: 'customs_base', allocation: 'item_value' },
      { id: 'STORAGE', description: 'Storage', amount: 3500, treatment: 'operational_cost', allocation: 'item_value' },
    ],
  });

  const item = result.items[0];
  close(item.baseCustomsValue, 100000, 0.001, 'base customs value');
  close(item.allocatedCustomsBaseExpenses, 11000, 0.001, 'customs base expenses');
  close(item.effectiveCustomsValue, 111000, 0.001, 'effective customs value');
  close(item.totalAllocatedExpenses, 14500, 0.001, 'total allocated expenses');
  close(item.landedCostBeforeBenefit, 100000 + 14500 + item.normalTaxTotal, 0.001, 'landed cost composition');
  close(item.landedCostPerUnitAfterBenefit, item.landedCostAfterBenefit / 1000, 0.001, 'unit cost');
}

// 3) Import-stage deferral must only remove ICMS cash from landed cost; it cannot erase federal taxes.
{
  const benefit = {
    decision: 'apply', importDeferred: true, outputPresumedCredit: false,
    benefitICMS: null, estimatedSavings: null, reasons: ['test'], blockingIssues: [], source: 'audit',
  };
  const result = calculateSCMultiItemFinalCost({
    items: [{
      itemId: 'B', customsValue: 50000, quantity: 100, weightKg: 1000, volumeM3: 0,
      iiRate: 12, ipiRate: 5, pisImportRate: 2.1, cofinsImportRate: 9.65, icmsRate: 17,
    }],
    expenses: [],
    benefitsByItem: { B: benefit },
  });
  const item = result.items[0];
  assert(item.normalImportICMS > 0, 'normal ICMS must be positive');
  close(item.benefitImportICMS, 0, 0.001, 'deferred ICMS');
  close(item.importICMSSavings, item.normalImportICMS, 0.001, 'ICMS savings');
  close(item.normalTaxTotal - item.benefitTaxTotal, item.normalImportICMS, 0.001, 'only ICMS removed from tax cash');
  close(item.landedCostBeforeBenefit - item.landedCostAfterBenefit, item.normalImportICMS, 0.001, 'only ICMS removed from landed cost');
  assert(item.taxLines.ii.value > 0 && item.taxLines.pisImport.value > 0 && item.taxLines.cofinsImport.value > 0, 'federal taxes must remain');
}

// 4) Additional-charge rules currently parameterized by the engine.
{
  const maritimeDI = resolveSCImportAdditionalCharges({ freightBrl: 10000, transportMode: 'maritime_long_course', declarationType: 'di', additions: 1 });
  close(maritimeDI.afrmmRate, 0.08, 0.000001, 'AFRMM rate');
  close(maritimeDI.afrmmBrl, 800, 0.001, 'AFRMM');
  close(maritimeDI.siscomexBrl, 214.5, 0.001, 'Siscomex DI');

  const airDI = resolveSCImportAdditionalCharges({ freightBrl: 10000, transportMode: 'air', declarationType: 'di', additions: 2 });
  close(airDI.afrmmBrl, 0, 0.001, 'air AFRMM');
  close(airDI.siscomexBrl, 244, 0.001, 'Siscomex two additions');

  const maritimeDuimp = resolveSCImportAdditionalCharges({ freightBrl: 10000, transportMode: 'maritime_long_course', declarationType: 'duimp', additions: 1 });
  close(maritimeDuimp.afrmmBrl, 800, 0.001, 'DUIMP maritime AFRMM');
  close(maritimeDuimp.siscomexBrl, 0, 0.001, 'DUIMP legacy DI fee');
  assert(maritimeDuimp.warnings.some((warning) => /Duimp/i.test(warning)), 'DUIMP must carry a fee warning');
}

// 5) Guardrails: invalid rates must fail closed.
assert.throws(() => calculateTributaryOperation({ valorAduaneiro: 100, iiRate: -1, ipiRate: 0, pisImportRate: 0, cofinsImportRate: 0, icmsRate: 17 }), /inválidos/i);
assert.throws(() => calculateSCMultiItemFinalCost({ items: [], expenses: [] }), /pelo menos um item/i);

console.log('core engine audit OK: federal formulas, landed cost, SC deferral and import charges validated');
