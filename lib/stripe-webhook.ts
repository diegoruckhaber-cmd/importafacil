import crypto from "node:crypto";

export const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = STRIPE_WEBHOOK_TOLERANCE_SECONDS,
) {
  if (!payload || !signatureHeader || !secret) return false;
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestampRaw = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  const timestamp = Number(timestampRaw);
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;

  const expectedHex = crypto.createHmac("sha256", secret).update(`${timestampRaw}.${payload}`).digest("hex");
  const expected = Buffer.from(expectedHex, "hex");

  return signatures.some((signatureHex) => {
    if (!/^[0-9a-f]+$/i.test(signatureHex) || signatureHex.length !== expectedHex.length) return false;
    const received = Buffer.from(signatureHex, "hex");
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  });
}

export function planForStripeSubscriptionStatus(status?: string | null) {
  return status === "active" || status === "trialing" ? "PRO" as const : "FREE" as const;
}

export function stripeSubscriptionIdFromObject(object: any): string | null {
  const direct = object?.subscription;
  if (typeof direct === "string" && direct) return direct;
  if (typeof direct?.id === "string" && direct.id) return direct.id;
  const parentSubscription = object?.parent?.subscription_details?.subscription;
  if (typeof parentSubscription === "string" && parentSubscription) return parentSubscription;
  if (typeof parentSubscription?.id === "string" && parentSubscription.id) return parentSubscription.id;
  return null;
}

export function stripeUserIdFromObject(object: any): string | null {
  const userId = object?.metadata?.user_id || object?.client_reference_id;
  return typeof userId === "string" && userId.trim() ? userId.trim() : null;
}
