import generatedData from "../data/defesa-comercial-mdic.json";
import { DEFENSE_COMMERCIAL_MEASURES as LEGACY_DEFENSE_COMMERCIAL_MEASURES, type DefenseCommercialExporterOption, type DefenseCommercialMeasure, type DefenseCommercialUnit } from "./defesa-comercial-catalog";

export const normalize = (value: string) => value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const ORIGIN_ALIASES: Record<string, string> = {
  "estados unidos": "estados unidos da america",
  "eua": "estados unidos da america",
  "usa": "estados unidos da america",
  "united states": "estados unidos da america",
  "united states of america": "estados unidos da america",
};

export const normalizeOrigin = (value: string) => {
  const normalized = normalize(value);
  return ORIGIN_ALIASES[normalized] ?? normalized;
};

type GeneratedMeasure = DefenseCommercialMeasure & { ncmPatterns?: string[]; ncmExclusions?: string[]; sourceUrl?: string; collectionSuspended?: boolean };
const generated = (Array.isArray(generatedData) ? generatedData : []) as unknown as GeneratedMeasure[];
const generatedKeys = new Set(generated.flatMap((measure) => measure.origins.map((origin) => `${measure.ncm}|${normalizeOrigin(origin)}`)));
export const DEFENSE_COMMERCIAL_MEASURES: GeneratedMeasure[] = [...generated, ...LEGACY_DEFENSE_COMMERCIAL_MEASURES.filter((measure) => !measure.origins.some((origin) => generatedKeys.has(`${measure.ncm}|${normalizeOrigin(origin)}`)))];
export { type DefenseCommercialExporterOption, type DefenseCommercialMeasure, type DefenseCommercialUnit };

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
  const selected = [...candidates].sort((a, b) => Number(Boolean(optionsForOrigin(b, normalizedOrigin).length)) - Number(Boolean(optionsForOrigin(a, normalizedOrigin).length)))[0];
  return { ...selected, importDate };
}

export function listDefenseCommercialExporters(ncm: string, origin: string, importDate?: string) {
  const normalizedOrigin = normalizeOrigin(origin);
  const measure = findDefenseCommercialMeasure(ncm, normalizedOrigin, importDate);
  if (!measure) return null;
  return { measure, options: optionsForOrigin(measure, normalizedOrigin) };
}

export function resolveDefenseCommercialExporter(ncm: string, origin: string, exporter?: string, importDate?: string) {
  const result = listDefenseCommercialExporters(ncm, origin, importDate);
  if (!result) return undefined;
  const normalizedExporter = normalize(exporter ?? "");
  if (!normalizedExporter) return result.options.find((option) => /demais|todas as empresas|todos os produtores/i.test(option.exporter)) ?? result.options.at(-1);
  return result.options.find((option) => normalize(option.exporter) === normalizedExporter);
}
