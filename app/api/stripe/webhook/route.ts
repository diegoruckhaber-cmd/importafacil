import { NextResponse } from "next/server";
import {
  planForStripeSubscriptionStatus,
  stripeCustomerIdFromObject,
  stripeSubscriptionIdFromObject,
  stripeUserIdFromObject,
  verifyStripeWebhookSignature,
} from "../../../../lib/stripe-webhook";
import {
  supabaseAdminHeaders,
  supabaseElevatedKeyFromEnv,
  supabaseElevatedKeyKind,
} from "../../../../lib/supabase-admin";
import { buildOperationalEvent, emitOperationalEvent } from "../../../../lib/operational-observability";

export const runtime = "nodejs";

const RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

type DeliveryStatus = "received" | "processed" | "failed" | "ignored";

function serverConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = supabaseElevatedKeyFromEnv();
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!supabaseUrl || supabaseElevatedKeyKind(supabaseKey) === "invalid" || !stripeSecret) {
    throw new Error("Billing server environment is not configured.");
  }
  return { supabaseUrl, supabaseKey, stripeSecret };
}

function auditHeaders(supabaseKey: string) {
  return {
    ...supabaseAdminHeaders(supabaseKey),
    "Content-Type": "application/json",
  };
}

async function deliveryStatus(eventId: string): Promise<DeliveryStatus | null> {
  const { supabaseUrl, supabaseKey } = serverConfig();
  const response = await fetch(
    `${supabaseUrl}/rest/v1/stripe_webhook_events?event_id=eq.${encodeURIComponent(eventId)}&select=status&limit=1`,
    { headers: auditHeaders(supabaseKey), cache: "no-store" },
  );
  if (!response.ok) throw new Error(`Webhook audit lookup failed (${response.status}).`);
  const rows = await response.json().catch(() => []);
  const status = Array.isArray(rows) ? rows[0]?.status : null;
  return status === "received" || status === "processed" || status === "failed" || status === "ignored"
    ? status
    : null;
}

async function registerDelivery(eventId: string, eventType: string) {
  const existing = await deliveryStatus(eventId);
  if (existing) return existing;

  const { supabaseUrl, supabaseKey } = serverConfig();
  const response = await fetch(`${supabaseUrl}/rest/v1/stripe_webhook_events`, {
    method: "POST",
    headers: { ...auditHeaders(supabaseKey), Prefer: "return=minimal" },
    body: JSON.stringify({ event_id: eventId, event_type: eventType, status: "received" }),
  });
  if (response.status === 409) return deliveryStatus(eventId);
  if (!response.ok) throw new Error(`Webhook audit registration failed (${response.status}).`);
  return "received" as DeliveryStatus;
}

async function markDelivery(eventId: string, status: Exclude<DeliveryStatus, "received">) {
  const { supabaseUrl, supabaseKey } = serverConfig();
  const now = new Date().toISOString();
  const response = await fetch(
    `${supabaseUrl}/rest/v1/stripe_webhook_events?event_id=eq.${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: { ...auditHeaders(supabaseKey), Prefer: "return=representation" },
      body: JSON.stringify({
        status,
        processed_at: status === "processed" || status === "ignored" ? now : null,
        updated_at: now,
        last_error: status === "failed" ? "processing_failed" : null,
      }),
    },
  );
  if (!response.ok) throw new Error(`Webhook audit update failed (${response.status}).`);
  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error("Webhook audit update affected an unexpected row count.");
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
  throw new Error(`${operation} failed (${response.status}).`);
}

async function updateSubscriptionEntitlement(userId: string, subscription: any) {
  const { supabaseUrl, supabaseKey } = serverConfig();
  const headers = auditHeaders(supabaseKey);
  const plan = planForStripeSubscriptionStatus(subscription?.status);
  const currentPeriodEnd = subscription?.current_period_end
    ? new Date(Number(subscription.current_period_end) * 1000).toISOString()
    : null;
  const customerId = stripeCustomerIdFromObject(subscription);

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
    body: JSON.stringify({
      plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    }),
  });
  await assertRestOk(profileResponse, "Profile entitlement update");
  const updatedProfiles = await profileResponse.json().catch(() => []);
  if (!Array.isArray(updatedProfiles) || updatedProfiles.length !== 1) {
    throw new Error("Profile entitlement update did not affect exactly one profile.");
  }
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
  const startedAtMs = Date.now();
  let eventType = "";
  const emit = (outcome: "success" | "rejected" | "failed" | "ignored" | "duplicate", reasonCode?: string) =>
    emitOperationalEvent(buildOperationalEvent({ event: "billing.webhook", outcome, reasonCode, eventType: eventType || undefined, startedAtMs }));
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    emit("failed", "webhook_environment_missing");
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  if (!verifyStripeWebhookSignature(payload, signature, webhookSecret)) {
    emit("rejected", "invalid_signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let eventId = "";
  try {
    const event = JSON.parse(payload);
    eventId = typeof event?.id === "string" && event.id.startsWith("evt_") ? event.id : "";
    eventType = typeof event?.type === "string" ? event.type : "";
    if (!eventId || !eventType) {
      emit("rejected", "malformed_event");
      return NextResponse.json({ error: "Malformed Stripe event." }, { status: 400 });
    }

    const registeredStatus = await registerDelivery(eventId, eventType);
    if (registeredStatus === "processed" || registeredStatus === "ignored") {
      emit("duplicate");
      return NextResponse.json({ received: true, processed: registeredStatus === "processed", duplicate: true });
    }

    if (!RELEVANT_EVENTS.has(eventType)) {
      await markDelivery(eventId, "ignored");
      emit("ignored", "event_not_relevant");
      return NextResponse.json({ received: true, processed: false });
    }

    const object = event?.data?.object;
    const subscription = await subscriptionForEvent(eventType, object);
    if (!subscription) {
      await markDelivery(eventId, "ignored");
      emit("ignored", "subscription_not_resolved");
      return NextResponse.json({ received: true, processed: false });
    }

    const userId = stripeUserIdFromObject(subscription) || stripeUserIdFromObject(object);
    if (!userId) {
      await markDelivery(eventId, "ignored");
      emit("ignored", "user_mapping_missing");
      return NextResponse.json({ received: true, processed: false });
    }

    await updateSubscriptionEntitlement(userId, subscription);
    await markDelivery(eventId, "processed");
    emit("success");
    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    if (eventId) {
      try { await markDelivery(eventId, "failed"); } catch {
        emit("failed", "audit_update_failed");
      }
    }
    emit("failed", "processing_failed");
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
