import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { executeOfficialSimulationV2 } from "../../../lib/server-simulation-v2";
import { persistOfficialSimulation } from "../../../lib/server-simulation-persistence";
import { calculateUnifiedImportSimulation } from "../../../lib/unified-import-simulation";
import { normalizeSCRequest } from "../../../lib/sc-request";
import { calculate, SimulationInput } from "../../../lib/calculator";

function clientForToken(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabasePublishableKey) return null;
  return createClient(supabaseUrl, supabasePublishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function authenticatedClient(req: Request) {
  const authorization = req.headers.get("authorization");
  const accessToken = authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return { error: NextResponse.json({ error: "Faça login para salvar a simulação." }, { status: 401 }) };
  const supabase = clientForToken(accessToken);
  if (!supabase) return { error: NextResponse.json({ error: "Autenticação do ambiente não está configurada." }, { status: 503 }) };
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) return { error: NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 }) };
  return { supabase, user: userData.user };
}

type Authenticated = {
  supabase: NonNullable<ReturnType<typeof clientForToken>>;
  user: { id: string };
};

async function persistCalculatedRecord(auth: Authenticated, name: string, input: unknown, result: unknown): Promise<NextResponse> {
  const saved = await persistOfficialSimulation(auth.user.id, name, input, result);
  if (saved.limited) return NextResponse.json({ error: "Você atingiu o limite de 3 simulações salvas do plano FREE. Exclua uma simulação do histórico ou conheça o PRO." }, { status: 403 });
  return NextResponse.json({ ...saved, persistence: "saved", result });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 200) : "Nova simulação";
    const auth = await authenticatedClient(req);
    if ("error" in auth) return auth.error;
    const authenticated: Authenticated = { supabase: auth.supabase, user: { id: auth.user.id } };

    if (body.mode === "v2") {
      if (!body.input || !Array.isArray(body.input.items)) {
        return NextResponse.json({ error: "Contrato importafacil-simulation-v2 inválido." }, { status: 400 });
      }
      return await persistCalculatedRecord(authenticated, name, body.input, executeOfficialSimulationV2(body.input));
    }

    if (body.mode === "sc") {
      if (!body.input) {
        return NextResponse.json({ error: "Dados da operação SC inválidos." }, { status: 400 });
      }
      return await persistCalculatedRecord(authenticated, name, body.input, calculateUnifiedImportSimulation(normalizeSCRequest(body.input)));
    }

    const input: SimulationInput = body.input;
    if (!input || input.quantity <= 0 || input.fx <= 0) {
      return NextResponse.json({ error: "Dados de simulação inválidos." }, { status: 400 });
    }

    const result = calculate(input);
    const response = await persistCalculatedRecord(authenticated, name, input, result);
    if (response.status >= 400) return response;
    const payload = await response.json();
    return NextResponse.json({ ...payload, status: "calculated", result });
  } catch {
    return NextResponse.json({ error: "Não foi possível processar a simulação." }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const auth = await authenticatedClient(req);
    if ("error" in auth) return NextResponse.json({ error: "Faça login para consultar suas simulações." }, { status: 401 });

    const parameters = new URL(req.url).searchParams;
    const offset = Number(parameters.get("offset") || 0);
    const limit = Number(parameters.get("limit") || 50);
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: "Paginação inválida." }, { status: 400 });
    }
    const { data, error } = await auth.supabase.from("simulations").select("id, name, input, result, created_at, server_execution").eq("user_id", auth.user.id).order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + limit);
    if (error) return NextResponse.json({ error: "Não foi possível consultar as simulações." }, { status: 500 });
    return NextResponse.json({ simulations: (data ?? []).slice(0, limit), hasMore: (data ?? []).length > limit, nextOffset: offset + limit }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar as simulações." }, { status: 400 });
  }
}
