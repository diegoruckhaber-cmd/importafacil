export type ScImportTaxBaseInputs = {
  customsMerchandiseValue: number;
  importDuty: number;
  ipi: number;
  exchangeTax: number;
  customsTaxesFeesExpenses: number;
};

export type ScImportTaxBaseResult = {
  nonIcsmComponents: number;
  icmsRate: number;
  icmsBase: number;
  icmsDue: number;
};

/**
 * SC ICMS-importation base: Lei 10.297/1996, art. 10, V.
 * The state base includes the import value, II, IPI, IOF/exchange tax,
 * other taxes/fees/contributions and customs expenses, plus the ICMS itself.
 * Therefore the arithmetic is tax-inclusive ("por dentro").
 *
 * This function only performs arithmetic. Which components are legally due
 * in a specific operation must be resolved by the applicable rule set first.
 */
export function calculateScImportIcmsBase(input: ScImportTaxBaseInputs): ScImportTaxBaseResult {
  const values = [
    input.customsMerchandiseValue,
    input.importDuty,
    input.ipi,
    input.exchangeTax,
    input.customsTaxesFeesExpenses,
  ];
  if (values.some(v => !Number.isFinite(v) || v < 0)) {
    throw new Error('Componentes da base do ICMS-importação devem ser números finitos e não negativos.');
  }
  if (!Number.isFinite(input.icmsRate) || input.icmsRate <= 0 || input.icmsRate >= 100) {
    throw new Error('A alíquota do ICMS deve estar entre 0% e 100%.');
  }
  const rate = input.icmsRate / 100;
  const nonIcsmComponents = values.reduce((sum, value) => sum + value, 0);
  const icmsBase = nonIcsmComponents / (1 - rate);
  const icmsDue = icmsBase * rate;
  return { nonIcsmComponents, icmsRate: input.icmsRate, icmsBase, icmsDue };
}
