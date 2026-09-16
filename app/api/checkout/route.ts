import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!accessToken) return NextResponse.json({ error: "Sessão autenticada é obrigatória." }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Autenticação do ambiente não está configurada." }, { status: 503 });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

    const secret = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!secret || !priceId) return NextResponse.json({ error: "Checkout ainda não configurado no ambiente." }, { status: 503 });
    if (!priceId.startsWith("price_")) return NextResponse.json({ error: "Checkout ainda não configurado no ambiente." }, { status: 503 });

    const origin = new URL(req.url).origin;
    const userId = user.id;
    const email = user.email || "";
    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
    params.set("customer_email", email);
    params.set("client_reference_id", userId);
    params.set("subscription_data[metadata][user_id]", userId);
    params.set("subscription_data[metadata][plan]", "PRO");
    params.set("metadata[user_id]", userId);
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
      console.error("Stripe checkout creation failed", response.status, data?.error?.type || "unknown_error");
      return NextResponse.json({ error: "Não foi possível iniciar o checkout agora." }, { status: 502 });
    }
    return NextResponse.json({ url: data.url, sessionId: data.id });
  } catch {
    return NextResponse.json({ error: "Erro ao iniciar o checkout." }, { status: 500 });
  }
}
