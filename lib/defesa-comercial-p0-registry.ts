import {
  findDefenseCommercialMeasure as findLegacyMeasure,
  listDefenseCommercialExporters as listLegacyExporters,
  resolveDefenseCommercialExporter as resolveLegacyExporter,
  normalize,
  normalizeOrigin,
  type DefenseCommercialExporterOption,
  type DefenseCommercialMeasure,
  type DefenseCommercialMeasureType,
  type DefenseCommercialUnit,
} from "./defesa-comercial-registry.ts";

type AuditedMeasure = DefenseCommercialMeasure & {
  ncmPatterns: string[];
  validUntil: string;
  sourceUrl: string;
  collectionSuspended?: boolean;
  requiresScopeValidation?: boolean;
  scopeCondition?: string;
};

const SOURCE = "MDIC/SECEX — Medidas de defesa comercial em vigor";
const CITRIC_ACID_SOURCE = "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/acido-citrico";
const CITRIC_PRICE_UNDERTAKING_CONDITION = "Há compromisso de preço vigente para parte dos produtores/exportadores da China, com preço mínimo corrigido periodicamente. Valide a empresa participante e o preço CIF aplicável no período antes de concluir o tratamento; nenhum direito é presumido automaticamente.";

// Audited against the official MDIC index/detail pages on 2026-09-11.
// This supplement closes the production coverage gap left by the historical crawler,
// which previously discarded any page whose type was not antidumping.
export const AUDITED_COUNTERVAILING_MEASURES_2026: AuditedMeasure[] = [
  {
    ncm: "73259100",
    ncmPatterns: ["73259100"],
    product: "Corpos moedores para moinho (subsídios)",
    origins: ["Índia"],
    measure: "countervailing",
    legalFoundation: "Resolução GECEX nº 741, de 30 de junho de 2025; Resolução GECEX nº 790, de 25 de setembro de 2025",
    source: SOURCE,
    sourceUrl: "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/corpos-moedores-para-moinho-subsidios",
    validityNote: "Prazo de vigência auditado: 01/07/2030.",
    validUntil: "01/07/2030",
    exportersByOrigin: {
      india: [
        { exporter: "AIA Engineering Ltd.", rate: 4.69, unit: "AD_VALOREM" },
        { exporter: "Demais", rate: 4.69, unit: "AD_VALOREM" },
      ],
    },
  },
  {
    ncm: "76061190",
    ncmPatterns: ["76061190", "76061290", "76069100", "76069200", "76071190", "76071990"],
    product: "Laminados de alumínio (subsídios)",
    origins: ["China"],
    measure: "countervailing",
    legalFoundation: "Resolução GECEX nº 431, de 20 de dezembro de 2022; Resolução GECEX nº 458, de 17 de março de 2023",
    source: SOURCE,
    sourceUrl: "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/laminados-de-aluminio",
    validityNote: "Prazo de vigência auditado: 21/12/2027. A suspensão temporária de 2022/2023 não é tratada como suspensão vigente.",
    validUntil: "21/12/2027",
    exportersByOrigin: {
      china: [
        { exporter: "Neuman (Xinhui) Alloy Materials Co., Ltd. Neuman Holding (Hong Kong) Ltd.", rate: 14.88, unit: "AD_VALOREM" },
        { exporter: "Demais", rate: 14.93, unit: "AD_VALOREM" },
      ],
    },
  },
  {
    ncm: "72193200",
    ncmPatterns: ["72193200", "72193300", "72193400", "72193500", "72202090"],
    product: "Produtos de aço inoxidável laminados a frio 304 (subsídios)",
    origins: ["Indonésia"],
    measure: "countervailing",
    legalFoundation: "Resolução GECEX nº 421, de 1º de dezembro de 2022",
    source: SOURCE,
    sourceUrl: "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/produtos-aco-laminados-frio-subsidios",
    validityNote: "Prazo de vigência auditado: 02/12/2027.",
    validUntil: "02/12/2027",
    exportersByOrigin: {
      indonesia: [{ exporter: "Todas as empresas", rate: 18.79, unit: "AD_VALOREM" }],
    },
  },
];

function optionsForOrigin(measure: AuditedMeasure, origin: string) {
  const normalized = normalizeOrigin(origin);
  const entry = Object.entries(measure.exportersByOrigin).find(([key]) => normalizeOrigin(key) === normalized);
  return entry?.[1] ?? [];
}

function findAuditedCountervailingMeasure(ncm: string, origin: string, importDate?: string) {
  const nn = ncm.replace(/\D/g, "");
  const no = normalizeOrigin(origin);
  const measure = AUDITED_COUNTERVAILING_MEASURES_2026.find((candidate) =>
    candidate.ncmPatterns.some((pattern) => pattern === nn) && candidate.origins.some((item) => normalizeOrigin(item) === no),
  );
  return measure ? { ...measure, importDate } : undefined;
}

function applyConditionalTreatments<T extends Record<string, any> | undefined>(measure: T, origin: string): T {
  if (!measure) return measure;
  const sourceUrl = String(measure.sourceUrl ?? "");
  if (sourceUrl === CITRIC_ACID_SOURCE && normalizeOrigin(origin) === "china") {
    return {
      ...measure,
      requiresScopeValidation: true,
      scopeCondition: CITRIC_PRICE_UNDERTAKING_CONDITION,
    } as T;
  }
  return measure;
}

export function findDefenseCommercialMeasure(ncm: string, origin: string, importDate?: string) {
  const audited = findAuditedCountervailingMeasure(ncm, origin, importDate);
  if (audited) return audited;
  return applyConditionalTreatments(findLegacyMeasure(ncm, origin, importDate), origin);
}

export function listDefenseCommercialExporters(ncm: string, origin: string, importDate?: string) {
  const measure = findAuditedCountervailingMeasure(ncm, origin, importDate);
  if (measure) {
    return { measure, ambiguous: false, matchingScopes: [{ product: measure.product, sourceUrl: measure.sourceUrl, legalFoundation: measure.legalFoundation, validUntil: measure.validUntil }], options: optionsForOrigin(measure, origin) };
  }
  const legacy = listLegacyExporters(ncm, origin, importDate);
  if (!legacy) return legacy;
  return { ...legacy, measure: applyConditionalTreatments(legacy.measure, origin) };
}

export function resolveDefenseCommercialExporter(ncm: string, origin: string, exporter?: string, importDate?: string) {
  const measure = findAuditedCountervailingMeasure(ncm, origin, importDate);
  if (!measure) return resolveLegacyExporter(ncm, origin, exporter, importDate);
  const options = optionsForOrigin(measure, origin);
  const target = normalize(exporter ?? "");
  if (!target) return options.find((option) => /demais|todas as empresas|todos os produtores/i.test(option.exporter)) ?? options.at(-1);
  return options.find((option) => normalize(option.exporter) === target) ?? options.find((option) => /demais|todas as empresas|todos os produtores/i.test(option.exporter));
}

export type { DefenseCommercialExporterOption, DefenseCommercialMeasure, DefenseCommercialMeasureType, DefenseCommercialUnit };
