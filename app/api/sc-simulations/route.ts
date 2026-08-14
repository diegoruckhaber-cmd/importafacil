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

    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", userData.user.id).maybeSingle();
    const plan = String(profile?.plan || "FREE").toUpperCase();
    if (plan === "FREE") {
      const { count, error: countError } = await supabase
        .from("simulations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userData.user.id);
      if (countError) {
        console.error("sc simulation limit check error", countError);
        return NextResponse.json({ error: "Não foi possível validar o limite do plano." }, { status: 500 });
      }
      if ((count ?? 0) >= 3) {
        return NextResponse.json({ error: "Você atingiu o limite de 3 simulações do plano FREE. Assine o PRO para salvar novas simulações." }, { status: 403 });
      }
    }

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
