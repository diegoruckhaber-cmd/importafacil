import { resolveDefenseCommercialExporter, type DefenseCommercialUnit } from "./defesa-comercial-catalog";

export type DefenseCommercialInput = { ncm: string; origin: string; importDate: string; weightKg?: number; exporter?: string; exchangeRate?: number };
export type DefenseCommercialResolution = {
  status: "not_applicable" | "identified" | "requires_input";
  measure?: "antidumping";
  product: string;
  ncm: string;
  origin: string;
  unit?: DefenseCommercialUnit;
  rateUsdPerKg?: number;
  amountBrl?: number;
  exporter?: string;
  exporterTreatment: "default_other_companies" | "specific_company" | "requires_validation";
  collectionSuspended?: boolean;
  legalFoundation: string;
  source: string;
  warnings: string[];
};

export function resolveDefenseCommercial(input: DefenseCommercialInput): DefenseCommercialResolution {
  const ncm = input.ncm.replace(/\D/g, "");
  const resolved = resolveDefenseCommercialExporter(ncm, input.origin, input.exporter, input.importDate);
  if (!resolved) {
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
  const exchange = Number(input.exchangeRate ?? 0);
  const warnings = [
    `Medida antidumping identificada para NCM ${ncm} originária de ${input.origin}.`,
    resolved.measure.validityNote,
  ];

  const exporter = resolved;
  const isResidual = exporter.exporter.trim().toLowerCase() === "demais empresas";
  if (isResidual && !input.exporter?.trim()) {
    warnings.push(`Sem produtor/exportador informado; foi usada provisoriamente a categoria residual (${exporter.rate.toFixed(2)} US$/kg).`);
  } else if (isResidual) {
    warnings.push(`O produtor/exportador informado não possui tratamento individual cadastrado; aplica-se a categoria residual de ${exporter.rate.toFixed(2)} US$/kg.`);
  } else {
    warnings.push(`Alíquota antidumping resolvida para o produtor/exportador selecionado: ${exporter.rate.toFixed(2)} US$/kg.`);
  }

  if (exporter.collectionSuspended) {
    warnings.push("A cobrança da medida está suspensa para esta origem; o direito é identificado, mas não compõe o valor a recolher enquanto a suspensão estiver vigente.");
  }

  if (!Number.isFinite(weight) || weight <= 0) {
    warnings.push("Direito antidumping específico em US$/kg; informe o peso líquido para calcular este componente.");
  }
  if (!Number.isFinite(exchange) || exchange <= 0) {
    warnings.push("Câmbio necessário para converter o direito antidumping de US$ para R$.");
  }

  const canCalculate = Number.isFinite(weight) && weight > 0 && Number.isFinite(exchange) && exchange > 0 && !exporter.collectionSuspended;
  return {
    status: canCalculate ? "identified" : "requires_input",
    measure: "antidumping",
    product: resolved.measure.product,
    ncm,
    origin: input.origin,
    unit: exporter.unit,
    rateUsdPerKg: exporter.unit === "USD_PER_KG" ? exporter.rate : undefined,
    amountBrl: canCalculate && exporter.unit === "USD_PER_KG" ? weight * exporter.rate * exchange : undefined,
    exporter: exporter.exporter,
    exporterTreatment: isResidual ? "default_other_companies" : "specific_company",
    collectionSuspended: exporter.collectionSuspended,
    legalFoundation: resolved.measure.legalFoundation,
    source: resolved.measure.source,
    warnings,
  };
}
