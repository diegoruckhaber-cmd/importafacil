import generatedData from "../data/defesa-comercial-mdic.json";
import { DEFENSE_COMMERCIAL_MEASURES as LEGACY_DEFENSE_COMMERCIAL_MEASURES, type DefenseCommercialExporterOption, type DefenseCommercialMeasure, type DefenseCommercialUnit } from "./defesa-comercial-catalog.ts";

export const normalize = (value: string) => value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\*,:;]+$/g, "").trim();

const ORIGIN_ALIASES: Record<string, string> = {
  "coreia": "coreia do sul", "coréia": "coreia do sul", "coreia do sul": "coreia do sul",
  "japao": "japao", "japão": "japao", "taipé chines": "taipe chines", "taipe chines": "taipe chines",
  "eua": "estados unidos da america", "estados unidos": "estados unidos da america", "united states": "estados unidos da america", "united states of america": "estados unidos da america", "estados unidos da america": "estados unidos da america",
  "republica popular da china": "china", "da china": "china", "do reino da tailandia": "tailandia", "reino da tailandia": "tailandia", "tailandia": "tailandia",
  "da malasia": "malasia", "malasia": "malasia", "uniao europeia": "uniao europeia",
};
export const normalizeOrigin = (value: string) => ORIGIN_ALIASES[normalize(value)] ?? normalize(value);

type GeneratedMeasure = DefenseCommercialMeasure & { ncmPatterns?: string[]; ncmExclusions?: string[]; sourceUrl?: string; collectionSuspended?: boolean; validUntil?: string };
const generated = (Array.isArray(generatedData) ? generatedData : []) as unknown as GeneratedMeasure[];

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

function matchingMeasures(ncm: string, normalizedOrigin: string) {
  const normalizedNcm = ncm.replace(/\D/g, "");
  return DEFENSE_COMMERCIAL_MEASURES.filter((candidate) => {
    const generatedCandidate = candidate as GeneratedMeasure;
    const matchesNcm = candidate.ncm === normalizedNcm || generatedCandidate.ncmPatterns?.some((pattern) => normalizedNcm === pattern || normalizedNcm.startsWith(pattern));
    const excluded = generatedCandidate.ncmExclusions?.some((item) => item === normalizedNcm);
    return Boolean(matchesNcm && !excluded && candidate.origins.some((item) => normalizeOrigin(item) === normalizedOrigin));
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

export function findDefenseCommercialMeasure(ncm: string, origin: string, importDate?: string) {
  const normalizedOrigin = normalizeOrigin(origin);
  const candidates = matchingMeasures(ncm, normalizedOrigin);
  if (!candidates.length) return undefined;
  const selected = [...candidates].sort((a, b) => optionsForOrigin(b, normalizedOrigin).length - optionsForOrigin(a, normalizedOrigin).length)[0];
  return { ...selected, importDate, exportersByOrigin: { ...selected.exportersByOrigin, [normalizedOrigin]: mergedOptions(candidates, normalizedOrigin) } };
}

export function listDefenseCommercialExporters(ncm: string, origin: string, importDate?: string) {
  const normalizedOrigin = normalizeOrigin(origin);
  const candidates = matchingMeasures(ncm, normalizedOrigin);
  if (!candidates.length) return null;
  const measure = findDefenseCommercialMeasure(ncm, normalizedOrigin, importDate);
  if (!measure) return null;
  return { measure, options: mergedOptions(candidates, normalizedOrigin) };
}

export function resolveDefenseCommercialExporter(ncm: string, origin: string, exporter?: string, importDate?: string) {
  const result = listDefenseCommercialExporters(ncm, origin, importDate);
  if (!result) return undefined;
  const normalizedExporter = normalize(exporter ?? "");
  if (!normalizedExporter) return result.options.find((option) => /demais|todas as empresas|todos os produtores/i.test(option.exporter)) ?? result.options.at(-1);
  return result.options.find((option) => normalize(option.exporter) === normalizedExporter);
}
