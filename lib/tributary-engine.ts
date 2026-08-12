export type TributaryOperation = {
  valorAduaneiro: number;
  iiRate: number;
  ipiRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsRate: number;
  otherBrl?: number;
  icmsTaxableAdditionsBrl?: number;
};

export type TaxLine = {
  base: number;
  rate: number;
  calculated: number;
  due: number;
  payable: number;
};

export type CalculationTrace = {
  step: string;
  description: string;
  inputs: Record<string, number>;
  formula: string;
  result: number;
};

export type TributaryResult = {
  valorAduaneiro: number;
  ii: TaxLine;
  ipi: TaxLine;
  pisImport: TaxLine;
  cofinsImport: TaxLine;
  icms: TaxLine;
  other: number;
  icmsTaxableAdditions: number;
  totalTributos: number;
  desembolsoTributario: number;
  trace: CalculationTrace[];
};

function assertFiniteNonNegative(name: string, value: number): number {
  if (!Number.isFinite(value)) throw new Error(`${name} deve ser um número finito`);
  if (value < 0) throw new Error(`${name} não pode ser negativo`);
  return value;
}

function assertRate(name: string, value: number): number {
  assertFiniteNonNegative(name, value);
  if (value >= 100) throw new Error(`${name} deve ser inferior a 100%`);
  return value / 100;
}

function assertOperation(o: TributaryOperation): void {
  assertFiniteNonNegative('valorAduaneiro', o.valorAduaneiro);
  assertRate('iiRate', o.iiRate);
  assertRate('ipiRate', o.ipiRate);
  assertRate('pisImportRate', o.pisImportRate);
  assertRate('cofinsImportRate', o.cofinsImportRate);
  assertRate('icmsRate', o.icmsRate);
  if (o.otherBrl !== undefined) assertFiniteNonNegative('otherBrl', o.otherBrl);
  if (o.icmsTaxableAdditionsBrl !== undefined) assertFiniteNonNegative('icmsTaxableAdditionsBrl', o.icmsTaxableAdditionsBrl);
}

/**
 * First-stage arithmetic engine for import-tax calculations.
 *
 * This function deliberately does not infer legal treatment. Legislation,
 * benefits and state-specific composition must arrive as explicit inputs from
 * the rule layer. Invalid inputs fail loudly rather than silently becoming 0.
 */
export function calculateTributaryOperation(o: TributaryOperation): TributaryResult {
  assertOperation(o);

  const valorAduaneiro = o.valorAduaneiro;
  const other = o.otherBrl ?? 0;
  const icmsTaxableAdditions = o.icmsTaxableAdditionsBrl ?? 0;
  const iiRate = o.iiRate / 100;
  const ipiRate = o.ipiRate / 100;
  const pisRate = o.pisImportRate / 100;
  const cofinsRate = o.cofinsImportRate / 100;
  const icmsRate = o.icmsRate / 100;
  const trace: CalculationTrace[] = [];

  const iiValue = valorAduaneiro * iiRate;
  trace.push({ step: 'II', description: 'Imposto de Importação', inputs: { valorAduaneiro, iiRate }, formula: 'valorAduaneiro × iiRate', result: iiValue });
  const ii: TaxLine = { base: valorAduaneiro, rate: iiRate, calculated: iiValue, due: iiValue, payable: iiValue };

  const ipiBase = valorAduaneiro + iiValue;
  const ipiValue = ipiBase * ipiRate;
  trace.push({ step: 'IPI', description: 'Imposto sobre Produtos Industrializados', inputs: { ipiBase, ipiRate }, formula: 'baseIPI × ipiRate', result: ipiValue });
  const ipi: TaxLine = { base: ipiBase, rate: ipiRate, calculated: ipiValue, due: ipiValue, payable: ipiValue };

  const pisCofinsBase = valorAduaneiro;
  const pisValue = pisCofinsBase * pisRate;
  const cofinsValue = pisCofinsBase * cofinsRate;
  trace.push({ step: 'PIS', description: 'PIS-Importação (baseline)', inputs: { base: pisCofinsBase, pisRate }, formula: 'basePIS × pisRate', result: pisValue });
  trace.push({ step: 'COFINS', description: 'Cofins-Importação (baseline)', inputs: { base: pisCofinsBase, cofinsRate }, formula: 'baseCofins × cofinsRate', result: cofinsValue });
  const pisImport: TaxLine = { base: pisCofinsBase, rate: pisRate, calculated: pisValue, due: pisValue, payable: pisValue };
  const cofinsImport: TaxLine = { base: pisCofinsBase, rate: cofinsRate, calculated: cofinsValue, due: cofinsValue, payable: cofinsValue };

  const icmsPreBase = valorAduaneiro + iiValue + ipiValue + pisValue + cofinsValue + icmsTaxableAdditions;
  const icmsBase = icmsPreBase / (1 - icmsRate);
  const icmsValue = icmsBase * icmsRate;
  trace.push({ step: 'ICMS', description: 'ICMS por dentro — baseline', inputs: { icmsPreBase, icmsRate }, formula: 'icmsPreBase ÷ (1 − icmsRate) × icmsRate', result: icmsValue });
  const icms: TaxLine = { base: icmsBase, rate: icmsRate, calculated: icmsValue, due: icmsValue, payable: icmsValue };

  const totalTributos = ii.payable + ipi.payable + pisImport.payable + cofinsImport.payable + icms.payable;
  trace.push({ step: 'TOTAL', description: 'Total dos tributos', inputs: { ii: ii.payable, ipi: ipi.payable, pis: pisImport.payable, cofins: cofinsImport.payable, icms: icms.payable }, formula: 'II + IPI + PIS + COFINS + ICMS', result: totalTributos });

  return { valorAduaneiro, ii, ipi, pisImport, cofinsImport, icms, other, icmsTaxableAdditions, totalTributos, desembolsoTributario: totalTributos, trace };
}
