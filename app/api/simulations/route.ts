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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input: SimulationInput = body.input;
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Nova simulação";
    if (!input || input.quantity <= 0 || input.fx <= 0) {
      return NextResponse.json({ error: "Dados de simulação inválidos." }, { status: 400 });
    }

    const authorization = req.headers.get("authorization");
    const accessToken = authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) return NextResponse.json({ error: "Faça login para salvar a simulação." }, { status: 401 });

    const supabase = clientForToken(accessToken);
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });

    const result = calculate(input);
    const { data, error } = await supabase.from("simulations").insert({
      user_id: userData.user.id,
      name,
      input,
      result,
    }).select("id, name, created_at").single();

    if (error) {
      console.error("simulation persistence error", error);
      return NextResponse.json({ error: "Não foi possível salvar a simulação." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, createdAt: data.created_at, status: "calculated", result, persistence: "saved" });
  } catch {
    return NextResponse.json({ error: "Não foi possível processar a simulação." }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const authorization = req.headers.get("authorization");
    const accessToken = authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) return NextResponse.json({ error: "Faça login para consultar suas simulações." }, { status: 401 });

    const supabase = clientForToken(accessToken);
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });

    const { data, error } = await supabase.from("simulations").select("id, name, input, result, created_at").eq("user_id", userData.user.id).order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Não foi possível consultar as simulações." }, { status: 500 });
    return NextResponse.json({ simulations: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar as simulações." }, { status: 400 });
  }
}
