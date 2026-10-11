export type CompanyTaxRegime = "simples-nacional" | "lucro-presumido" | "lucro-real" | "nao-informado";
export type IcmsCreditTreatment = "integral" | "parcial" | "nao-creditavel" | "a-validar";

export type TaxProfile = {
  regime: CompanyTaxRegime;
  destinationUf: string;
  icmsRate: number;
  icmsCreditTreatment: IcmsCreditTreatment;
  pisCofinsCreditable: boolean | "parcial" | "a-validar";
  includeIpiInIcmsBase: boolean | "a-validar";
  icmsBaseReductionPercent?: number;
  notes?: string[];
};

export type CreditAnalysis = {
  icmsCredit: number | null;
  pisImportCredit: number | null;
  cofinsImportCredit: number | null;
  totalPotentialCredit: number | null;
  status: "calculated" | "partial" | "requires-validation";
  warnings: string[];
};

const nonNegative = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);

export function analyzeImportTaxCredits(
  tax: { icms: number; pisImport: number; cofinsImport: number },
  profile: TaxProfile,
): CreditAnalysis {
  const warnings: string[] = [];
  let status: CreditAnalysis["status"] = "calculated";
  let icmsCredit: number | null = null;
  if (profile.icmsCreditTreatment === "integral") icmsCredit = nonNegative(tax.icms);
  else if (profile.icmsCreditTreatment === "nao-creditavel") icmsCredit = 0;
  else {
    warnings.push("O crédito de ICMS depende de regra específica; não foi presumido pelo motor.");
    status = profile.icmsCreditTreatment === "parcial" ? "partial" : "requires-validation";
  }
  let pisImportCredit: number | null = null;
  let cofinsImportCredit: number | null = null;
  if (profile.pisCofinsCreditable === true) {
    pisImportCredit = nonNegative(tax.pisImport);
    cofinsImportCredit = nonNegative(tax.cofinsImport);
  } else if (profile.pisCofinsCreditable === false) {
    pisImportCredit = 0;
    cofinsImportCredit = 0;
  } else {
    warnings.push("A apropriação de créditos de PIS/Cofins-Importação precisa ser validada conforme regime, produto e utilização.");
    status = "requires-validation";
  }
  const knownCredits = [icmsCredit, pisImportCredit, cofinsImportCredit].filter((v): v is number => v !== null);
  const totalPotentialCredit = knownCredits.length === 3 ? knownCredits.reduce((sum, value) => sum + value, 0) : null;
  return { icmsCredit, pisImportCredit, cofinsImportCredit, totalPotentialCredit, status, warnings };
}


export type GoodsApplication = "commercial_resale" | "industrialization" | "use_consumption";

export type ImportTaxCredit2026Input = {
  date: string;
  regime: CompanyTaxRegime;
  application: GoodsApplication;
  icmsTaxpayer?: boolean;
  taxes: {
    icms: number;
    ipi: number;
    pisImport: number;
    cofinsImport: number;
  };
};

export type ImportTaxCredit2026Analysis = {
  regime: CompanyTaxRegime;
  application: GoodsApplication;
  icmsCredit: number | null;
  ipiCredit: number;
  pisImportCredit: number;
  cofinsImportCredit: number;
  totalRecoverableCredits: number | null;
  status: "calculated" | "requires-validation";
  warnings: string[];
  legalBasis: string[];
};

const credit = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);

/**
 * Economic-cost credit layer for the 2026 simulator.
 *
 * It never changes taxes due at customs. It only estimates recoverable credits
 * after import according to the company profile and the declared use of goods.
 * Product-specific exceptions and special tax treatments remain fail-closed.
 */
export function analyzeImportTaxCredits2026(input: ImportTaxCredit2026Input): ImportTaxCredit2026Analysis {
  const warnings: string[] = [];
  const legalBasis = [
    "Lei nº 10.865/2004, art. 15 (créditos de PIS/Cofins-Importação no regime não cumulativo)",
    "LC nº 87/1996, arts. 20 e 33, com redação da LC nº 171/2019 (crédito de ICMS e uso/consumo)",
    "RIPI/2010, arts. 9º e 226, V (importador equiparado a industrial e crédito de IPI)",
    "LC nº 123/2006, art. 23 (vedação de créditos para optantes do Simples Nacional)",
  ];

  if (input.regime === "nao-informado") {
    return {
      regime: input.regime,
      application: input.application,
      icmsCredit: null,
      ipiCredit: 0,
      pisImportCredit: 0,
      cofinsImportCredit: 0,
      totalRecoverableCredits: null,
      status: "requires-validation",
      warnings: ["Informe o regime tributário da empresa para estimar os créditos recuperáveis e o custo econômico líquido."],
      legalBasis,
    };
  }

  const resaleOrIndustrialization = input.application === "commercial_resale" || input.application === "industrialization";

  let icmsCredit: number | null = 0;
  if (input.regime === "simples-nacional") {
    icmsCredit = 0;
  } else if (input.application === "use_consumption") {
    // LC 87/1996 art. 33, I: use/consumption only from 01/01/2033.
    icmsCredit = input.date >= "2033-01-01" && input.icmsTaxpayer === true ? credit(input.taxes.icms) : 0;
    if (input.date < "2033-01-01") warnings.push("Mercadoria destinada a uso e consumo não gera crédito de ICMS antes de 01/01/2033.");
  } else if (input.icmsTaxpayer === true) {
    icmsCredit = credit(input.taxes.icms);
    warnings.push("Crédito de ICMS estimado considerando empresa contribuinte e saída subsequente compatível; restrições estaduais específicas podem alterar o aproveitamento.");
  } else if (input.icmsTaxpayer === false) {
    icmsCredit = 0;
  } else {
    icmsCredit = null;
    warnings.push("Confirme se a empresa é contribuinte do ICMS para concluir a estimativa de crédito estadual.");
  }

  const ipiCredit = input.regime !== "simples-nacional" && resaleOrIndustrialization
    ? credit(input.taxes.ipi)
    : 0;
  if (input.regime === "simples-nacional" && input.taxes.ipi > 0) {
    warnings.push("Optante do Simples Nacional paga IPI na importação, mas não apropria o crédito do imposto.");
  }
  if (input.application === "use_consumption" && input.taxes.ipi > 0) {
    warnings.push("IPI de bem destinado a uso e consumo foi mantido como custo; não foi presumido crédito de IPI.");
  }

  const pisCofinsCreditable = input.regime === "lucro-real" && resaleOrIndustrialization;
  const pisImportCredit = pisCofinsCreditable ? credit(input.taxes.pisImport) : 0;
  const cofinsImportCredit = pisCofinsCreditable ? credit(input.taxes.cofinsImport) : 0;

  if (input.regime === "lucro-real" && resaleOrIndustrialization) {
    warnings.push("Créditos de PIS/Cofins-Importação estimados pelo regime não cumulativo; regimes monofásicos, alíquota zero, isenções e demais vedações específicas da NCM devem ser validados.");
  }
  if (input.regime === "lucro-presumido") {
    warnings.push("No Lucro Presumido, PIS/Cofins são tratados como cumulativos neste pré-estudo; não foi apropriado crédito das contribuições de importação.");
  }
  if (input.regime === "simples-nacional") {
    warnings.push("No Simples Nacional, não foram apropriados créditos de ICMS, IPI, PIS ou Cofins.");
  }

  const totalRecoverableCredits = icmsCredit == null
    ? null
    : icmsCredit + ipiCredit + pisImportCredit + cofinsImportCredit;

  return {
    regime: input.regime,
    application: input.application,
    icmsCredit,
    ipiCredit,
    pisImportCredit,
    cofinsImportCredit,
    totalRecoverableCredits,
    status: totalRecoverableCredits == null ? "requires-validation" : "calculated",
    warnings,
    legalBasis,
  };
}
