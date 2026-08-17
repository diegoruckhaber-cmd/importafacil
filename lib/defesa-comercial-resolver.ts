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

/**
 * Current official MDIC measure for cargo tyres (NCM 4011.20.90) originating in China.
 * The measure remains in force while the sunset review is pending.
 *
 * This resolver intentionally does not make weight mandatory for the whole import.
 * If the identified measure is specific in USD/kg and weight is missing, only the
 * defense-commercial component remains pending while the ordinary tax calculation continues.
 */
export function resolveDefenseCommercial(input: DefenseCommercialInput): DefenseCommercialResolution {
  const ncm = input.ncm.replace(/\D/g, "");
  const origin = normalize(input.origin);
  const date = input.importDate;

  if (ncm !== "40112090" || origin !== "china") {
    return {
      status: "not_applicable",
      product: "",
      ncm,
      origin: input.origin,
      exporterTreatment: "requires_validation",
      legalFoundation: "",
      source: "",
      warnings: [],
    };
  }

  const weight = Number(input.weightKg);
  const warnings: string[] = [
    "Medida antidumping identificada para NCM 4011.20.90 originária da China.",
    "A medida está em vigor por força de revisão de final de período em curso.",
  ];

  // Without a producer/exporter, use the official residual category provisionally.
  // The result remains explicitly marked as provisional so a specific exporter can replace it.
  const rateUsdPerKg = 2.59;
  const exporterTreatment = input.exporter?.trim() ? "specific_company" : "default_other_companies";

  if (!Number.isFinite(weight) || weight <= 0) {
    warnings.push("Direito antidumping específico em US$/kg; informe o peso líquido para calcular este componente.");
    if (!input.exporter?.trim()) warnings.push("Sem produtor/exportador informado; foi identificada a categoria residual de demais empresas (US$ 2,59/kg) como referência provisória.");
    return {
      status: "requires_input",
      measure: "antidumping",
      product: "Pneus de carga",
      ncm,
      origin: input.origin,
      unit: "USD_PER_KG",
      rateUsdPerKg,
      exporterTreatment,
      legalFoundation: "Resolução GECEX nº 198/2021; Resolução GECEX nº 224/2021; revisão iniciada pela Circular SECEX nº 20/2026",
      source: "MDIC/SECEX — Medidas em vigor: Pneus de carga (China)",
      warnings,
    };
  }

  return {
    status: "identified",
    measure: "antidumping",
    product: "Pneus de carga",
    ncm,
    origin: input.origin,
    unit: "USD_PER_KG",
    rateUsdPerKg,
    amountBrl: weight * rateUsdPerKg,
    exporterTreatment,
    legalFoundation: "Resolução GECEX nº 198/2021; Resolução GECEX nº 224/2021; revisão iniciada pela Circular SECEX nº 20/2026",
    source: "MDIC/SECEX — Medidas em vigor: Pneus de carga (China)",
    warnings,
  };
}
