export type TaxBase = "valor_aduaneiro" | "valor_aduaneiro_mais_ii" | "icms_por_dentro";

export type TributaryOperation = {
  valorAduaneiro: number;
  iiRate: number;
  ipiRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsRate: number;
  otherBrl?: number;
};

export type TributaryResult = {
  valorAduaneiro: number;
  ii: number;
  ipiBase: number;
  ipi: number;
  pisCofinsBase: number;
  pisImport: number;
  cofinsImport: number;
  icmsBase: number;
  icms: number;
  other: number;
  totalTributos: number;
  desembolsoTributario: number;
};

/**
 * Motor tributário em camada separada.
 *
 * Nesta primeira versão deliberadamente não inclui benefícios fiscais,
 * alíquotas específicas, regimes especiais, ICMS-ST ou IBS/CBS no cálculo.
 * Esses componentes entrarão como regras explícitas, nunca como ajustes
 * escondidos na fórmula.
 */
export function calculateTributaryOperation(o: TributaryOperation): TributaryResult {
  const other = Math.max(0, o.otherBrl ?? 0);
  const ii = o.valorAduaneiro * Math.max(0, o.iiRate) / 100;
  const ipiBase = o.valorAduaneiro + ii;
  const ipi = ipiBase * Math.max(0, o.ipiRate) / 100;

  // PIS/Cofins-Importação: nesta camada usamos o valor aduaneiro como base.
  // Regras específicas e exceções serão modeladas posteriormente.
  const pisCofinsBase = o.valorAduaneiro;
  const pisImport = pisCofinsBase * Math.max(0, o.pisImportRate) / 100;
  const cofinsImport = pisCofinsBase * Math.max(0, o.cofinsImportRate) / 100;

  // O ICMS é tratado como imposto "por dentro". A base definitiva deverá
  // receber as parcelas específicas da UF/operação em uma etapa posterior.
  const icmsPreBase = o.valorAduaneiro + ii + ipi + pisImport + cofinsImport + other;
  const icmsRate = Math.max(0, o.icmsRate) / 100;
  const icmsBase = icmsRate >= 1 ? 0 : icmsPreBase / (1 - icmsRate);
  const icms = icmsBase * icmsRate;

  const totalTributos = ii + ipi + pisImport + cofinsImport + icms;

  return {
    valorAduaneiro: o.valorAduaneiro,
    ii,
    ipiBase,
    ipi,
    pisCofinsBase,
    pisImport,
    cofinsImport,
    icmsBase,
    icms,
    other,
    totalTributos,
    desembolsoTributario: totalTributos,
  };
}

// Compatibilidade com a calculadora atual do MVP.
export type SimulationInput = {
  quantity:number; fobUsd:number; fx:number; freightUsd:number; insuranceUsd:number;
  otherBrl:number; ii:number; ipi:number; pis:number; cofins:number; icms:number; margin:number;
};

export function calculate(s:SimulationInput) {
  const merchandise=s.quantity*s.fobUsd*s.fx;
  const freight=s.freightUsd*s.fx;
  const insurance=s.insuranceUsd*s.fx;
  const cif=merchandise+freight+insurance;
  const tax=calculateTributaryOperation({
    valorAduaneiro:cif,
    iiRate:s.ii,
    ipiRate:s.ipi,
    pisImportRate:s.pis,
    cofinsImportRate:s.cofins,
    icmsRate:s.icms,
    otherBrl:s.otherBrl,
  });
  const total=cif+s.otherBrl+tax.totalTributos;
  const unit=total/s.quantity;
  const salePrice=s.margin>=100 ? 0 : unit/(1-s.margin/100);
  return {
    merchandise, freight, insurance, cif,
    ii:tax.ii, ipi:tax.ipi, pis:tax.pisImport, cofins:tax.cofinsImport,
    icms:tax.icms, other:s.otherBrl, total, unit, salePrice,
    estimatedProfit:(salePrice*s.quantity)-total
  };
}
