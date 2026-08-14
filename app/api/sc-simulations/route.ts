import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const authorization = req.headers.get("authorization");
    const accessToken = authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) return NextResponse.json({ error: "Faça login para salvar a simulação." }, { status: 401 });

    const body = await req.json();
    const supabase = clientForToken(accessToken);
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });

    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Simulação SC";
    if (!body.input || !body.result) return NextResponse.json({ error: "Dados da simulação incompletos." }, { status: 400 });

    const { data, error } = await supabase.from("simulations").insert({
      user_id: userData.user.id,
      name,
      input: body.input,
      result: body.result,
    }).select("id,name,created_at").single();

    if (error) {
      console.error("sc simulation persistence error", error);
      return NextResponse.json({ error: "Não foi possível salvar a simulação." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, name: data.name, createdAt: data.created_at, persistence: "saved" });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar a simulação." }, { status: 400 });
  }
}
