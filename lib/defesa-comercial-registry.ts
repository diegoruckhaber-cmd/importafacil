import fs from "node:fs";
import path from "node:path";
import { DEFENSE_COMMERCIAL_MEASURES as LEGACY_DEFENSE_COMMERCIAL_MEASURES, type DefenseCommercialExporterOption, type DefenseCommercialMeasure, type DefenseCommercialUnit } from "./defesa-comercial-catalog.ts";

const generatedData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "defesa-comercial-mdic.json"), "utf8"));
const validityAuditData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "defesa-comercial-validity-audit-2026.json"), "utf8"));

export const normalize = (value: string) => value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\*,:;]+$/g, "").trim();

const ORIGIN_ALIASES: Record<string, string> = {
  "coreia": "coreia do sul", "coréia": "coreia do sul", "coreia do sul": "coreia do sul",
  "japao": "japao", "japão": "japao", "taipé chines": "taipe chines", "taipe chines": "taipe chines",
  "eua": "estados unidos da america", "estados unidos": "estados unidos da america", "united states": "estados unidos da america", "united states of america": "estados unidos da america", "estados unidos da america": "estados unidos da america",
  "republica popular da china": "china", "da china": "china", "do reino da tailandia": "tailandia", "reino da tailandia": "tailandia", "tailandia": "tailandia",
  "da malasia": "malasia", "malasia": "malasia", "uniao europeia": "uniao europeia",
};
export const normalizeOrigin = (value: string) => ORIGIN_ALIASES[normalize(value)] ?? normalize(value);

type GeneratedMeasure = DefenseCommercialMeasure & { ncmPatterns?: string[]; ncmExclusions?: string[]; sourceUrl?: string; collectionSuspended?: boolean; validUntil?: string; importDate?: string; continuationAfterNominalExpiry?: boolean; validityAuditLegalBasis?: string };
type ValidityAuditEntry = { product: string; sourceUrl: string; nominalValidUntil: string; disposition: "continuation_review" | "renewed"; effectiveValidUntil?: string; legalBasis: string };
const generated = (Array.isArray(generatedData) ? generatedData : []) as unknown as GeneratedMeasure[];
const validityAuditEntries = (Array.isArray(validityAuditData?.entries) ? validityAuditData.entries : []) as ValidityAuditEntry[];
const validityAuditBySource = new Map(validityAuditEntries.map((entry) => [entry.sourceUrl, entry]));

const OFFICIAL_INACTIVE_ORIGINS: Record<string, string[]> = {
  "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/tubos-de-coleta-de-sangue": ["alemanha"],
  "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/laminados-planos-de-baixo-carbono-e-baixa-liga-chapas-grossas": ["africa do sul"],
  "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/pneus-de-carga": ["china"],
};

const OFFICIAL_REGRESSION_OVERRIDES: GeneratedMeasure[] = [
  {
    ncm: "23099090", ncmPatterns: ["23099090", "29224110", "29224190"], ncmExclusions: [], product: "Lisina", origins: ["China"], measure: "antidumping",
    legalFoundation: "RESOLUÇÃO GECEX Nº 923, DE 24 DE JUNHO DE 2026; RETIFICAÇÃO - RESOLUÇÃO GECEX Nº 923, DE 24 DE JUNHO DE 2026",
    source: "MDIC/SECEX — Medidas de defesa comercial em vigor", sourceUrl: "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/lisina-md",
    validityNote: "Prazo de vigência: 25/06/2031", validUntil: "25/06/2031", collectionSuspended: false,
    exportersByOrigin: { china: [
      { exporter: "Jilin Meihua Amino Acid Co., Ltd.e Xinjiang Meihua Amino Acid Co., Ltd.", rate: 78, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Ningxia Eppen Biotech Co., Ltd.; Inner Mongolia Eppen Biotech Co. Ltd.; Heilongjiang Eppen Biotech Co. Ltd.", rate: 26, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Qiqihar Longjiang Fufeng Biotechnologies Co., Ltd.", rate: 41.3, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Shouguang Golden Corn Biotechnological Co., Ltd.", rate: 54.5, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Anhui BBCA Biochemical Co., Ltd.", rate: 110, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Changchun Dahe Bio Technology Development Co., Ltd.;", rate: 110, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Dongxiao Biotechnology Co., Ltd.", rate: 110, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Hebei Changhao Biotechnology Co., Ltd.", rate: 110, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Hebei Huaheng Biological Technology Co., Ltd.", rate: 110, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Heilongjiang Wanlirunda Biotechnology Co., Ltd.", rate: 110, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Ningdu Huike Technology Co. ,Ltd.", rate: 110, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Shandong Shouguang Juneng Golden Corn Co., Ltd.", rate: 110, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Shanghai Ajinomoto Amino Acid Co., Ltd.", rate: 110, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Wuxi Jinghai Amino Acid Co., Ltd.", rate: 110, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Zhangjiagang Specom Biochemical Co., Ltd.", rate: 110, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Zhucheng Dongxiao Biotechnology Co., Ltd.", rate: 110, unit: "AD_VALOREM", collectionSuspended: false },
      { exporter: "Demais empresas chinesas", rate: 132.6, unit: "AD_VALOREM", collectionSuspended: false },
    ] },
  },
  {
    ncm: "28353920", ncmPatterns: ["28353920"], ncmExclusions: [], product: "Pirofosfato ácido de sódio (SAPP)", origins: ["Canadá", "Estados Unidos da América"], measure: "antidumping",
    legalFoundation: "Resolução CAMEX Nº 67 – DOU de 15/08/2014; Resolução GECEX no. 50 - DOU de 15/06/2020; Resolução CAMEX Nº 903, DOU de 08/06/2026; Circular SECEX Nº 40, DOU de 09/06/2026",
    source: "MDIC/SECEX — Medidas de defesa comercial em vigor", sourceUrl: "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/pirofosfato-acido-de-sodio-sapp",
    validityNote: "Prazo de vigência: 08/06/2031", validUntil: "08/06/2031", collectionSuspended: false,
    exportersByOrigin: {
      "canadá": [
        { exporter: "Innophos Canada Inc.", rate: 546.3, unit: "USD_PER_TON", collectionSuspended: false },
        { exporter: "Demais", rate: 1066.3, unit: "USD_PER_TON", collectionSuspended: false },
      ],
      "estados unidos da américa": [
        { exporter: "Innophos Inc.", rate: 418.13, unit: "USD_PER_TON", collectionSuspended: false },
        { exporter: "Prayon Inc.", rate: 734.28, unit: "USD_PER_TON", collectionSuspended: false },
        { exporter: "Demais", rate: 734.28, unit: "USD_PER_TON", collectionSuspended: false },
      ],
    },
  },
];

export const DEFENSE_COMMERCIAL_MEASURES: GeneratedMeasure[] = [
  ...generated,
  ...OFFICIAL_REGRESSION_OVERRIDES,
  ...LEGACY_DEFENSE_COMMERCIAL_MEASURES,
];
export { type DefenseCommercialExporterOption, type DefenseCommercialMeasure, type DefenseCommercialUnit };

function optionsForOrigin(measure: GeneratedMeasure, normalizedOrigin: string): DefenseCommercialExporterOption[] {
  const entry = Object.entries(measure.exportersByOrigin).find(([origin]) => normalizeOrigin(origin) === normalizedOrigin);
  return entry?.[1] ?? [];
}

function isOfficiallyInactiveOrigin(measure: GeneratedMeasure, normalizedOrigin: string) {
  if (!measure.sourceUrl) return false;
  return (OFFICIAL_INACTIVE_ORIGINS[measure.sourceUrl] ?? []).some((origin) => normalizeOrigin(origin) === normalizedOrigin);
}

function matchingMeasures(ncm: string, normalizedOrigin: string) {
  const normalizedNcm = ncm.replace(/\D/g, "");
  return DEFENSE_COMMERCIAL_MEASURES.filter((candidate) => {
    const generatedCandidate = candidate as GeneratedMeasure;
    const matchesNcm = candidate.ncm === normalizedNcm || generatedCandidate.ncmPatterns?.some((pattern) => normalizedNcm === pattern || normalizedNcm.startsWith(pattern));
    const excluded = generatedCandidate.ncmExclusions?.some((item) => item === normalizedNcm);
    return Boolean(matchesNcm && !excluded && !isOfficiallyInactiveOrigin(generatedCandidate, normalizedOrigin) && candidate.origins.some((item) => normalizeOrigin(item) === normalizedOrigin));
  });
}

function scopeIdentity(measure: GeneratedMeasure) {
  return `${normalize(measure.product)}|${measure.sourceUrl ?? normalize(measure.legalFoundation ?? "")}`;
}

function distinctScopes(candidates: GeneratedMeasure[]) {
  const hasOfficialSource = candidates.some((candidate) => Boolean(candidate.sourceUrl));
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (hasOfficialSource && !candidate.sourceUrl) return false;
    const identity = scopeIdentity(candidate);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function mergedOptions(candidates: GeneratedMeasure[], normalizedOrigin: string) {
  const seen = new Set<string>();
  const merged: DefenseCommercialExporterOption[] = [];
  for (const candidate of candidates) {
    for (const rawOption of optionsForOrigin(candidate, normalizedOrigin)) {
      const rawExporter = String(rawOption.exporter ?? "").trim();
      if (/^[0-9.,]+$/.test(rawExporter)) continue;
      const option = { ...rawOption };
      const signature = `${normalize(option.exporter)}|${option.rate}|${option.unit}|${Boolean(option.collectionSuspended)}`;
      if (seen.has(signature)) continue;
      seen.add(signature);
      merged.push(option);
    }
  }
  return merged;
}

function applyValidityAudit(measure: GeneratedMeasure): GeneratedMeasure {
  if (!measure.sourceUrl) return measure;
  const audit = validityAuditBySource.get(measure.sourceUrl);
  if (!audit) return measure;
  if (audit.disposition === "renewed" && audit.effectiveValidUntil) {
    return { ...measure, validUntil: audit.effectiveValidUntil, validityNote: `Prazo de vigência auditado: ${audit.effectiveValidUntil}`, continuationAfterNominalExpiry: false, validityAuditLegalBasis: audit.legalBasis };
  }
  return { ...measure, continuationAfterNominalExpiry: audit.disposition === "continuation_review", validityAuditLegalBasis: audit.legalBasis };
}

export function listMatchingDefenseCommercialScopes(ncm: string, origin: string) {
  const normalizedOrigin = normalizeOrigin(origin);
  return distinctScopes(matchingMeasures(ncm, normalizedOrigin)).map((candidate) => {
    const audited = applyValidityAudit(candidate);
    return { product: audited.product, legalFoundation: audited.legalFoundation, sourceUrl: audited.sourceUrl, validUntil: audited.validUntil };
  });
}

export function findDefenseCommercialMeasure(ncm: string, origin: string, importDate?: string) {
  const normalizedOrigin = normalizeOrigin(origin);
  const candidates = matchingMeasures(ncm, normalizedOrigin);
  if (!candidates.length) return undefined;
  const scopes = distinctScopes(candidates);
  const selectedPool = scopes.length ? scopes : candidates;
  const rawSelected = [...selectedPool].sort((a, b) => optionsForOrigin(b, normalizedOrigin).length - optionsForOrigin(a, normalizedOrigin).length)[0];
  const selected = applyValidityAudit(rawSelected);
  const scopeAmbiguous = scopes.length > 1;
  return {
    ...selected,
    importDate,
    scopeAmbiguous,
    matchingScopes: scopes.map((candidate) => { const audited = applyValidityAudit(candidate); return { product: audited.product, sourceUrl: audited.sourceUrl, legalFoundation: audited.legalFoundation, validUntil: audited.validUntil }; }),
    exportersByOrigin: {
      ...selected.exportersByOrigin,
      [normalizedOrigin]: scopeAmbiguous ? optionsForOrigin(selected, normalizedOrigin) : mergedOptions(candidates, normalizedOrigin),
    },
  };
}

export function listDefenseCommercialExporters(ncm: string, origin: string, importDate?: string) {
  const normalizedOrigin = normalizeOrigin(origin);
  const candidates = matchingMeasures(ncm, normalizedOrigin);
  if (!candidates.length) return null;
  const measure = findDefenseCommercialMeasure(ncm, normalizedOrigin, importDate);
  if (!measure) return null;
  const scopes = distinctScopes(candidates);
  const ambiguous = scopes.length > 1;
  return {
    measure,
    ambiguous,
    matchingScopes: scopes.map((candidate) => { const audited = applyValidityAudit(candidate); return { product: audited.product, sourceUrl: audited.sourceUrl, legalFoundation: audited.legalFoundation, validUntil: audited.validUntil }; }),
    options: ambiguous ? [] : mergedOptions(candidates, normalizedOrigin),
  };
}

export function resolveDefenseCommercialExporter(ncm: string, origin: string, exporter?: string, importDate?: string) {
  const result = listDefenseCommercialExporters(ncm, origin, importDate);
  if (!result || result.ambiguous) return undefined;
  const normalizedExporter = normalize(exporter ?? "");
  if (!normalizedExporter) return result.options.find((option) => /demais|todas as empresas|todos os produtores/i.test(option.exporter)) ?? result.options.at(-1);
  return result.options.find((option) => normalize(option.exporter) === normalizedExporter);
}
