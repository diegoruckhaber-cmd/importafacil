import { NextResponse } from "next/server";

const PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || "price_1U2fwM3Fg8OaACj8YADPcwaQ";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim();
    const userId = String(body.userId || "").trim();
    if (!email || !userId) return NextResponse.json({ error: "Usuário autenticado é obrigatório." }, { status: 400 });

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "Checkout ainda não configurado no ambiente." }, { status: 503 });

    const origin = new URL(req.url).origin;
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
