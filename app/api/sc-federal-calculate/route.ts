import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { calculateSCMultiItemFinalCost } from "../../../lib/sc-multi-item-final-cost-engine";
import { decideSCItem } from "../../../lib/sc-decision-engine";
import { resolveSCBenefit } from "../../../lib/sc-benefit-resolution";

type SnapshotRecord = {
  sourceType: "mdic-ii" | "rfb-ipi";
  ncm: string;
  rate: number;
  sheet: string;
};

type Snapshot = {
  sources: {
    mdic?: { published?: string };
    rfbTipi?: { updated?: string };
  };
  records: SnapshotRecord[];
};

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "federal", "official-snapshot-2026-07.json");

function normalizeNcm(value: string) {
  return value.replace(/\D/g, "");
}

function resolveRate(records: SnapshotRecord[], label: string) {
  const uniqueRates = [...new Set(records.map((record) => record.rate))];
  if (records.length === 0) throw new Error(`${label} não localizado para a NCM no snapshot oficial.`);
  if (uniqueRates.length !== 1) throw new Error(`${label} possui tratamentos com alíquotas diferentes para a NCM; aplicação automática bloqueada.`);
  return uniqueRates[0];
}

/**
 * PIS/Cofins-Importação may have NCM-specific statutory rates. Keep this
 * resolution separate from the generic federal snapshot because the current
 * snapshot contains II/IPI records only.
 *
 * Lei 10.865/2004, art. 8º: for the 40.11 tariff position the rates are
 * 2.68% for PIS/Pasep-Importação and 12.35% for Cofins-Importação.
 */
function resolveImportContributionRates(ncm: string) {
  if (ncm.startsWith("4011")) {
    return {
      pisImportRate: 2.68,
      cofinsImportRate: 12.35,
      source: "Lei nº 10.865/2004, art. 8º — posição NCM 40.11",
    };
  }

  return {
    pisImportRate: 2.1,
    cofinsImportRate: 9.65,
    source: "Lei nº 10.865/2004 — alíquotas gerais de PIS/Cofins-Importação",
  };
}

function loadFederal(ncm: string, date: string) {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8")) as Snapshot;
  const records = snapshot.records.filter((record) => normalizeNcm(record.ncm) === ncm);
  const contributions = resolveImportContributionRates(ncm);
  return {
    iiRate: resolveRate(records.filter((record) => record.sourceType === "mdic-ii"), "II"),
    ipiRate: resolveRate(records.filter((record) => record.sourceType === "rfb-ipi"), "IPI"),
    pisImportRate: contributions.pisImportRate,
    cofinsImportRate: contributions.cofinsImportRate,
    contributionSource: contributions.source,
    snapshot: {
      mdicPublished: snapshot.sources.mdic?.published ?? null,
      tipiUpdated: snapshot.sources.rfbTipi?.updated ?? null,
    },
    date,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ncm = normalizeNcm(String(body.ncm ?? ""));
    const date = String(body.date ?? "");
    const origin = String(body.origin ?? "");
    const quantity = Number(body.quantity);
    const fobUnit = Number(body.fobUnit);
    const exchange = Number(body.exchange);
    const freight = Number(body.freight);
    const insurance = Number(body.insurance);
    const storage = Number(body.storage);
    const otherBrl = Number(body.otherBrl ?? 0);
    const icms = Number(body.icms);
    const ttd = String(body.ttd ?? "none");
    const destination = body.destination === "industrialization" ? "industrialization" : "commercial_resale";
    const specialRegimeIds = Array.isArray(body.specialRegimeIds)
      ? body.specialRegimeIds.filter((value: unknown): value is string => typeof value === "string")
      : [];
    const specialRegimeContext = body.specialRegimeContext && typeof body.specialRegimeContext === "object"
      ? body.specialRegimeContext as Record<string, unknown>
      : {};

    const evidence = {
      validConcession: body.validConcession === true,
      importEntryInSC: body.importEntryInSC === true,
      sameNcmPositionAfterFractionation: body.sameNcmPositionAfterFractionation !== false,
      decree2128Prohibited: body.decree2128Prohibited === true,
      industrializationInSC: destination === "industrialization" && body.industrializationInSC === true,
    };

    if (ncm.length !== 8) throw new Error("Informe uma NCM válida com 8 dígitos.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Informe uma data de importação válida.");

    const numericInputs: Array<[string, number]> = [
      ["Quantidade", quantity],
      ["FOB unitário", fobUnit],
      ["Câmbio", exchange],
      ["Frete", freight],
      ["Seguro", insurance],
      ["Armazenagem", storage],
      ["Outras despesas", otherBrl],
      ["ICMS normal", icms],
    ];
    for (const [label, value] of numericInputs) {
      if (!Number.isFinite(value) || value < 0) throw new Error(`${label} inválido.`);
    }
    if (icms >= 100) throw new Error("ICMS deve ser inferior a 100%.");

    const federal = loadFederal(ncm, date);
    const customsValue = quantity * fobUnit * exchange;
    const itemId = "ITEM-001";
    const benefitsByItem: Record<string, ReturnType<typeof resolveSCBenefit>> = {};
    let scDecision: ReturnType<typeof decideSCItem> | null = null;

    if (["77", "409", "410"].includes(ttd) || specialRegimeIds.length > 0) {
      scDecision = decideSCItem({
        id: itemId,
        ttd: ["77", "409", "410"].includes(ttd) ? Number(ttd) as 77 | 409 | 410 : undefined,
        destination,
        validConcession: evidence.validConcession,
        importEntryInSC: evidence.importEntryInSC,
        decree2128Prohibited: evidence.decree2128Prohibited,
        sameNcmPositionAfterFractionation: evidence.sameNcmPositionAfterFractionation,
        specialRegimeIds,
        specialRegimeContext: {
          ...specialRegimeContext,
          product: {
            ...(specialRegimeContext.product as Record<string, unknown> | undefined),
            ncm,
          },
        },
      });

      if (scDecision.decision === "deny") {
        throw new Error(`Regra SC bloqueada: ${scDecision.reasons.join(" ")}`);
      }

      if (["77", "409", "410"].includes(ttd)) {
        benefitsByItem[itemId] = resolveSCBenefit({
          ttd: Number(ttd) as 77 | 409 | 410,
          destination,
          ncm,
          normalOutputICMS: 0,
          taxableOutput: true,
          industrializationInSC: evidence.industrializationInSC,
          preservesOriginalCharacteristics: evidence.sameNcmPositionAfterFractionation,
          sameNcmPosition: evidence.sameNcmPositionAfterFractionation,
          otherDeferment: false,
          paragraph23Or24: false,
          equivalentTaxableEventElection: false,
        });

        if (benefitsByItem[itemId].decision === "deny") {
          throw new Error(`TTD ${ttd} não passou na validação jurídica: ${benefitsByItem[itemId].reasons.join(" ")}`);
        }
      }
    }

    const calculation = calculateSCMultiItemFinalCost({
      items: [{
        itemId,
        customsValue,
        quantity,
        weightKg: 0,
        volumeM3: 0,
        iiRate: federal.iiRate,
        ipiRate: federal.ipiRate,
        pisImportRate: federal.pisImportRate,
        cofinsImportRate: federal.cofinsImportRate,
        icmsRate: icms,
        importDate: date as `${number}-${number}-${number}`,
        iiLegalFoundation: "MDIC official snapshot 2026-07",
      }],
      expenses: [
        { id: "FREIGHT", description: "Frete internacional", amount: freight * exchange, treatment: "customs_base", allocation: "item_value" },
        { id: "INSURANCE", description: "Seguro internacional", amount: insurance * exchange, treatment: "customs_base", allocation: "item_value" },
        { id: "STORAGE", description: "Armazenagem", amount: storage, treatment: "operational_cost", allocation: "item_value" },
        { id: "OTHER", description: "Outras despesas", amount: otherBrl, treatment: "operational_cost", allocation: "item_value" },
      ],
      benefitsByItem,
    });

    const scItem = calculation.items[0];
    const taxLines = {
      ii: { rate: scItem.taxLines.ii.rate * 100, amount: scItem.taxLines.ii.value, base: scItem.taxLines.ii.base },
      ipi: { rate: scItem.taxLines.ipi.rate * 100, amount: scItem.taxLines.ipi.value, base: scItem.taxLines.ipi.base },
      pisImport: { rate: scItem.taxLines.pisImport.rate * 100, amount: scItem.taxLines.pisImport.value, base: scItem.taxLines.pisImport.base },
      cofinsImport: { rate: scItem.taxLines.cofinsImport.rate * 100, amount: scItem.taxLines.cofinsImport.value, base: scItem.taxLines.cofinsImport.base },
      icms: { rate: scItem.taxLines.icms.rate * 100, amount: scItem.taxLines.icms.value, base: scItem.taxLines.icms.base },
    };

    return NextResponse.json({
      federal: {
        ncm,
        origin,
        ii: { rate: federal.iiRate, automatic: true },
        ipi: { rate: federal.ipiRate, automatic: true },
        pisImport: { rate: federal.pisImportRate, automatic: true, source: federal.contributionSource },
        cofinsImport: { rate: federal.cofinsImportRate, automatic: true, source: federal.contributionSource },
        snapshot: federal.snapshot,
      },
      sc: {
        ttd,
        specialRegimeIds,
        decision: scDecision?.decision ?? "normal",
        decisionReasons: scDecision?.reasons ?? ["Nenhum TTD/regime especial informado; tributação normal preservada."],
        ruleIds: scDecision?.ruleIds ?? [],
        benefitDecision: benefitsByItem[itemId]?.decision ?? "normal",
        benefitReasons: benefitsByItem[itemId]?.reasons ?? [],
        blockingIssues: [...new Set([...(scDecision?.blockingIssues ?? []), ...(benefitsByItem[itemId]?.blockingIssues ?? [])])],
        icmsNormalRate: scItem.icmsNormalRate,
        icmsImportEffectiveRate: scItem.icmsImportEffectiveRate,
        normalImportICMS: scItem.normalImportICMS,
        effectiveImportICMS: scItem.benefitImportICMS,
        importICMSSavings: scItem.importICMSSavings,
      },
      calculation: {
        ...calculation,
        items: calculation.items.map((calculatedItem) => ({ ...calculatedItem, taxLines })),
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Não foi possível calcular a operação.",
    }, { status: 400 });
  }
}
