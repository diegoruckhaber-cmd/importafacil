import { findDefenseCommercialMeasure, resolveDefenseCommercialExporter, type DefenseCommercialUnit } from "./defesa-comercial-registry.ts";

export type ExtendedDefenseCommercialUnit = DefenseCommercialUnit | "USD_PER_PAIR" | "USD_PER_SQUARE_METER";
export type DefenseCommercialInput = { ncm: string; origin: string; importDate: string; weightKg?: number; quantity?: number; areaM2?: number; exporter?: string; exchangeRate?: number; customsValueBrl?: number };
export type DefenseCommercialResolution = {
  status: "not_applicable" | "identified" | "requires_input";
  measure?: "antidumping";
  product: string;
  ncm: string;
  origin: string;
  unit?: ExtendedDefenseCommercialUnit;
  rate?: number;
  rateUsdPerKg?: number;
  amountBrl?: number;
  exporter?: string;
  exporterTreatment: "default_other_companies" | "specific_company" | "requires_validation";
  collectionSuspended?: boolean;
  legalFoundation: string;
  source: string;
  sourceUrl?: string;
  warnings: string[];
};

type GeneratedMeasureMetadata = { sourceUrl?: string; collectionSuspended?: boolean };

function calculateAmountBrl(unit: ExtendedDefenseCommercialUnit, rate: number, input: DefenseCommercialInput, exchange: number) {
  if (unit === "AD_VALOREM") {
    const customsValueBrl = Number(input.customsValueBrl);
    return Number.isFinite(customsValueBrl) && customsValueBrl > 0 ? customsValueBrl * (rate / 100) : undefined;
  }
  const quantity = Number(input.quantity);
  const weight = Number(input.weightKg);
  const areaM2 = Number(input.areaM2);
  if (unit === "USD_PER_KG") return Number.isFinite(weight) && weight > 0 ? weight * rate * exchange : undefined;
  if (unit === "USD_PER_TON") return Number.isFinite(weight) && weight > 0 ? (weight / 1000) * rate * exchange : undefined;
  if (unit === "USD_PER_THOUSAND_UNITS") return Number.isFinite(quantity) && quantity > 0 ? (quantity / 1000) * rate * exchange : undefined;
  if (unit === "USD_PER_PAIR") return Number.isFinite(quantity) && quantity > 0 ? quantity * rate * exchange : undefined;
  if (unit === "USD_PER_UNIT") return Number.isFinite(quantity) && quantity > 0 ? quantity * rate * exchange : undefined;
  if (unit === "USD_PER_SQUARE_METER") return Number.isFinite(areaM2) && areaM2 > 0 ? areaM2 * rate * exchange : undefined;
  return undefined;
}

function requirementForUnit(unit: ExtendedDefenseCommercialUnit) {
  switch (unit) {
    case "USD_PER_KG": return "informe o peso líquido para calcular este componente";
    case "USD_PER_TON": return "informe o peso líquido para calcular este componente";
    case "USD_PER_THOUSAND_UNITS": return "informe a quantidade para calcular este componente";
    case "USD_PER_PAIR": return "informe a quantidade para calcular este componente";
    case "USD_PER_UNIT": return "informe a quantidade para calcular este componente";
    case "USD_PER_SQUARE_METER": return "informe a área em m² para calcular este componente";
    case "AD_VALOREM": return "o valor aduaneiro é necessário para calcular este componente";
    default: return "informe os dados necessários para calcular este componente";
  }
}

export function resolveDefenseCommercial(input: DefenseCommercialInput): DefenseCommercialResolution {
  const ncm = input.ncm.replace(/\D/g, "");
  const measure = findDefenseCommercialMeasure(ncm, input.origin, input.importDate);
  if (!measure) return { status: "not_applicable", product: "", ncm, origin: input.origin, exporterTreatment: "requires_validation", legalFoundation: "", source: "", warnings: [] };

  const metadata = measure as typeof measure & GeneratedMeasureMetadata;
  const resolved = resolveDefenseCommercialExporter(ncm, input.origin, input.exporter, input.importDate);
  if (!resolved) {
    return {
      status: "requires_input",
      measure: measure.measure,
      product: measure.product,
      ncm,
      origin: input.origin,
      exporterTreatment: "requires_validation",
      collectionSuspended: Boolean(metadata.collectionSuspended),
      legalFoundation: measure.legalFoundation,
      source: measure.source,
      sourceUrl: metadata.sourceUrl,
      warnings: [
        `Medida antidumping identificada para NCM ${ncm} originária de ${input.origin}.`,
        measure.validityNote,
        "A medida oficial foi localizada, mas a matriz de produtor/exportador e direito aplicável não pôde ser resolvida automaticamente. O cálculo do antidumping foi bloqueado e requer validação na fonte oficial antes da conclusão da simulação.",
      ].filter(Boolean),
    };
  }

  const exchange = Number(input.exchangeRate ?? 0);
  const warnings = [`Medida antidumping identificada para NCM ${ncm} originária de ${input.origin}.`, measure.validityNote].filter(Boolean);
  const exporter = resolved;
  const isResidual = /demais|todas as empresas|todos os produtores/i.test(exporter.exporter);
  if (isResidual && !input.exporter?.trim()) warnings.push(`Sem produtor/exportador informado; foi usada provisoriamente a categoria residual (${exporter.rate} na unidade da medida).`);
  else if (isResidual) warnings.push(`O produtor/exportador informado não possui tratamento individual cadastrado; aplica-se a categoria residual (${exporter.rate} na unidade da medida).`);
  else warnings.push(`Alíquota antidumping resolvida para o produtor/exportador selecionado: ${exporter.rate} na unidade da medida.`);
  if (exporter.collectionSuspended || metadata.collectionSuspended) warnings.push("A cobrança da medida está suspensa para esta origem; o direito é identificado, mas não compõe o valor a recolher enquanto a suspensão estiver vigente.");
  if (!Number.isFinite(exchange) || exchange <= 0) warnings.push("Câmbio necessário para converter o direito antidumping de US$ para R$.");

  const unit = exporter.unit as ExtendedDefenseCommercialUnit;
  const amountCandidate = calculateAmountBrl(unit, exporter.rate, input, exchange);
  if (amountCandidate === undefined) warnings.push(`Direito antidumping com unidade ${unit}; ${requirementForUnit(unit)}.`);
  const canCalculate = amountCandidate !== undefined && (unit === "AD_VALOREM" || (Number.isFinite(exchange) && exchange > 0)) && !exporter.collectionSuspended && !metadata.collectionSuspended;

  return {
    status: canCalculate ? "identified" : "requires_input", measure: measure.measure, product: measure.product, ncm, origin: input.origin,
    unit, rate: exporter.rate, rateUsdPerKg: unit === "USD_PER_KG" ? exporter.rate : undefined, amountBrl: canCalculate ? amountCandidate : undefined,
    exporter: exporter.exporter, exporterTreatment: isResidual ? "default_other_companies" : "specific_company",
    collectionSuspended: Boolean(exporter.collectionSuspended || metadata.collectionSuspended), legalFoundation: measure.legalFoundation, source: measure.source, sourceUrl: metadata.sourceUrl, warnings,
  };
}
