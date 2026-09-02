import type { TemporaryIIAlert, TemporaryIITreatmentType } from "./temporary-ii-resolver";

export type CatalogValidationIssue = {
  code: string;
  message: string;
  index?: number;
  ncm?: string;
};

const VALID_TYPES = new Set<TemporaryIITreatmentType>(["general", "ex", "quota"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealIsoDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function overlaps(a: TemporaryIIAlert, b: TemporaryIIAlert): boolean {
  return a.validFrom <= b.validTo && b.validFrom <= a.validTo;
}

function identity(item: TemporaryIIAlert): string {
  const type = item.treatmentType ?? "general";
  if (type === "ex") return `${type}:${item.exNumber ?? ""}`;
  if (type === "quota") return `${type}:${item.conditionReference ?? ""}`;
  return type;
}

export function validateTemporaryIICatalog(input: unknown): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  if (!Array.isArray(input)) {
    return [{ code: "CATALOG_NOT_ARRAY", message: "O catálogo de II temporário deve ser um array." }];
  }

  const validRows: Array<{ item: TemporaryIIAlert; index: number }> = [];
  const exactKeys = new Map<string, number>();

  input.forEach((raw, index) => {
    if (!raw || typeof raw !== "object") {
      issues.push({ code: "ROW_INVALID", message: `Registro ${index} não é um objeto válido.`, index });
      return;
    }

    const item = raw as Partial<TemporaryIIAlert>;
    const ncm = typeof item.ncm === "string" ? item.ncm : "";
    if (!/^\d{8}$/.test(ncm)) issues.push({ code: "NCM_INVALID", message: `NCM inválida no registro ${index}.`, index, ncm });
    if (!Number.isFinite(item.temporaryRate) || Number(item.temporaryRate) < 0 || Number(item.temporaryRate) >= 100) {
      issues.push({ code: "RATE_INVALID", message: `Alíquota temporária inválida no registro ${index}.`, index, ncm });
    }
    if (typeof item.validFrom !== "string" || !isRealIsoDate(item.validFrom)) {
      issues.push({ code: "VALID_FROM_INVALID", message: `Data inicial inválida no registro ${index}.`, index, ncm });
    }
    if (typeof item.validTo !== "string" || !isRealIsoDate(item.validTo)) {
      issues.push({ code: "VALID_TO_INVALID", message: `Data final inválida no registro ${index}.`, index, ncm });
    }
    if (typeof item.validFrom === "string" && typeof item.validTo === "string" && isRealIsoDate(item.validFrom) && isRealIsoDate(item.validTo) && item.validFrom > item.validTo) {
      issues.push({ code: "DATE_RANGE_INVALID", message: `Vigência invertida no registro ${index}.`, index, ncm });
    }
    if (typeof item.legalBasis !== "string" || !item.legalBasis.trim()) issues.push({ code: "LEGAL_BASIS_MISSING", message: `Fundamento legal ausente no registro ${index}.`, index, ncm });
    if (typeof item.description !== "string" || !item.description.trim()) issues.push({ code: "DESCRIPTION_MISSING", message: `Descrição ausente no registro ${index}.`, index, ncm });
    if (!item.treatmentType || !VALID_TYPES.has(item.treatmentType)) {
      issues.push({ code: "TREATMENT_TYPE_INVALID", message: `Tipo de tratamento inválido no registro ${index}.`, index, ncm });
    }
    if (item.treatmentType === "ex" && (typeof item.exNumber !== "string" || !/^\d{3}$/.test(item.exNumber))) {
      issues.push({ code: "EX_NUMBER_MISSING", message: `Tratamento Ex sem número de 3 dígitos no registro ${index}.`, index, ncm });
    }
    if (item.treatmentType !== "ex" && item.exNumber) {
      issues.push({ code: "EX_NUMBER_UNEXPECTED", message: `Número de Ex informado em tratamento que não é Ex no registro ${index}.`, index, ncm });
    }
    if (item.treatmentType === "quota" && (typeof item.conditionReference !== "string" || !item.conditionReference.trim())) {
      issues.push({ code: "QUOTA_REFERENCE_MISSING", message: `Tratamento de cota sem referência normativa no registro ${index}.`, index, ncm });
    }

    const structurallyValid = /^\d{8}$/.test(ncm)
      && Number.isFinite(item.temporaryRate)
      && typeof item.validFrom === "string" && isRealIsoDate(item.validFrom)
      && typeof item.validTo === "string" && isRealIsoDate(item.validTo)
      && item.validFrom <= item.validTo
      && typeof item.legalBasis === "string" && Boolean(item.legalBasis.trim())
      && typeof item.description === "string" && Boolean(item.description.trim())
      && Boolean(item.treatmentType && VALID_TYPES.has(item.treatmentType));

    if (structurallyValid) {
      const typed = item as TemporaryIIAlert;
      validRows.push({ item: typed, index });
      const key = [typed.ncm, typed.treatmentType, typed.exNumber ?? "", typed.conditionReference ?? "", typed.temporaryRate, typed.validFrom, typed.validTo, typed.legalBasis, typed.description].join("|");
      const first = exactKeys.get(key);
      if (first !== undefined) {
        issues.push({ code: "DUPLICATE_ROW", message: `Registro ${index} duplica exatamente o registro ${first}.`, index, ncm });
      } else {
        exactKeys.set(key, index);
      }
    }
  });

  for (const { item, index } of validRows) {
    if (item.treatmentType === "general") continue;
    const hasGeneral = validRows.some(({ item: candidate }) => candidate.ncm === item.ncm && candidate.treatmentType === "general" && overlaps(candidate, item));
    if (!hasGeneral) {
      issues.push({ code: "CONDITIONAL_WITHOUT_GENERAL", message: `Tratamento ${item.treatmentType} da NCM ${item.ncm} não possui regra geral sobreposta na mesma vigência.`, index, ncm: item.ncm });
    }
  }

  for (let i = 0; i < validRows.length; i += 1) {
    for (let j = i + 1; j < validRows.length; j += 1) {
      const a = validRows[i];
      const b = validRows[j];
      if (a.item.ncm !== b.item.ncm || !overlaps(a.item, b.item)) continue;

      if (a.item.treatmentType === "general" && b.item.treatmentType === "general" && a.item.temporaryRate !== b.item.temporaryRate) {
        issues.push({
          code: "CONFLICTING_GENERAL_RATES",
          message: `NCM ${a.item.ncm} possui duas regras gerais sobrepostas com alíquotas diferentes (${a.item.temporaryRate}% e ${b.item.temporaryRate}%).`,
          index: b.index,
          ncm: a.item.ncm,
        });
      }

      if (identity(a.item) === identity(b.item) && a.item.temporaryRate !== b.item.temporaryRate) {
        issues.push({
          code: "CONFLICTING_TREATMENT_RATES",
          message: `NCM ${a.item.ncm} possui tratamentos ${identity(a.item)} sobrepostos com alíquotas diferentes (${a.item.temporaryRate}% e ${b.item.temporaryRate}%).`,
          index: b.index,
          ncm: a.item.ncm,
        });
      }
    }
  }

  return issues;
}

export function assertTemporaryIICatalog(input: unknown): void {
  const issues = validateTemporaryIICatalog(input);
  if (!issues.length) return;
  const summary = issues.map((issue) => `[${issue.code}] ${issue.message}`).join("\n");
  throw new Error(`Catálogo de II temporário inconsistente:\n${summary}`);
}
