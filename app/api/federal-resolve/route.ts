import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

type SnapshotRecord = {
  sourceType: "mdic-ii" | "rfb-ipi";
  ncm: string;
  rate: number;
  sheet: string;
  row: number;
  workbook: string;
};

type Snapshot = {
  schemaVersion: number;
  publicationStatus: string;
  sources: {
    mdic?: { published?: string; recordCount?: number };
    rfbTipi?: { updated?: string; recordCount?: number };
  };
  records: SnapshotRecord[];
};

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "federal", "official-snapshot-2026-07.json");
const SNAPSHOT_DATE = "2026-07-24";

function normalizeNcm(value: string) {
  return value.replace(/\D/g, "");
}

function loadSnapshot(): Snapshot {
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8")) as Snapshot;
}

function resolveUniqueRate(records: SnapshotRecord[]) {
  const uniqueRates = [...new Set(records.map((record) => record.rate))];
  const sheets = [...new Set(records.map((record) => record.sheet))];

  if (records.length === 0) {
    return { rate: null, automatic: false, warnings: ["NCM não localizada no snapshot oficial federal."] , sheets };
  }

  if (uniqueRates.length !== 1) {
    return {
      rate: null,
      automatic: false,
      warnings: [
        `Foram encontrados ${uniqueRates.length} tratamentos com alíquotas diferentes para a NCM no snapshot oficial.`,
        "A aplicação automática foi bloqueada até que a concorrência entre anexos/tratamentos seja resolvida.",
      ],
      sheets,
    };
  }

  return {
    rate: uniqueRates[0],
    automatic: true,
    warnings: [],
    sheets,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ncm = normalizeNcm(url.searchParams.get("ncm") ?? "");
    const date = url.searchParams.get("date") ?? SNAPSHOT_DATE;

    if (ncm.length !== 8) {
      return NextResponse.json({ error: "Informe uma NCM válida com 8 dígitos." }, { status: 400 });
    }

    const snapshot = loadSnapshot();
    const records = snapshot.records.filter((record) => normalizeNcm(record.ncm) === ncm);
    const ii = resolveUniqueRate(records.filter((record) => record.sourceType === "mdic-ii"));
    const ipi = resolveUniqueRate(records.filter((record) => record.sourceType === "rfb-ipi"));
    const warnings = [...ii.warnings, ...ipi.warnings];

    if (date < SNAPSHOT_DATE) {
      warnings.push(`O snapshot federal disponível começa em ${SNAPSHOT_DATE}; a data informada (${date}) exige validação histórica.`);
    }

    return NextResponse.json({
      ncm,
      date,
      snapshot: {
        publicationStatus: snapshot.publicationStatus,
        mdicPublished: snapshot.sources.mdic?.published ?? SNAPSHOT_DATE,
        tipiUpdated: snapshot.sources.rfbTipi?.updated ?? null,
      },
      ii: { ...ii, source: "MDIC official snapshot" },
      ipi: { ...ipi, source: "RFB TIPI official snapshot" },
      warnings,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      error: "Não foi possível carregar o snapshot fiscal oficial.",
      detail: error instanceof Error ? error.message : "erro desconhecido",
    }, { status: 500 });
  }
}
