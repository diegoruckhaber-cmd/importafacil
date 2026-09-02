import fs from "node:fs";
import path from "node:path";

export type TemporaryIITreatmentType = "general" | "ex" | "quota";

export type TemporaryIIAlert = {
  ncm: string;
  temporaryRate: number;
  validFrom: string;
  validTo: string;
  legalBasis: string;
  description: string;
  treatmentType?: TemporaryIITreatmentType;
  exNumber?: string;
  conditionReference?: string;
};

export type TemporaryIIResolution = {
  primary: TemporaryIIAlert;
  alternatives: TemporaryIIAlert[];
  treatments: TemporaryIIAlert[];
  hasSpecificTreatment: boolean;
  hasQuotaTreatment: boolean;
};

const TEMPORARY_II_PATH = path.join(process.cwd(), "data", "federal", "temporary-ii-alerts-2026.json");
const normalizeNcm = (value: string) => value.replace(/\D/g, "");

function inferTreatmentType(item: TemporaryIIAlert): TemporaryIITreatmentType {
  if (item.treatmentType === "general" || item.treatmentType === "ex" || item.treatmentType === "quota") return item.treatmentType;
  if (/\bEx\s*\d{3}\b/i.test(item.description)) return "ex";
  if (/quota|subper[ií]odo|kg\b/i.test(item.description)) return "quota";
  return "general";
}

export function loadTemporaryIIAlerts(): TemporaryIIAlert[] {
  const data = JSON.parse(fs.readFileSync(TEMPORARY_II_PATH, "utf8"));
  if (!Array.isArray(data)) throw new Error("Catálogo de elevações temporárias do II inválido.");
  return data
    .filter((item): item is TemporaryIIAlert =>
      Boolean(item && typeof item.ncm === "string" && Number.isFinite(item.temporaryRate) && typeof item.validFrom === "string" && typeof item.validTo === "string")
    )
    .map((item) => ({ ...item, treatmentType: inferTreatmentType(item) }));
}

export function resolveTemporaryII(ncm: string, date: string, standardRate: number): TemporaryIIResolution | undefined {
  const activeTreatments = loadTemporaryIIAlerts()
    .filter((item) => normalizeNcm(item.ncm) === ncm && item.validFrom <= date && date <= item.validTo);

  if (!activeTreatments.length) return undefined;

  const elevatedGeneralTreatments = activeTreatments
    .filter((item) => item.treatmentType === "general" && item.temporaryRate > standardRate)
    .sort((a, b) => b.temporaryRate - a.temporaryRate);

  const elevatedFallbackTreatments = activeTreatments
    .filter((item) => item.temporaryRate > standardRate)
    .sort((a, b) => b.temporaryRate - a.temporaryRate);

  const primary = elevatedGeneralTreatments[0] ?? elevatedFallbackTreatments[0];
  if (!primary) return undefined;

  const treatments = [...activeTreatments].sort((a, b) => {
    const order: Record<TemporaryIITreatmentType, number> = { general: 0, ex: 1, quota: 2 };
    const typeDiff = order[inferTreatmentType(a)] - order[inferTreatmentType(b)];
    return typeDiff || b.temporaryRate - a.temporaryRate;
  });

  return {
    primary,
    alternatives: treatments.filter((item) => item !== primary),
    treatments,
    hasSpecificTreatment: treatments.some((item) => item.treatmentType === "ex"),
    hasQuotaTreatment: treatments.some((item) => item.treatmentType === "quota"),
  };
}

export function buildTemporaryIIWarning(resolution: TemporaryIIResolution, standardRate: number): string {
  const { primary, treatments, hasSpecificTreatment, hasQuotaTreatment } = resolution;
  const specificTreatments = treatments.filter((item) => item.treatmentType === "ex");
  const quotaTreatments = treatments.filter((item) => item.treatmentType === "quota");

  const details: string[] = [];
  if (hasSpecificTreatment) {
    const labels = specificTreatments.map((item) => `Ex ${item.exNumber ?? "específico"}: ${item.temporaryRate}%`).join(", ");
    details.push(`tratamento específico cadastrado (${labels})`);
  }
  if (hasQuotaTreatment) {
    const labels = quotaTreatments.map((item) => `${item.temporaryRate}%${item.conditionReference ? ` — ${item.conditionReference}` : ""}`).join(", ");
    details.push(`cota tarifária cadastrada (${labels})`);
  }

  const conditionWarning = details.length
    ? ` Há ${details.join(" e ")}. Essas alternativas não são aplicadas automaticamente; dependem do enquadramento legal e, no caso de quota, da efetiva alocação/disponibilidade.`
    : "";

  return `⚠️ ATENÇÃO: existe elevação temporária do II para esta NCM. Alíquota padrão: ${standardRate}%; alíquota temporária geral de referência: ${primary.temporaryRate}%; vigência de ${primary.validFrom} a ${primary.validTo}. O cálculo permanece pela alíquota padrão (${standardRate}%).${conditionWarning} Validar a aplicação da medida antes do registro da declaração. Fundamento: ${primary.legalBasis}.`;
}
