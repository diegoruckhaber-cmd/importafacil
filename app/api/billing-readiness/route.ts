import { NextResponse } from "next/server";
import {
  supabaseAdminHeaders,
  supabaseElevatedKeyFromEnv,
  supabaseElevatedKeyKind,
} from "../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = { ok: boolean; detail: string };

async function checkStripePrice(secret: string, priceId: string): Promise<Check> {
  try {
    const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, detail: `http_${response.status}` };
    const price = await response.json();
    const expected =
      price?.id === priceId &&
      price?.active === true &&
      price?.livemode === true &&
      price?.currency === "brl" &&
      price?.unit_amount === 2990 &&
      price?.recurring?.interval === "month" &&
      price?.recurring?.interval_count === 1;
    return { ok: expected, detail: expected ? "live_monthly_brl_2990" : "unexpected_price_configuration" };
  } catch {
    return { ok: false, detail: "request_failed" };
  }
}

async function checkSupabaseTable(url: string, elevatedKey: string, table: string): Promise<Check> {
  try {
    const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
      headers: supabaseAdminHeaders(elevatedKey),
      cache: "no-store",
    });
    return { ok: response.ok, detail: response.ok ? "reachable" : `http_${response.status}` };
  } catch {
    return { ok: false, detail: "request_failed" };
  }
}

export async function GET() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const priceId = process.env.STRIPE_PRO_PRICE_ID || "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const elevatedKey = supabaseElevatedKeyFromEnv();
  const elevatedKeyKind = supabaseElevatedKeyKind(elevatedKey);

  const environment = {
    stripeSecretConfigured: /^sk_live_|^rk_live_/.test(stripeSecret),
    webhookSecretConfigured: webhookSecret.startsWith("whsec_"),
    proPriceConfigured: priceId.startsWith("price_"),
    supabaseUrlConfigured: /^https:\/\//.test(supabaseUrl),
    supabaseElevatedKeyConfigured: elevatedKeyKind !== "invalid",
    supabaseElevatedKeyKind: elevatedKeyKind,
  };

  const environmentOk =
    environment.stripeSecretConfigured &&
    environment.webhookSecretConfigured &&
    environment.proPriceConfigured &&
    environment.supabaseUrlConfigured &&
    environment.supabaseElevatedKeyConfigured;

  if (!environmentOk) {
    return NextResponse.json(
      { ok: false, service: "billing", environment: process.env.VERCEL_ENV || "unknown", checks: { environment } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const [stripePrice, profiles, subscriptions, webhookEvents] = await Promise.all([
    checkStripePrice(stripeSecret, priceId),
    checkSupabaseTable(supabaseUrl, elevatedKey, "profiles"),
    checkSupabaseTable(supabaseUrl, elevatedKey, "subscriptions"),
    checkSupabaseTable(supabaseUrl, elevatedKey, "stripe_webhook_events"),
  ]);

  const ok = stripePrice.ok && profiles.ok && subscriptions.ok && webhookEvents.ok;
  return NextResponse.json(
    {
      ok,
      service: "billing",
      environment: process.env.VERCEL_ENV || "unknown",
      checks: {
        environment,
        stripe: { price: stripePrice },
        supabase: { profiles, subscriptions, webhookEvents },
      },
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
