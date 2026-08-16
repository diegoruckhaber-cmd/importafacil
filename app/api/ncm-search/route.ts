import { NextResponse } from "next/server";

const NCM_SOURCE = "https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json?perfil=PUBLICO";

type NCMRow = {
  Codigo?: string;
  Descricao?: string;
  Data_Inicio?: string;
  Data_Fim?: string;
};

let cache: { expiresAt: number; rows: NCMRow[] } | null = null;

async function loadNCMs() {
  if (cache && cache.expiresAt > Date.now()) return cache.rows;

  const response = await fetch(NCM_SOURCE, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error(`Falha ao consultar a tabela NCM oficial (${response.status}).`);

  const rows = (await response.json()) as NCMRow[];
  cache = { expiresAt: Date.now() + 60 * 60 * 1000, rows };
  return rows;
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
    const rows = await loadNCMs();

    const normalized = rows
      .filter((row) => row.Codigo && row.Descricao)
      .filter((row) => {
        if (!query) return true;
        const code = row.Codigo!.replace(/\D/g, "");
        const description = row.Descricao!.replace(/<[^>]*>/g, "").toLowerCase();
        return code.includes(query.replace(/\D/g, "")) || description.includes(query);
      })
      .slice(0, 30)
      .map((row) => ({
        code: row.Codigo!,
        description: row.Descricao!.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim(),
        startDate: row.Data_Inicio,
        endDate: row.Data_Fim,
      }));

    return NextResponse.json({ source: NCM_SOURCE, count: normalized.length, items: normalized });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível consultar a tabela NCM oficial." },
      { status: 502 },
    );
  }
}
