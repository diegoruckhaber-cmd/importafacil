import { NextResponse } from "next/server";
import {
  planForStripeSubscriptionStatus,
  stripeSubscriptionIdFromObject,
  stripeUserIdFromObject,
  verifyStripeWebhookSignature,
} from "../../../../lib/stripe-webhook";

export const runtime = "nodejs";

const RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

function serverConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey || !stripeSecret) throw new Error("Billing server environment is not configured.");
  return { supabaseUrl, serviceKey, stripeSecret };
}

async function readStripeSubscription(subscriptionId: string, stripeSecret: string) {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: { Authorization: `Bearer ${stripeSecret}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Stripe subscription lookup failed (${response.status}).`);
  return response.json();
}

async function assertRestOk(response: Response, operation: string) {
  if (response.ok) return;
  const detail = await response.text().catch(() => "");
  throw new Error(`${operation} failed (${response.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`);
}

async function updateSubscriptionEntitlement(userId: string, subscription: any) {
  const { supabaseUrl, serviceKey } = serverConfig();
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  const plan = planForStripeSubscriptionStatus(subscription?.status);
  const currentPeriodEnd = subscription?.current_period_end
    ? new Date(Number(subscription.current_period_end) * 1000).toISOString()
    : null;

  const subscriptionResponse = await fetch(`${supabaseUrl}/rest/v1/subscriptions?on_conflict=provider_subscription_id`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: userId,
      provider: "stripe",
      provider_subscription_id: subscription.id,
      plan: "PRO",
      status: subscription.status,
      current_period_end: currentPeriodEnd,
    }),
  });
  await assertRestOk(subscriptionResponse, "Subscription persistence");

  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ plan, updated_at: new Date().toISOString() }),
  });
  await assertRestOk(profileResponse, "Profile entitlement update");
  const updatedProfiles = await profileResponse.json().catch(() => []);
  if (!Array.isArray(updatedProfiles) || updatedProfiles.length !== 1) throw new Error("Profile entitlement update did not affect exactly one profile.");
}

async function subscriptionForEvent(eventType: string, object: any) {
  const { stripeSecret } = serverConfig();
  if (object?.object === "subscription" && typeof object.id === "string") {
    if (eventType === "customer.subscription.deleted") return object;
    return readStripeSubscription(object.id, stripeSecret);
  }
  const subscriptionId = stripeSubscriptionIdFromObject(object);
  if (!subscriptionId) return null;
  return readStripeSubscription(subscriptionId, stripeSecret);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  if (!verifyStripeWebhookSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(payload);
    if (!RELEVANT_EVENTS.has(event?.type)) return NextResponse.json({ received: true, processed: false });

    const object = event?.data?.object;
    const subscription = await subscriptionForEvent(event.type, object);
    if (!subscription) return NextResponse.json({ received: true, processed: false });

    const userId = stripeUserIdFromObject(subscription) || stripeUserIdFromObject(object);
    if (!userId) return NextResponse.json({ received: true, processed: false });

    await updateSubscriptionEntitlement(userId, subscription);
    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
