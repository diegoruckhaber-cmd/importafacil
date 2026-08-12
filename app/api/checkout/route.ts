import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || "price_1U3kAF3Fg8OaACj82FQd4FOv";

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
    if (!secret) return NextResponse.json({ error: "Checkout ainda não configurado no ambiente." }, { status: 503 });

    const origin = new URL(req.url).origin;
    const userId = user.id;
    const email = user.email || "";
    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("line_items[0][price]", PRICE_ID);
    params.set("line_items[0][quantity]", "1");
    params.set("customer_email", email);
    params.set("client_reference_id", userId);
    params.set("subscription_data[metadata][user_id]", userId);
    params.set("subscription_data[metadata][plan]", "PRO");
    params.set("metadata[user_id]", userId);
    params.set("metadata[plan]", "PRO");
    params.set("billing_address_collection", "auto");
    params.set("tax_id_collection[enabled]", "true");
    params.set("allow_promotion_codes", "true");
    params.set("success_url", `${origin}/dashboard?checkout=success`);
    params.set("cancel_url", `${origin}/dashboard?checkout=cancelled`);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || "Não foi possível criar o checkout." }, { status: 502 });
    return NextResponse.json({ url: data.url, sessionId: data.id });
  } catch {
    return NextResponse.json({ error: "Erro ao iniciar o checkout." }, { status: 500 });
  }
}
