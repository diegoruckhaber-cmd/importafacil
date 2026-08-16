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

function loadFederal(ncm: string, date: string) {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8")) as Snapshot;
  const records = snapshot.records.filter((record) => normalizeNcm(record.ncm) === ncm);
  return {
    iiRate: resolveRate(records.filter((record) => record.sourceType === "mdic-ii"), "II"),
    ipiRate: resolveRate(records.filter((record) => record.sourceType === "rfb-ipi"), "IPI"),
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
    const icms = Number(body.icms);
    const ttd = String(body.ttd ?? "none");
    const destination = body.destination === "industrialization" ? "industrialization" : "commercial_resale";

    if (ncm.length !== 8) throw new Error("Informe uma NCM válida com 8 dígitos.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Informe uma data de importação válida.");

    const numericInputs: Array<[string, number]> = [
      ["Quantidade", quantity],
      ["FOB unitário", fobUnit],
      ["Câmbio", exchange],
      ["Frete", freight],
      ["Seguro", insurance],
      ["Armazenagem", storage],
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

    if (ttd === "409" || ttd === "410") {
      const decision = decideSCItem({
        id: itemId,
        ttd: Number(ttd) as 409 | 410,
        destination,
        validConcession: true,
        importEntryInSC: true,
        sameNcmPositionAfterFractionation: true,
      });
      if (decision.decision !== "apply") {
        throw new Error(`TTD ${ttd} bloqueado: ${decision.reasons.join(" ")}`);
      }

      benefitsByItem[itemId] = resolveSCBenefit({
        ttd: Number(ttd) as 409 | 410,
        destination,
        ncm,
        normalOutputICMS: 0,
        taxableOutput: true,
        industrializationInSC: destination === "industrialization",
        preservesOriginalCharacteristics: true,
        sameNcmPosition: true,
        otherDeferment: false,
        paragraph23Or24: false,
        equivalentTaxableEventElection: false,
      });

      if (benefitsByItem[itemId].decision !== "apply") {
        throw new Error(`TTD ${ttd} não passou na validação jurídica: ${benefitsByItem[itemId].reasons.join(" ")}`);
      }
    }

    const calculation = calculateSCMultiItemFinalCost({
      items: [{
        itemId,
        customsValue,
        quantity,
        weightKg: quantity,
        volumeM3: 1,
        iiRate: federal.iiRate,
        ipiRate: federal.ipiRate,
        pisImportRate: 2.1,
        cofinsImportRate: 9.65,
        icmsRate: icms,
        importDate: date as `${number}-${number}-${number}`,
        iiLegalFoundation: "MDIC official snapshot 2026-07",
      }],
      expenses: [
        { id: "FREIGHT", description: "Frete internacional", amount: freight * exchange, treatment: "customs_base", allocation: "item_value" },
        { id: "INSURANCE", description: "Seguro internacional", amount: insurance * exchange, treatment: "customs_base", allocation: "item_value" },
        { id: "STORAGE", description: "Armazenagem", amount: storage, treatment: "operational_cost", allocation: "item_value" },
      ],
      benefitsByItem,
    });

    return NextResponse.json({
      federal: {
        ncm,
        origin,
        ii: { rate: federal.iiRate, automatic: true },
        ipi: { rate: federal.ipiRate, automatic: true },
        snapshot: federal.snapshot,
      },
      sc: {
        ttd,
        icmsNormalRate: icms,
        icmsImportEffectiveRate: (ttd === "409" || ttd === "410") ? 0 : icms,
        importICMSSavings: calculation.totalImportICMSSavings,
      },
      calculation,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Não foi possível calcular a operação.",
    }, { status: 400 });
  }
}
