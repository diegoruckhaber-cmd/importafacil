export type TributaryOperation = {
  valorAduaneiro: number;
  iiRate: number;
  ipiRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsRate: number;
  /**
   * Operational expenses/costs that are NOT automatically taxable.
   * They are kept outside the tax bases unless a legal rule explicitly
   * identifies an amount as a taxable addition.
   */
  otherBrl?: number;
  /** Explicit additions to the ICMS base, determined by the state rule set. */
  icmsTaxableAdditionsBrl?: number;
};

export type TaxLine = {
  base: number;
  rate: number;
  calculated: number;
  due: number;
  payable: number;
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
};

const nonNegative = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);
const pct = (value: number) => nonNegative(value) / 100;

/**
 * First-stage Brazilian import-tax engine.
 *
 * Scope: ordinary ad-valorem estimate only. It intentionally does not infer
 * NCM treatment, exemptions, reductions, suspensions, specific rates,
 * antidumping, CIDE, AFRMM, ICMS-ST, state incentives or IBS/CBS.
 * Those rules must be explicit inputs in later layers.
 *
 * Important modeling rule: operational costs are NOT taxable by default.
 * A cost enters a tax base only through an explicit, legally-derived
 * "TaxableAdditions" field. This prevents port, agent, broker and other
 * operational expenses from being silently injected into ICMS.
 */
export function calculateTributaryOperation(o: TributaryOperation): TributaryResult {
  const valorAduaneiro = nonNegative(o.valorAduaneiro);
  const other = nonNegative(o.otherBrl ?? 0);
  const icmsTaxableAdditions = nonNegative(o.icmsTaxableAdditionsBrl ?? 0);

  const iiRate = pct(o.iiRate);
  const iiValue = valorAduaneiro * iiRate;
  const ii: TaxLine = {
    base: valorAduaneiro,
    rate: iiRate,
    calculated: iiValue,
    due: iiValue,
    payable: iiValue,
  };

  const ipiBase = valorAduaneiro + iiValue;
  const ipiRate = pct(o.ipiRate);
  const ipiValue = ipiBase * ipiRate;
  const ipi: TaxLine = {
    base: ipiBase,
    rate: ipiRate,
    calculated: ipiValue,
    due: ipiValue,
    payable: ipiValue,
  };

  // Baseline: PIS/Cofins-Importação calculated over customs value.
  // Legal exceptions/reductions are explicit rules in later layers.
  const pisCofinsBase = valorAduaneiro;
  const pisRate = pct(o.pisImportRate);
  const cofinsRate = pct(o.cofinsImportRate);
  const pisValue = pisCofinsBase * pisRate;
  const cofinsValue = pisCofinsBase * cofinsRate;
  const pisImport: TaxLine = {
    base: pisCofinsBase,
    rate: pisRate,
    calculated: pisValue,
    due: pisValue,
    payable: pisValue,
  };
  const cofinsImport: TaxLine = {
    base: pisCofinsBase,
    rate: cofinsRate,
    calculated: cofinsValue,
    due: cofinsValue,
    payable: cofinsValue,
  };

  // Baseline ICMS estimate: tax-inclusive calculation. The definitive base
  // is assembled by the destination state's legal rule set. Operational
  // expenses are excluded unless explicitly classified as taxable additions.
  const icmsRate = pct(o.icmsRate);
  const icmsPreBase = valorAduaneiro + iiValue + ipiValue + pisValue + cofinsValue + icmsTaxableAdditions;
  const icmsBase = icmsRate >= 1 ? 0 : icmsPreBase / (1 - icmsRate);
  const icmsValue = icmsBase * icmsRate;
  const icms: TaxLine = {
    base: icmsBase,
    rate: icmsRate,
    calculated: icmsValue,
    due: icmsValue,
    payable: icmsValue,
  };

  const totalTributos = ii.payable + ipi.payable + pisImport.payable + cofinsImport.payable + icms.payable;

  return {
    valorAduaneiro,
    ii,
    ipi,
    pisImport,
    cofinsImport,
    icms,
    other,
    icmsTaxableAdditions,
    totalTributos,
    desembolsoTributario: totalTributos,
  };
}
