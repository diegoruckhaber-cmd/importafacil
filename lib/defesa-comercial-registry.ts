import generatedData from "../data/defesa-comercial-mdic.json";
import { DEFENSE_COMMERCIAL_MEASURES as LEGACY_DEFENSE_COMMERCIAL_MEASURES, type DefenseCommercialExporterOption, type DefenseCommercialMeasure } from "./defesa-comercial-catalog";

export const normalize = (value: string) => value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\*,:;]+$/g, "").trim();

const ORIGIN_ALIASES: Record<string, string> = {
  "coreia": "coreia do sul", "coréia": "coreia do sul", "coreia do sul": "coreia do sul",
  "japao": "japao", "japão": "japao",
  "taipé chines": "taipe chines", "taipe chines": "taipe chines",
  "eua": "estados unidos da america", "estados unidos": "estados unidos da america", "united states": "estados unidos da america", "united states of america": "estados unidos da america", "estados unidos da america": "estados unidos da america",
  "republica popular da china": "china", "da china": "china", "china": "china",
  "do reino da tailandia": "tailandia", "reino da tailandia": "tailandia", "tailandia": "tailandia",
  "da malasia": "malasia", "malasia": "malasia",
  "uniao europeia": "uniao europeia", "reino unido": "reino unido",
};

export const normalizeOrigin = (value: string) => ORIGIN_ALIASES[normalize(value)] ?? normalize(value);

type GeneratedMeasure = DefenseCommercialMeasure & { ncmPatterns?: string[]; ncmExclusions?: string[]; sourceUrl?: string; collectionSuspended?: boolean };
const generated = (Array.isArray(generatedData) ? generatedData : []) as unknown as GeneratedMeasure[];

function mergeMeasures() {
  const map = new Map<string, GeneratedMeasure>();
  const add = (measure: GeneratedMeasure) => {
    const key = `${measure.ncm}|${normalize(measure.product)}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...measure, origins: [...measure.origins], exportersByOrigin: { ...measure.exportersByOrigin } });
      return;
    }
    for (const origin of measure.origins) {
      const originKey = normalizeOrigin(origin);
      const existingOrigin = existing.origins.find((item) => normalizeOrigin(item) === originKey);
      if (!existingOrigin) existing.origins.push(origin);
      const existingOptions = Object.entries(existing.exportersByOrigin).find(([item]) => normalizeOrigin(item) === originKey);
      const incomingOptions = Object.entries(measure.exportersByOrigin).find(([item]) => normalizeOrigin(item) === originKey)?.[1] ?? [];
      if (!existingOptions) existing.exportersByOrigin[origin.toLowerCase()] = incomingOptions;
      else if (!existingOptions[1].length && incomingOptions.length) existing.exportersByOrigin[existingOptions[0]] = incomingOptions;
    }
  };
  generated.forEach(add);
  LEGACY_DEFENSE_COMMERCIAL_MEASURES.forEach(add);
  return [...map.values()];
}

export const DEFENSE_COMMERCIAL_MEASURES = mergeMeasures();
export { type DefenseCommercialExporterOption, type DefenseCommercialMeasure };

function optionsForOrigin(measure: GeneratedMeasure, normalizedOrigin: string): DefenseCommercialExporterOption[] {
  const entry = Object.entries(measure.exportersByOrigin).find(([origin]) => normalizeOrigin(origin) === normalizedOrigin);
  return entry?.[1] ?? [];
}

export function findDefenseCommercialMeasure(ncm: string, origin: string, importDate?: string) {
  const normalizedNcm = ncm.replace(/\D/g, "");
  const normalizedOrigin = normalizeOrigin(origin);
  const candidates = DEFENSE_COMMERCIAL_MEASURES.filter((candidate) => {
    const generatedCandidate = candidate as GeneratedMeasure;
    const matchesNcm = candidate.ncm === normalizedNcm || generatedCandidate.ncmPatterns?.some((pattern) => normalizedNcm.startsWith(pattern));
    const excluded = generatedCandidate.ncmExclusions?.some((item) => item === normalizedNcm);
    return Boolean(matchesNcm && !excluded && candidate.origins.some((item) => normalizeOrigin(item) === normalizedOrigin));
  });
  if (!candidates.length) return undefined;
  const selected = [...candidates].sort((a, b) => optionsForOrigin(b as GeneratedMeasure, normalizedOrigin).length - optionsForOrigin(a as GeneratedMeasure, normalizedOrigin).length)[0];
  return { ...selected, importDate };
}

export function listDefenseCommercialExporters(ncm: string, origin: string, importDate?: string) {
  const normalizedOrigin = normalizeOrigin(origin);
  const measure = findDefenseCommercialMeasure(ncm, normalizedOrigin, importDate);
  if (!measure) return null;
  return { measure, options: optionsForOrigin(measure as GeneratedMeasure, normalizedOrigin) };
}

export function resolveDefenseCommercialExporter(ncm: string, origin: string, exporter?: string, importDate?: string) {
  const result = listDefenseCommercialExporters(ncm, origin, importDate);
  if (!result) return undefined;
  const normalizedExporter = normalize(exporter ?? "");
  if (!normalizedExporter) return result.options.find((option) => /demais|todas as empresas|todos os produtores/i.test(option.exporter)) ?? result.options.at(-1);
  return result.options.find((option) => normalize(option.exporter) === normalizedExporter);
}
