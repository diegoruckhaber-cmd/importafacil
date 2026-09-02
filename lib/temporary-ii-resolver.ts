import fs from "node:fs";
import path from "node:path";

export type TemporaryIIAlert = {
  ncm: string;
  temporaryRate: number;
  validFrom: string;
  validTo: string;
  legalBasis: string;
  description: string;
};

export type TemporaryIIResolution = {
  primary: TemporaryIIAlert;
  alternatives: TemporaryIIAlert[];
  hasSpecificTreatment: boolean;
  hasQuotaTreatment: boolean;
};

const TEMPORARY_II_PATH = path.join(process.cwd(), "data", "federal", "temporary-ii-alerts-2026.json");
const normalizeNcm = (value: string) => value.replace(/\D/g, "");

export function loadTemporaryIIAlerts(): TemporaryIIAlert[] {
  const data = JSON.parse(fs.readFileSync(TEMPORARY_II_PATH, "utf8"));
  if (!Array.isArray(data)) throw new Error("Catálogo de elevações temporárias do II inválido.");
  return data.filter((item): item is TemporaryIIAlert =>
    Boolean(item && typeof item.ncm === "string" && Number.isFinite(item.temporaryRate) && typeof item.validFrom === "string" && typeof item.validTo === "string")
  );
}

function isSpecificTreatment(description: string): boolean {
  return /\bEx\s*\d{3}\b/i.test(description);
}

function isQuotaTreatment(description: string): boolean {
  return /quota|subper[ií]odo|kg\b/i.test(description);
}

export function resolveTemporaryII(ncm: string, date: string, standardRate: number): TemporaryIIResolution | undefined {
  const matches = loadTemporaryIIAlerts()
    .filter((item) => normalizeNcm(item.ncm) === ncm && item.validFrom <= date && date <= item.validTo && item.temporaryRate > standardRate)
    .sort((a, b) => b.temporaryRate - a.temporaryRate);

  if (!matches.length) return undefined;

  return {
    primary: matches[0],
    alternatives: matches.slice(1),
    hasSpecificTreatment: matches.some((item) => isSpecificTreatment(item.description)),
    hasQuotaTreatment: matches.some((item) => isQuotaTreatment(item.description)),
  };
}

export function buildTemporaryIIWarning(resolution: TemporaryIIResolution, standardRate: number): string {
  const { primary, alternatives, hasSpecificTreatment, hasQuotaTreatment } = resolution;
  const conditionWarning = hasSpecificTreatment || hasQuotaTreatment
    ? " Há tratamentos específicos/condições de quota cadastrados para esta NCM; a alíquota aplicável deve ser confirmada conforme o enquadramento da mercadoria e a disponibilidade da quota."
    : "";
  const alternativesText = alternatives.length
    ? ` O catálogo possui ${alternatives.length} tratamento(s) adicional(is) para esta NCM.`
    : "";

  return `⚠️ ATENÇÃO: existe elevação temporária do II para esta NCM. Alíquota padrão: ${standardRate}%; alíquota temporária de referência: ${primary.temporaryRate}%; vigência de ${primary.validFrom} a ${primary.validTo}. O cálculo permanece pela alíquota padrão (${standardRate}%).${conditionWarning}${alternativesText} Validar a aplicação da medida antes do registro da declaração. Fundamento: ${primary.legalBasis}.`;
}
