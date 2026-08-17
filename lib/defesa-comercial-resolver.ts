export type DefenseCommercialInput = {
  ncm: string;
  origin: string;
  importDate: string;
  weightKg?: number;
  exporter?: string;
};

export type DefenseCommercialResolution = {
  status: "not_applicable" | "identified" | "requires_input";
  measure?: "antidumping";
  product: string;
  ncm: string;
  origin: string;
  unit?: "USD_PER_KG";
  rateUsdPerKg?: number;
  amountBrl?: number;
  exporterTreatment: "default_other_companies" | "specific_company" | "requires_validation";
  legalFoundation: string;
  source: string;
  warnings: string[];
};

const normalize = (value: string) => value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function resolveChinaCargoTyreRate(exporter?: string) {
  const name = normalize(exporter ?? "");
  if (!name) return { rate: 2.59, treatment: "default_other_companies" as const };
  if (name.includes("shandong linglong")) return { rate: 1.05, treatment: "specific_company" as const };
  if (name.includes("triangle tyre")) return { rate: 1.07, treatment: "specific_company" as const };
  if (name.includes("zhongce rubber") || name.includes("double coin")) return { rate: 1.12, treatment: "specific_company" as const };
  if (name.includes("giti tire") || name.includes("giti tyre")) return { rate: 1.31, treatment: "specific_company" as const };
  if (name.includes("shandong bayi")) return { rate: 1.55, treatment: "specific_company" as const };
  return { rate: 1.42, treatment: "specific_company" as const };
}

/** Current official MDIC measure for cargo tyres (NCM 4011.20.90) originating in China. */
export function resolveDefenseCommercial(input: DefenseCommercialInput): DefenseCommercialResolution {
  const ncm = input.ncm.replace(/\D/g, "");
  const origin = normalize(input.origin);
  if (ncm !== "40112090" || origin !== "china") {
    return { status: "not_applicable", product: "", ncm, origin: input.origin, exporterTreatment: "requires_validation", legalFoundation: "", source: "", warnings: [] };
  }

  const weight = Number(input.weightKg);
  const exporterRate = resolveChinaCargoTyreRate(input.exporter);
  const warnings: string[] = [
    "Medida antidumping identificada para NCM 4011.20.90 originária da China.",
    "A medida está em vigor por força de revisão de final de período em curso.",
  ];
  if (!Number.isFinite(weight) || weight <= 0) warnings.push("Direito antidumping específico em US$/kg; informe o peso líquido para calcular este componente.");
  if (!input.exporter?.trim()) warnings.push("Sem produtor/exportador informado; foi usada provisoriamente a categoria residual de demais empresas (US$ 2,59/kg).");
  else if (exporterRate.treatment === "specific_company") warnings.push(`Alíquota antidumping resolvida para o produtor/exportador informado: US$ ${exporterRate.rate.toFixed(2)}/kg.`);

  return {
    status: Number.isFinite(weight) && weight > 0 ? "identified" : "requires_input",
    measure: "antidumping",
    product: "Pneus de carga",
    ncm,
    origin: input.origin,
    unit: "USD_PER_KG",
    rateUsdPerKg: exporterRate.rate,
    amountBrl: Number.isFinite(weight) && weight > 0 ? weight * exporterRate.rate : undefined,
    exporterTreatment: exporterRate.treatment,
    legalFoundation: "Resolução GECEX nº 198/2021; Resolução GECEX nº 224/2021; revisão iniciada pela Circular SECEX nº 20/2026",
    source: "MDIC/SECEX — Medidas em vigor: Pneus de carga (China)",
    warnings,
  };
}
