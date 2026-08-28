import fs from "node:fs";
import path from "node:path";
import {
  DEFENSE_COMMERCIAL_MEASURES as LEGACY_DEFENSE_COMMERCIAL_MEASURES,
  type DefenseCommercialExporterOption,
  type DefenseCommercialMeasure,
  type DefenseCommercialUnit,
} from "./defesa-comercial-catalog";

export const normalize = (value: string) =>
  value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const GENERATED_PATH = path.join(process.cwd(), "data", "defesa-comercial-mdic.json");

function loadGeneratedMeasures(): DefenseCommercialMeasure[] {
  try {
    if (!fs.existsSync(GENERATED_PATH)) return [];
    const parsed = JSON.parse(fs.readFileSync(GENERATED_PATH, "utf8"));
    return Array.isArray(parsed) ? parsed as DefenseCommercialMeasure[] : [];
  } catch {
    return [];
  }
}

const generated = loadGeneratedMeasures();
const generatedKeys = new Set(
  generated.flatMap((measure) => measure.origins.map((origin) => `${measure.ncm}|${normalize(origin)}`)),
);

export const DEFENSE_COMMERCIAL_MEASURES: DefenseCommercialMeasure[] = [
  ...generated,
  ...LEGACY_DEFENSE_COMMERCIAL_MEASURES.filter(
    (measure) => !measure.origins.some((origin) => generatedKeys.has(`${measure.ncm}|${normalize(origin)}`)),
  ),
];

export { type DefenseCommercialExporterOption, type DefenseCommercialMeasure, type DefenseCommercialUnit };

export function findDefenseCommercialMeasure(ncm: string, origin: string, importDate?: string) {
  const normalizedNcm = ncm.replace(/\D/g, "");
  const normalizedOrigin = normalize(origin);
  const candidates = DEFENSE_COMMERCIAL_MEASURES.filter(
    (candidate) => (candidate.ncm === normalizedNcm || (candidate as DefenseCommercialMeasure & { ncmVariants?: string[] }).ncmVariants?.includes(normalizedNcm)) && candidate.origins.some((item) => normalize(item) === normalizedOrigin),
  );
  if (!candidates.length) return undefined;
  const selected = [...candidates].sort((a, b) => Number(Boolean(b.exportersByOrigin[normalizedOrigin]?.length)) - Number(Boolean(a.exportersByOrigin[normalizedOrigin]?.length)))[0];
  return { ...selected, importDate };
}

export function listDefenseCommercialExporters(ncm: string, origin: string, importDate?: string) {
  const measure = findDefenseCommercialMeasure(ncm, origin, importDate);
  if (!measure) return null;
  const options = measure.exportersByOrigin[normalize(origin)] ?? [];
  return { measure, options };
}

export function resolveDefenseCommercialExporter(ncm: string, origin: string, exporter?: string, importDate?: string) {
  const result = listDefenseCommercialExporters(ncm, origin, importDate);
  if (!result) return undefined;
  const normalizedExporter = normalize(exporter ?? "");
  if (!normalizedExporter) return result.options.find((option) => /demais|todas as empresas|todos os produtores/i.test(option.exporter)) ?? result.options.at(-1);
  return result.options.find((option) => normalize(option.exporter) === normalizedExporter);
}
