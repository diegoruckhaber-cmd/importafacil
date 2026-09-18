import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createStripePortalSession } from "../../../lib/stripe-billing-portal";
import { buildOperationalEvent, emitOperationalEvent } from "../../../lib/operational-observability";

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

export async function POST(req: Request) {
  const startedAtMs = Date.now();
  const emit = (outcome: "success" | "rejected" | "failed", reasonCode?: string) =>
    emitOperationalEvent(buildOperationalEvent({ event: "billing.portal", outcome, reasonCode, startedAtMs }));

  try {
    const authorization = req.headers.get("authorization") || "";
    const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) {
      emit("rejected", "auth_required");
      return NextResponse.json({ error: "Sessão autenticada é obrigatória." }, { status: 401 });
    }

    const supabase = userClient(accessToken);
    if (!supabase) {
      emit("failed", "auth_environment_missing");
      return NextResponse.json({ error: "Autenticação do ambiente não está configurada." }, { status: 503 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      emit("rejected", "session_invalid");
      return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan,stripe_customer_id,stripe_subscription_id,subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      emit("failed", "profile_lookup");
      return NextResponse.json({ error: "Não foi possível consultar sua assinatura." }, { status: 500 });
    }

    const customerId = typeof profile?.stripe_customer_id === "string" ? profile.stripe_customer_id : "";
    if (!customerId.startsWith("cus_")) {
      emit("rejected", "customer_missing");
      return NextResponse.json({ error: "Sua conta ainda não possui uma assinatura Stripe gerenciável." }, { status: 409 });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
    if (!/^sk_live_|^rk_live_/.test(stripeSecret)) {
      emit("failed", "billing_environment_missing");
      return NextResponse.json({ error: "Portal de cobrança indisponível no ambiente." }, { status: 503 });
    }

    const origin = new URL(req.url).origin;
    const session = await createStripePortalSession({
      secret: stripeSecret,
      customerId,
      returnUrl: `${origin}/upgrade?portal=returned`,
    });

    emit("success");
    return NextResponse.json(
      { url: session.url },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    emit("failed", "stripe_portal_session");
    return NextResponse.json({ error: "Não foi possível abrir o portal de cobrança agora." }, { status: 502 });
  }
}
