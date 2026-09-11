import fs from "node:fs";
import path from "node:path";
import { resolveCofinsImport2026 } from "./federal-2026-import-rules.ts";
import { resolveFederalII2026 } from "./federal-ii-2026-rules.ts";
import { resolveImportContributionRates } from "./import-contribution-rates.ts";

export type FederalResolutionStatus = "resolved" | "requires_input" | "not_found";
export type FederalSnapshotRecord = {
  tax: "II" | "IPI";
  kind: string;
  ncm?: string;
  ncmPrefix?: string;
  rate: number | null;
  description?: string | null;
  exCode?: string | null;
  quota?: number | string | null;
  quotaUnit?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  legalBasis?: string | null;
  observation?: string | null;
  requiresInput?: boolean;
  sheet?: string;
  row?: number;
  taxTreatment?: "RATE" | "NT";
  scopeCondition?: string;
};
export type FederalOfficialSnapshot = {
  schemaVersion: number;
  publicationStatus: string;
  snapshotDate?: string;
  sources: {
    mdic?: { published?: string; sourceUrl?: string };
    rfbTipi?: { updated?: string; sourceUrl?: string };
  };
  records: FederalSnapshotRecord[];
};
export type FederalResolvedComponent = {
  status: FederalResolutionStatus;
  rate: number | null;
  automatic: boolean;
  treatment?: string;
  taxTreatment?: "RATE" | "NT";
  legalBasis?: string;
  source?: string;
  sourceUrl?: string;
  warnings: string[];
  candidates: Array<Pick<FederalSnapshotRecord, "kind" | "rate" | "exCode" | "quota" | "quotaUnit" | "validFrom" | "validTo" | "description" | "legalBasis">>;
};
export type FederalTaxResolution = {
  ncm?: string;
  pisImportRate: number;
  cofinsImportRate: number;
  cofinsDisplayRate: number;
  iiRate: number | null;
  ipiRate: number | null;
  automatic: { pisImport: boolean; cofinsImport: boolean; ii: boolean; ipi: boolean };
  warnings: string[];
  sources: string[];
  blockingIssues: string[];
  ii: FederalResolvedComponent;
  ipi: FederalResolvedComponent;
  pisImport: { rate: number; automatic: boolean; source: string };
  cofinsImport: { rate: number; automatic: boolean; source: string };
  snapshot: { mdicPublished: string | null; tipiUpdated: string | null };
};

export type FederalTaxResolutionInput = {
  ncm?: string;
  date: `${number}-${number}-${number}` | string;
  iiExCode?: string;
  iiQuotaConfirmed?: boolean;
  ipiExCode?: string;
  aeronauticalEligible?: boolean;
  statutoryIIRate?: number;
  reducedIIRate?: number;
  iiBenefitKind?: "none" | "reduced_rate" | "exemption" | "suspension";
  iiCoveredByLC224?: boolean;
  iiExceptionToLC224?: boolean;
  pisImportRate?: number;
  cofinsStandardRate?: number;
  cofinsReducedBenefit?: boolean;
  cofinsAdditional060?: boolean;
  ipiRate?: number;
};

const DEFAULT_SNAPSHOT_PATH = path.join(process.cwd(), "data", "federal", "official-snapshot-2026-09-08.json");
const TEMPORARY_KINDS = new Set(["SUPPLY_SHORTAGE", "LETEC", "LEBIT_BK", "WTO_CONCESSION", "DCC", "ACE14_AUTOMOTIVE"]);
let cachedSnapshot: FederalOfficialSnapshot | null = null;

const normalizeNcm = (value?: string) => String(value ?? "").replace(/\D/g, "");
const normalizeEx = (value?: string) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return /^\d+$/.test(raw) && raw.length < 3 ? raw.padStart(3, "0") : raw;
};
const activeOn = (record: FederalSnapshotRecord, date: string) => (!record.validFrom || date >= record.validFrom) && (!record.validTo || date <= record.validTo);
const compactCandidate = (record: FederalSnapshotRecord) => ({ kind: record.kind, rate: record.rate, exCode: record.exCode, quota: record.quota, quotaUnit: record.quotaUnit, validFrom: record.validFrom, validTo: record.validTo, description: record.description, legalBasis: record.legalBasis });
const uniqueRates = (records: FederalSnapshotRecord[]) => [...new Set(records.map((record) => record.rate).filter((rate): rate is number => typeof rate === "number" && Number.isFinite(rate)))];

export function loadFederalOfficialSnapshot(snapshotPath = process.env.FEDERAL_SNAPSHOT_PATH || DEFAULT_SNAPSHOT_PATH): FederalOfficialSnapshot {
  if (snapshotPath === DEFAULT_SNAPSHOT_PATH && cachedSnapshot) return cachedSnapshot;
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as FederalOfficialSnapshot;
  if (snapshot.schemaVersion < 4 || !Array.isArray(snapshot.records)) throw new Error("Snapshot federal oficial incompatível: schemaVersion 4 é obrigatório.");
  if (snapshotPath === DEFAULT_SNAPSHOT_PATH) cachedSnapshot = snapshot;
  return snapshot;
}

function component(status: FederalResolutionStatus, rate: number | null, warnings: string[], records: FederalSnapshotRecord[], options: Partial<FederalResolvedComponent> = {}): FederalResolvedComponent {
  return {
    status,
    rate,
    automatic: status === "resolved" && options.automatic !== false,
    warnings,
    candidates: records.map(compactCandidate),
    ...options,
  };
}

function resolveBaseII(records: FederalSnapshotRecord[]): FederalResolvedComponent {
  const applied = records.filter((record) => record.kind === "BRAZIL_APPLIED" && typeof record.rate === "number");
  const base = applied.length ? applied : records.filter((record) => record.kind === "TEC" && typeof record.rate === "number");
  if (!base.length) return component("not_found", null, ["II não localizado no snapshot oficial para esta NCM."], []);
  const rates = uniqueRates(base);
  if (rates.length !== 1) return component("requires_input", null, ["A tarifa-base de II possui tratamentos concorrentes no snapshot oficial; nenhuma alíquota foi escolhida por ordem de linha."], base);
  const legal = [...new Set(base.map((record) => record.legalBasis).filter(Boolean))].join("; ");
  return component("resolved", rates[0], [], base, { treatment: applied.length ? "BRAZIL_APPLIED" : "TEC", legalBasis: legal || (applied.length ? "MDIC — Anexo II" : "MDIC — Anexo I") });
}

function resolveII(snapshot: FederalOfficialSnapshot, ncm: string, date: string, input: FederalTaxResolutionInput): FederalResolvedComponent {
  const exact = snapshot.records.filter((record) => record.tax === "II" && record.ncm === ncm);
  const base = resolveBaseII(exact);
  if (base.status !== "resolved") return { ...base, source: "MDIC Tarifas Vigentes", sourceUrl: snapshot.sources.mdic?.sourceUrl };

  const aeronautical = snapshot.records.filter((record) => record.tax === "II" && record.kind === "AERONAUTICAL_SCOPE" && record.ncmPrefix && ncm.startsWith(record.ncmPrefix));
  const warnings = [...base.warnings];
  if (aeronautical.length && input.aeronauticalEligible !== false) {
    warnings.push("A NCM aparece no escopo potencial do Anexo III (setor aeronáutico). O benefício setorial não foi presumido nem transformado em alíquota; valide o enquadramento se aplicável.");
  }

  const activeSpecial = exact.filter((record) => TEMPORARY_KINDS.has(record.kind) && activeOn(record, date) && typeof record.rate === "number");
  if (!activeSpecial.length) return { ...base, warnings, source: "MDIC Tarifas Vigentes", sourceUrl: snapshot.sources.mdic?.sourceUrl };

  const eligible: FederalSnapshotRecord[] = [];
  const unresolved: FederalSnapshotRecord[] = [];
  const ex = normalizeEx(input.iiExCode);
  for (const record of activeSpecial) {
    let unresolvedCondition = false;
    if (record.exCode) {
      if (!ex) unresolvedCondition = true;
      else if (normalizeEx(record.exCode) !== ex) continue;
    }
    if (record.quota != null) {
      if (input.iiQuotaConfirmed === true) {
        // caller explicitly confirmed quota eligibility/availability
      } else if (input.iiQuotaConfirmed === false) {
        continue;
      } else unresolvedCondition = true;
    }
    if (unresolvedCondition) unresolved.push(record);
    else eligible.push(record);
  }

  const eligibleRates = uniqueRates(eligible);
  if (eligibleRates.length > 1) {
    return component("requires_input", null, ["Mais de um tratamento temporário de II está simultaneamente elegível com alíquotas diferentes. Valide o enquadramento legal antes de calcular."], eligible, { source: "MDIC Tarifas Vigentes", sourceUrl: snapshot.sources.mdic?.sourceUrl });
  }

  const chosenRate = eligibleRates.length === 1 ? eligibleRates[0] : base.rate;
  const unresolvedDifferent = unresolved.filter((record) => record.rate !== chosenRate);
  if (unresolvedDifferent.length) {
    const conditions = unresolvedDifferent.map((record) => `${record.kind}${record.exCode ? ` Ex ${record.exCode}` : ""}${record.quota != null ? ` quota ${record.quota}${record.quotaUnit ? ` ${record.quotaUnit}` : ""}` : ""}`).join("; ");
    return component("requires_input", null, [`A NCM possui tratamento temporário condicionado que pode alterar o II (${conditions}). Informe/valide Ex e quota; a tarifa-base não foi aplicada silenciosamente.`], [...eligible, ...unresolved], { source: "MDIC Tarifas Vigentes", sourceUrl: snapshot.sources.mdic?.sourceUrl });
  }

  if (eligibleRates.length === 1) {
    const chosen = eligible.filter((record) => record.rate === chosenRate);
    return component("resolved", chosenRate, warnings, chosen, {
      treatment: [...new Set(chosen.map((record) => record.kind))].join("+"),
      legalBasis: [...new Set(chosen.map((record) => record.legalBasis).filter(Boolean))].join("; ") || undefined,
      source: "MDIC Tarifas Vigentes",
      sourceUrl: snapshot.sources.mdic?.sourceUrl,
    });
  }

  return { ...base, warnings, source: "MDIC Tarifas Vigentes", sourceUrl: snapshot.sources.mdic?.sourceUrl };
}

function resolveIPI(snapshot: FederalOfficialSnapshot, ncm: string, input: FederalTaxResolutionInput): FederalResolvedComponent {
  const records = snapshot.records.filter((record) => record.tax === "IPI" && record.ncm === ncm && typeof record.rate === "number");
  if (!records.length) return component("not_found", null, ["IPI não localizado na TIPI oficial para esta NCM."], [], { source: "RFB TIPI", sourceUrl: snapshot.sources.rfbTipi?.sourceUrl });
  const base = records.filter((record) => !record.exCode);
  const exRecords = records.filter((record) => Boolean(record.exCode));
  const baseRates = uniqueRates(base);
  if (baseRates.length !== 1) return component("requires_input", null, ["A TIPI possui mais de um tratamento-base para esta NCM; nenhuma alíquota foi escolhida por ordem de linha."], base, { source: "RFB TIPI", sourceUrl: snapshot.sources.rfbTipi?.sourceUrl });

  const requestedEx = normalizeEx(input.ipiExCode);
  if (requestedEx) {
    const matched = exRecords.filter((record) => normalizeEx(record.exCode ?? "") === requestedEx);
    if (matched.length) {
      const rates = uniqueRates(matched);
      if (rates.length !== 1) return component("requires_input", null, [`O EX ${requestedEx} da TIPI possui tratamentos concorrentes.`], matched, { source: "RFB TIPI", sourceUrl: snapshot.sources.rfbTipi?.sourceUrl });
      return component("resolved", rates[0], [], matched, { treatment: `TIPI_EX_${requestedEx}`, taxTreatment: matched[0].taxTreatment, legalBasis: matched[0].legalBasis ?? undefined, source: "RFB TIPI", sourceUrl: snapshot.sources.rfbTipi?.sourceUrl });
    }
  }

  const materiallyDifferentEx = exRecords.filter((record) => record.rate !== baseRates[0] || record.taxTreatment !== base[0]?.taxTreatment);
  if (!requestedEx && materiallyDifferentEx.length) {
    return component("requires_input", null, ["A TIPI possui EX com tratamento diferente da alíquota geral desta NCM. Informe o EX aplicável ou confirme o enquadramento antes do cálculo."], records, { source: "RFB TIPI", sourceUrl: snapshot.sources.rfbTipi?.sourceUrl });
  }

  return component("resolved", baseRates[0], [], base, { treatment: "TIPI_BASE", taxTreatment: base[0]?.taxTreatment, legalBasis: base[0]?.legalBasis ?? undefined, source: "RFB TIPI", sourceUrl: snapshot.sources.rfbTipi?.sourceUrl });
}

export function resolveFederalTaxesFromSnapshot(input: FederalTaxResolutionInput, snapshot: FederalOfficialSnapshot): FederalTaxResolution {
  const ncm = normalizeNcm(input.ncm);
  const date = String(input.date);
  const sources: string[] = [];
  const blockingIssues: string[] = [];

  let ii: FederalResolvedComponent;
  if (input.statutoryIIRate != null) {
    const legacy = resolveFederalII2026({ date: date as `${number}-${number}-${number}`, statutoryRate: input.statutoryIIRate, reducedRate: input.reducedIIRate, benefitKind: input.iiBenefitKind ?? "none", coveredByLC224: input.iiCoveredByLC224, exceptionToLC224: input.iiExceptionToLC224 });
    ii = component("resolved", legacy.payableRate, legacy.warning ? [legacy.warning] : [], [], { automatic: false, treatment: "EXPLICIT_OVERRIDE", legalBasis: legacy.source, source: legacy.source });
  } else if (ncm.length === 8) {
    ii = resolveII(snapshot, ncm, date, input);
  } else {
    ii = component("not_found", null, ["II não resolvido automaticamente: informe uma NCM válida."], []);
  }

  let ipi: FederalResolvedComponent;
  if (input.ipiRate != null) ipi = component("resolved", input.ipiRate, [], [], { automatic: false, treatment: "EXPLICIT_OVERRIDE", source: "Override explícito" });
  else if (ncm.length === 8) ipi = resolveIPI(snapshot, ncm, input);
  else ipi = component("not_found", null, ["IPI não resolvido automaticamente: informe uma NCM válida."], []);

  if (ii.status !== "resolved") blockingIssues.push(`ii_${ii.status}`);
  if (ipi.status !== "resolved") blockingIssues.push(`ipi_${ipi.status}`);
  if (ii.source) sources.push(ii.source);
  if (ipi.source) sources.push(ipi.source);

  const statutoryContributions = ncm.length === 8 ? resolveImportContributionRates(ncm) : { pisImportRate: 2.1, cofinsImportRate: 9.65, source: "Lei nº 10.865/2004 — alíquotas gerais" };
  const pisImportRate = input.pisImportRate ?? statutoryContributions.pisImportRate;
  let cofinsImportRate = input.cofinsStandardRate ?? statutoryContributions.cofinsImportRate;
  let cofinsDisplayRate = Math.round(cofinsImportRate * 100) / 100;
  if (input.cofinsReducedBenefit || input.cofinsAdditional060) {
    const legacyCofins = resolveCofinsImport2026({ date: date as `${number}-${number}-${number}`, standardRate: input.cofinsStandardRate, reducedBenefit: input.cofinsReducedBenefit, additional060: input.cofinsAdditional060 });
    cofinsImportRate = legacyCofins.effectiveRate;
    cofinsDisplayRate = legacyCofins.displayRate;
  }
  sources.push(statutoryContributions.source);

  const warnings = [...ii.warnings, ...ipi.warnings];
  return {
    ncm: ncm || undefined,
    pisImportRate,
    cofinsImportRate,
    cofinsDisplayRate,
    iiRate: ii.rate,
    ipiRate: ipi.rate,
    automatic: { pisImport: input.pisImportRate == null, cofinsImport: input.cofinsStandardRate == null, ii: ii.automatic, ipi: ipi.automatic },
    warnings,
    sources: [...new Set(sources)],
    blockingIssues,
    ii,
    ipi,
    pisImport: { rate: pisImportRate, automatic: input.pisImportRate == null, source: statutoryContributions.source },
    cofinsImport: { rate: cofinsImportRate, automatic: input.cofinsStandardRate == null, source: statutoryContributions.source },
    snapshot: { mdicPublished: snapshot.sources.mdic?.published ?? null, tipiUpdated: snapshot.sources.rfbTipi?.updated ?? null },
  };
}

export function resolveFederalTaxes(input: FederalTaxResolutionInput): FederalTaxResolution {
  const needsSnapshot = input.statatoryIIRate == null || input.ipiRate == null;
  // Preserve explicit legacy/manual acceptance tests without forcing a snapshot read
  // when both II and IPI are supplied. Production automatic calculations always use the snapshot.
  if (input.statutoryIIRate != null && input.ipiRate != null) {
    const empty: FederalOfficialSnapshot = { schemaVersion: 4, publicationStatus: "manual", sources: {}, records: [] };
    return resolveFederalTaxesFromSnapshot(input, empty);
  }
  return resolveFederalTaxesFromSnapshot(input, loadFederalOfficialSnapshot());
}
