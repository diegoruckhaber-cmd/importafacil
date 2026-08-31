import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { calculateSCMultiItemFinalCost } from "../../../lib/sc-multi-item-final-cost-engine";
import { decideSCItem } from "../../../lib/sc-decision-engine";
import { resolveSCBenefit } from "../../../lib/sc-benefit-resolution";
import { resolveImportContributionRates } from "../../../lib/import-contribution-rates";
import { resolveDefenseCommercial } from "../../../lib/defesa-comercial-resolver";
import { resolveSCImportAdditionalCharges, type ImportDeclarationType, type ImportTransportMode } from "../../../lib/sc-import-additional-charges";

type SnapshotRecord = { sourceType: "mdic-ii" | "rfb-ipi"; ncm: string; rate: number; sheet: string };
type Snapshot = { sources: { published?: string; mdic?: { published?: string }; rfbTipi?: { updated?: string } }; records: SnapshotRecord[] };
const SNAPSHOT_PATH = path.join(process.cwd(), "data", "federal", "official-snapshot-2026-07.json");
const normalizeNcm = (value: string) => value.replace(/\D/g, "");

function resolveRate(records: SnapshotRecord[], label: string) {
  if (!records.length) throw new Error(`${label} não localizado para a NCM no snapshot oficial.`);
  const uniqueRates = [...new Set(records.map((record) => record.rate))];
  return {
    rate: uniqueRates[0],
    warning: uniqueRates.length > 1
      ? `${label} possui mais de um tratamento no snapshot oficial; a primeira alíquota do snapshot foi utilizada como referência e a operação continua calculável.`
      : undefined,
  };
}

function loadFederal(ncm: string, date: string) {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8")) as Snapshot;
  const records = snapshot.records.filter((record) => normalizeNcm(record.ncm) === ncm);
  const contributions = resolveImportContributionRates(ncm);
  const ii = resolveRate(records.filter((record) => record.sourceType === "mdic-ii"), "II");
  const ipi = resolveRate(records.filter((record) => record.sourceType === "rfb-ipi"), "IPI");
  return {
    iiRate: ii.rate,
    ipiRate: ipi.rate,
    pisImportRate: contributions.pisImportRate,
    cofinsImportRate: contributions.cofinsImportRate,
    contributionSource: contributions.source,
    warnings: [ii.warning, ipi.warning].filter((value): value is string => Boolean(value)),
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
    const weightKg = Number(body.weightKg ?? 0);
    const fobUnit = Number(body.fobUnit);
    const exchange = Number(body.exchange);
    const freight = Number(body.freight);
    const insurance = Number(body.insurance);
    const storage = Number(body.storage);
    const otherBrl = Number(body.otherBrl ?? 0);
    const icms = Number(body.icms);
    const ttd = String(body.ttd ?? "none");
    const destination = body.destination === "industrialization" ? "industrialization" : "commercial_resale";
    const transportMode = String(body.transportMode ?? "not_informed") as ImportTransportMode;
    const declarationType = (body.declarationType === "duimp" ? "duimp" : "di") as ImportDeclarationType;
    const specialRegimeIds = Array.isArray(body.specialRegimeIds) ? body.specialRegimeIds.filter((value: unknown): value is string => typeof value === "string") : [];
    const specialRegimeContext = body.specialRegimeContext && typeof body.specialRegimeContext === "object" ? body.specialRegimeContext as Record<string, unknown> : {};
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
      ["Quantidade", quantity], ["Peso líquido", weightKg], ["FOB unitário", fobUnit], ["Câmbio", exchange],
      ["Frete", freight], ["Seguro", insurance], ["Armazenagem", storage], ["Outras despesas", otherBrl], ["ICMS normal", icms],
    ];
    for (const [label, value] of numericInputs) if (!Number.isFinite(value) || value < 0) throw new Error(`${label} inválido.`);
    if (icms >= 100) throw new Error("ICMS deve ser inferior a 100%.");

    const federal = loadFederal(ncm, date);
    const merchandiseValueBrl = quantity * fobUnit * exchange;
    // The engine adds freight and insurance as customs-base expenses exactly once.
    // Keeping the item's base as FOB preserves the correct customs value = FOB + freight + insurance.
    const customsValue = merchandiseValueBrl;
    const customsValueForDefense = merchandiseValueBrl + freight * exchange + insurance * exchange;
    const itemId = "ITEM-001";
    const defense = resolveDefenseCommercial({
      ncm,
      origin,
      importDate: date,
      weightKg: weightKg > 0 ? weightKg : undefined,
      quantity: quantity > 0 ? quantity : undefined,
      exporter: typeof body.exporter === "string" ? body.exporter : undefined,
      exchangeRate: exchange,
      customsValueBrl: customsValueForDefense,
    });
    const additionalCharges = resolveSCImportAdditionalCharges({
      freightBrl: freight * exchange,
      transportMode,
      declarationType,
      additions: 1,
    });
    const defenseCommercialBrl = defense.amountBrl ?? 0;
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
        specialRegimeContext: { ...specialRegimeContext, product: { ...(specialRegimeContext.product as Record<string, unknown> | undefined), ncm } },
      });
      if (scDecision.decision === "deny") throw new Error(`Regra SC bloqueada: ${scDecision.reasons.join(" ")}`);
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
        if (benefitsByItem[itemId].decision === "deny") throw new Error(`TTD ${ttd} não passou na validação jurídica: ${benefitsByItem[itemId].reasons.join(" ")}`);
      }
    }

    const calculation = calculateSCMultiItemFinalCost({
      items: [{
        itemId,
        customsValue,
        quantity,
        weightKg,
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
        { id: "AFRMM", description: "AFRMM/TUM — base ICMS SC", amount: additionalCharges.afrmmBrl, treatment: "icms_import_base", allocation: "item_value", note: "8% sobre a remuneração do transporte aquaviário quando aplicável." },
        { id: "SISCOMEX", description: "Taxa de Utilização do Siscomex — base ICMS SC", amount: additionalCharges.siscomexBrl, treatment: "icms_import_base", allocation: "item_value", note: "R$ 185 por DI + R$ 29,50 por adição." },
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
    const extraWarnings = [...federal.warnings, ...additionalCharges.warnings, ...(defense.status === "requires_input" || defense.status === "identified" ? defense.warnings : [])];

    return NextResponse.json({
      federal: {
        ncm,
        origin,
        ii: { rate: federal.iiRate, automatic: true, warnings: federal.warnings },
        ipi: { rate: federal.ipiRate, automatic: true, warnings: federal.warnings },
        pisImport: { rate: federal.pisImportRate, automatic: true, source: federal.contributionSource },
        cofinsImport: { rate: federal.cofinsImportRate, automatic: true, source: federal.contributionSource },
        snapshot: federal.snapshot,
        defenseCommercial: defense,
      },
      sc: {
        ttd,
        specialRegimeIds,
        decision: scDecision?.decision ?? "normal",
        decisionReasons: [...(scDecision?.reasons ?? ["Nenhum TTD/regime especial informado; tributação normal preservada."]), ...extraWarnings],
        ruleIds: scDecision?.ruleIds ?? [],
        benefitDecision: benefitsByItem[itemId]?.decision ?? "normal",
        benefitReasons: benefitsByItem[itemId]?.reasons ?? [],
        blockingIssues: [...new Set([...(scDecision?.blockingIssues ?? []), ...(benefitsByItem[itemId]?.blockingIssues ?? [])])],
        icmsNormalRate: scItem.icmsNormalRate,
        icmsImportEffectiveRate: scItem.icmsImportEffectiveRate,
        normalImportICMS: scItem.normalImportICMS,
        effectiveImportICMS: scItem.benefitImportICMS,
        importICMSSavings: scItem.importICMSSavings,
        importCharges: {
          transportMode,
          declarationType,
          afrmmRate: additionalCharges.afrmmRate * 100,
          afrmmBrl: additionalCharges.afrmmBrl,
          siscomexBrl: additionalCharges.siscomexBrl,
        },
      },
      calculation: {
        ...calculation,
        defenseCommercialBrl,
        totalLandedCostIncludingDefense: calculation.totalLandedCostAfterBenefit + defenseCommercialBrl,
        items: calculation.items.map((calculatedItem) => ({
          ...calculatedItem,
          landedCostPerUnitAfterBenefit: quantity > 0 ? (calculation.totalLandedCostAfterBenefit + defenseCommercialBrl) / quantity : 0,
          taxLines,
          defenseCommercial: defense,
          defenseCommercialBrl,
        })),
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível calcular a operação." }, { status: 400 });
  }
}
