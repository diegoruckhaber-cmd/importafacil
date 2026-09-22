import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function userClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function score(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

function textValue(value: unknown) {
  const text = String(value || "").trim();
  return text ? text.slice(0, 1000) : null;
}

async function auth(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: NextResponse.json({ error: "Faça login para responder ao piloto." }, { status: 401 }) };
  const supabase = userClient(token);
  if (!supabase) return { error: NextResponse.json({ error: "Piloto indisponível no ambiente." }, { status: 503 }) };
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 }) };
  return { supabase, user };
}

export async function GET(req: Request) {
  const session = await auth(req);
  if ("error" in session) return session.error;

  const { data, error } = await session.supabase
    .from("pilot_responses")
    .select("ease_score,confidence_score,value_score,would_pay,blocker,pricing_comment,updated_at")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Não foi possível consultar sua avaliação." }, { status: 500 });
  return NextResponse.json({ response: data || null }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const session = await auth(req);
  if ("error" in session) return session.error;

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Avaliação inválida." }, { status: 400 }); }

  const easeScore = score(body?.easeScore);
  const confidenceScore = score(body?.confidenceScore);
  const valueScore = score(body?.valueScore);
  if (!easeScore || !confidenceScore || !valueScore || typeof body?.wouldPay !== "boolean") {
    return NextResponse.json({ error: "Preencha as notas de 1 a 5 e informe sua disposição de pagar." }, { status: 400 });
  }

  const { error } = await session.supabase
    .from("pilot_responses")
    .upsert({
      user_id: session.user.id,
      ease_score: easeScore,
      confidence_score: confidenceScore,
      value_score: valueScore,
      would_pay: body.wouldPay,
      blocker: textValue(body?.blocker),
      pricing_comment: textValue(body?.pricingComment),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: "Não foi possível salvar sua avaliação agora." }, { status: 500 });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
