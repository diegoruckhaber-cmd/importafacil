import { validateTributaryInput } from "./tributary-validation.ts";
import { resolveCofinsImport2026 } from "./federal-2026-import-rules.ts";

export type TributaryOperation = {
  valorAduaneiro: number;
  iiRate: number;
  ipiRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsRate: number;
  otherBrl?: number;
  icmsTaxableAdditionsBrl?: number;
  importDate?: `${number}-${number}-${number}`;
  cofinsReducedBenefit?: boolean;
  cofinsAdditional060?: boolean;
};

export type TaxLine = {
  base: number;
  rate: number;
  calculated: number;
  due: number;
  payable: number;
  displayRate?: number;
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
  federal2026?: { cofinsEffectiveRate: number; cofinsDisplayRate: number; cofinsRule: string };
};

const pct = (value: number) => value / 100;

export function calculateTributaryOperation(o: TributaryOperation): TributaryResult {
  const validation = validateTributaryInput(o);
  if (!validation.valid) {
    throw new Error(`Dados tributários inválidos: ${validation.issues.map((issue) => `${issue.field}: ${issue.message}`).join("; ")}`);
  }

  const valorAduaneiro = o.valorAduaneiro;
  const other = o.otherBrl ?? 0;
  const icmsTaxableAdditions = o.icmsTaxableAdditionsBrl ?? 0;

  const iiRate = pct(o.iiRate);
  const iiValue = valorAduaneiro * iiRate;
  const ii: TaxLine = { base: valorAduaneiro, rate: iiRate, calculated: iiValue, due: iiValue, payable: iiValue };

  const ipiBase = valorAduaneiro + iiValue;
  const ipiRate = pct(o.ipiRate);
  const ipiValue = ipiBase * ipiRate;
  const ipi: TaxLine = { base: ipiBase, rate: ipiRate, calculated: ipiValue, due: ipiValue, payable: ipiValue };

  const pisCofinsBase = valorAduaneiro;
  const pisRate = pct(o.pisImportRate);
  const pisValue = pisCofinsBase * pisRate;
  const pisImport: TaxLine = { base: pisCofinsBase, rate: pisRate, calculated: pisValue, due: pisValue, payable: pisValue };

  const cofinsRule = o.importDate
    ? resolveCofinsImport2026({ date: o.importDate, standardRate: o.cofinsImportRate, reducedBenefit: o.cofinsReducedBenefit, additional060: o.cofinsAdditional060 })
    : { effectiveRate: o.cofinsImportRate, displayRate: o.cofinsImportRate, reason: "standard" as const };
  const cofinsRate = pct(cofinsRule.effectiveRate);
  const cofinsValue = pisCofinsBase * cofinsRate;
  const cofinsImport: TaxLine = { base: pisCofinsBase, rate: cofinsRate, displayRate: cofinsRule.displayRate, calculated: cofinsValue, due: cofinsValue, payable: cofinsValue };

  const icmsRate = pct(o.icmsRate);
  const icmsPreBase = valorAduaneiro + iiValue + ipiValue + pisValue + cofinsValue + icmsTaxableAdditions;
  const icmsBase = icmsPreBase / (1 - icmsRate);
  const icmsValue = icmsBase * icmsRate;
  const icms: TaxLine = { base: icmsBase, rate: icmsRate, calculated: icmsValue, due: icmsValue, payable: icmsValue };

  const totalTributos = ii.payable + ipi.payable + pisImport.payable + cofinsImport.payable + icms.payable;

  return {
    valorAduaneiro, ii, ipi, pisImport, cofinsImport, icms, other, icmsTaxableAdditions,
    totalTributos, desembolsoTributario: totalTributos,
    federal2026: o.importDate ? { cofinsEffectiveRate: cofinsRule.effectiveRate, cofinsDisplayRate: cofinsRule.displayRate, cofinsRule: cofinsRule.reason } : undefined,
  };
}
