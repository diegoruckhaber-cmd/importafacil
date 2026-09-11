import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculate, SimulationInput } from "../../../lib/calculator";

const supabaseUrl = "https://fagjbhhmbpdsmoyjcood.supabase.co";
const supabasePublishableKey = "sb_publishable_9akcQKdMBZYFvwCbNvnW-A_n0rYOudi";

function clientForToken(accessToken: string) {
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
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) return { error: NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 }) };
  return { supabase, user: userData.user };
}

async function persistCalculatedRecord(auth: Awaited<ReturnType<typeof authenticatedClient>>, name: string, input: unknown, result: unknown) {
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.supabase.from("simulations").insert({
    user_id: auth.user.id,
    name,
    input,
    result,
  }).select("id, name, created_at").single();
  if (error) {
    console.error("simulation persistence error", error);
    return NextResponse.json({ error: "Não foi possível salvar a simulação." }, { status: 500 });
  }
  return NextResponse.json({ id: data.id, createdAt: data.created_at, persistence: "saved" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Nova simulação";
    const auth = await authenticatedClient(req);
    if ("error" in auth) return auth.error;

    if (body.mode === "v2") {
      if (!body.input || !body.result || body.result.contract !== "importafacil-simulation-v2") {
        return NextResponse.json({ error: "Contrato da Simulation V2 inválido." }, { status: 400 });
      }
      return persistCalculatedRecord(auth, name, body.input, body.result);
    }

    if (body.mode === "sc") {
      if (!body.input || !body.result) {
        return NextResponse.json({ error: "Dados da operação SC inválidos." }, { status: 400 });
      }
      return persistCalculatedRecord(auth, name, body.input, body.result);
    }

    const input: SimulationInput = body.input;
    if (!input || input.quantity <= 0 || input.fx <= 0) {
      return NextResponse.json({ error: "Dados de simulação inválidos." }, { status: 400 });
    }

    const result = calculate(input);
    const response = await persistCalculatedRecord(auth, name, input, result);
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

    const { data, error } = await auth.supabase.from("simulations").select("id, name, input, result, created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Não foi possível consultar as simulações." }, { status: 500 });
    return NextResponse.json({ simulations: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar as simulações." }, { status: 400 });
  }
}
