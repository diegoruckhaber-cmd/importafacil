export type TributaryOperation = {
  valorAduaneiro: number;
  iiRate: number;
  ipiRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsRate: number;
  otherBrl?: number;
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
 */
export function calculateTributaryOperation(o: TributaryOperation): TributaryResult {
  const valorAduaneiro = nonNegative(o.valorAduaneiro);
  const other = nonNegative(o.otherBrl ?? 0);

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

  // Current baseline: PIS/Cofins-Importação base is the customs value.
  // Exceptions and legal reductions are deliberately modeled later.
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
  // must later be assembled from the destination state's legal rule set.
  const icmsRate = pct(o.icmsRate);
  const icmsPreBase = valorAduaneiro + iiValue + ipiValue + pisValue + cofinsValue + other;
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
    totalTributos,
    desembolsoTributario: totalTributos,
  };
}
