import { NextResponse } from "next/server";
import crypto from "node:crypto";

function verifyStripeSignature(payload: string, signature: string, secret: string) {
  const parts = signature.split(",");
  const timestamp = parts.find((x) => x.startsWith("t="))?.slice(2);
  const signatures = parts.filter((x) => x.startsWith("v1=")).map((x) => x.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const signed = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  return signatures.some((sig) => sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)));
}

async function updateSubscription(userId: string, subscription: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase server environment is not configured.");
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" };
  const active = ["active", "trialing"].includes(subscription.status);
  await fetch(`${supabaseUrl}/rest/v1/subscriptions?on_conflict=provider_subscription_id`, {
    method: "POST", headers,
    body: JSON.stringify({ user_id: userId, provider: "stripe", provider_subscription_id: subscription.id, plan: "PRO", status: subscription.status, current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null }),
  });
  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH", headers,
    body: JSON.stringify({ plan: active ? "PRO" : "FREE", updated_at: new Date().toISOString() }),
  });
}

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !verifyStripeSignature(payload, signature, webhookSecret)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  try {
    const event = JSON.parse(payload);
    if (["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      const object = event.data.object;
      const subscription = object.object === "subscription" ? object : null;
      const userId = subscription?.metadata?.user_id || object?.metadata?.user_id || object?.client_reference_id;
      if (userId && subscription) await updateSubscription(userId, subscription);
      if (userId && event.type === "checkout.session.completed" && object.subscription) {
        const secret = process.env.STRIPE_SECRET_KEY;
        if (secret) {
          const r = await fetch(`https://api.stripe.com/v1/subscriptions/${object.subscription}`, { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" });
          if (r.ok) await updateSubscription(userId, await r.json());
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
