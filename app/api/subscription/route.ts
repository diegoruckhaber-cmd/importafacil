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

export async function GET(req: Request) {
  try {
    const authorization = req.headers.get("authorization") || "";
    const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) {
      return NextResponse.json({ error: "Sessão autenticada é obrigatória." }, { status: 401 });
    }

    const supabase = userClient(accessToken);
    if (!supabase) {
      return NextResponse.json({ error: "Autenticação do ambiente não está configurada." }, { status: 503 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
    }

    const [{ data: profile, error: profileError }, { data: subscription, error: subscriptionError }] = await Promise.all([
      supabase
        .from("profiles")
        .select("plan,subscription_status,current_period_end")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("provider,plan,status,current_period_end,created_at,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (profileError || subscriptionError) {
      console.error("Subscription status lookup failed", profileError?.code || subscriptionError?.code || "unknown");
      return NextResponse.json({ error: "Não foi possível consultar sua assinatura." }, { status: 500 });
    }

    const plan = String(profile?.plan || subscription?.plan || "FREE").toUpperCase();
    const status = subscription?.status || profile?.subscription_status || (plan === "FREE" ? "none" : "unknown");
    const currentPeriodEnd = subscription?.current_period_end || profile?.current_period_end || null;

    return NextResponse.json(
      {
        plan,
        status,
        provider: subscription?.provider || (plan === "FREE" ? null : "stripe"),
        currentPeriodEnd,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar sua assinatura." }, { status: 500 });
  }
}
