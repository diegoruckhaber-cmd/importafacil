import { NextResponse } from "next/server";

const NCM_SOURCE = "https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json?perfil=PUBLICO";

type NCMRow = {
  Codigo?: string;
  Descricao?: string;
  Data_Inicio?: string;
  Data_Fim?: string;
};

type IndexedNCM = NCMRow & {
  normalizedCode: string;
  normalizedDescription: string;
  cleanDescription: string;
};

let cache: { expiresAt: number; rows: IndexedNCM[] } | null = null;

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDescription(value: string) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractRows(payload: unknown): NCMRow[] {
  if (Array.isArray(payload)) return payload as NCMRow[];
  if (!payload || typeof payload !== "object") return [];

  const candidates = Object.values(payload as Record<string, unknown>);
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as NCMRow[];
  }

  for (const candidate of candidates) {
    const nested = extractRows(candidate);
    if (nested.length) return nested;
  }

  return [];
}

async function loadNCMs() {
  if (cache && cache.expiresAt > Date.now()) return cache.rows;

  const response = await fetch(NCM_SOURCE, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error(`Falha ao consultar a tabela NCM oficial (${response.status}).`);

  const payload = await response.json();
  const rows = extractRows(payload)
    .filter((row) => row.Codigo && row.Descricao)
    .map((row) => ({
      ...row,
      normalizedCode: row.Codigo!.replace(/\D/g, ""),
      cleanDescription: cleanText(row.Descricao!),
      normalizedDescription: normalizeDescription(row.Descricao!),
    }));

  if (!rows.length) throw new Error("A tabela NCM oficial foi recebida, mas seu formato não pôde ser interpretado.");

  // Keep the official dataset in memory for one hour. Searching then only scans
  // a small normalized index instead of parsing/cleaning every row on each keystroke.
  cache = { expiresAt: Date.now() + 60 * 60 * 1000, rows };
  return rows;
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

    // Do not scan the entire NCM catalog for one-character queries. This is also
    // important on mobile/slow connections because the picker can fire while typing.
    if (query.length < 2) {
      return NextResponse.json(
        { source: NCM_SOURCE, count: 0, items: [] },
        {
          headers: {
            "Cache-Control": "public, max-age=30, stale-while-revalidate=300",
          },
        },
      );
    }

    const rows = await loadNCMs();
    const normalizedQuery = query.replace(/\D/g, "");
    const normalizedText = normalizeDescription(query);

    const normalized = rows
      .filter((row) => {
        const codeMatch = normalizedQuery.length >= 2 && row.normalizedCode.includes(normalizedQuery);
        const descriptionMatch = row.normalizedDescription.includes(normalizedText);
        return codeMatch || descriptionMatch;
      })
      .slice(0, 30)
      .map((row) => ({
        code: row.Codigo!,
        description: row.cleanDescription,
        startDate: row.Data_Inicio,
        endDate: row.Data_Fim,
      }));

    return NextResponse.json(
      { source: NCM_SOURCE, count: normalized.length, items: normalized },
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível consultar a tabela NCM oficial." },
      { status: 502 },
    );
  }
}
