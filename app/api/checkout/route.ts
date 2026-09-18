import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildOperationalEvent, emitOperationalEvent } from "../../../lib/operational-observability";

export async function POST(req: Request) {
  const startedAtMs = Date.now();
  const emit = (outcome: "success" | "rejected" | "failed", reasonCode?: string) =>
    emitOperationalEvent(buildOperationalEvent({ event: "billing.checkout", outcome, reasonCode, startedAtMs }));

  try {
    const authHeader = req.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!accessToken) {
      emit("rejected", "auth_required");
      return NextResponse.json({ error: "Sessão autenticada é obrigatória." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      emit("failed", "auth_environment_missing");
      return NextResponse.json({ error: "Autenticação do ambiente não está configurada." }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      emit("rejected", "session_invalid");
      return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan,stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (String(profile?.plan || "FREE").toUpperCase() === "PRO") {
      emit("rejected", "already_pro");
      return NextResponse.json({ error: "Seu plano PRO já está ativo." }, { status: 409 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!secret || !priceId || !priceId.startsWith("price_")) {
      emit("failed", "billing_environment_missing");
      return NextResponse.json({ error: "Checkout ainda não configurado no ambiente." }, { status: 503 });
    }

    const origin = new URL(req.url).origin;
    const email = user.email || "";
    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");

    const existingCustomerId =
      typeof profile?.stripe_customer_id === "string" && profile.stripe_customer_id.startsWith("cus_")
        ? profile.stripe_customer_id
        : "";
    if (existingCustomerId) params.set("customer", existingCustomerId);
    else params.set("customer_email", email);

    params.set("client_reference_id", user.id);
    params.set("subscription_data[metadata][user_id]", user.id);
    params.set("subscription_data[metadata][plan]", "PRO");
    params.set("metadata[user_id]", user.id);
    params.set("metadata[plan]", "PRO");
    params.set("success_url", `${origin}/dashboard?checkout=success`);
    params.set("cancel_url", `${origin}/dashboard?checkout=cancelled`);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || typeof data?.url !== "string") {
      emit("failed", "stripe_checkout_create");
      return NextResponse.json({ error: "Não foi possível iniciar o checkout agora." }, { status: 502 });
    }

    emit("success");
    return NextResponse.json({ url: data.url, sessionId: data.id });
  } catch {
    emit("failed", "unhandled");
    return NextResponse.json({ error: "Erro ao iniciar o checkout." }, { status: 500 });
  }
}
