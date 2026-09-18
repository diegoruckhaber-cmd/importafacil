type StripePortalConfiguration = {
  id: string;
  active?: boolean;
  is_default?: boolean;
  business_profile?: { headline?: string | null } | null;
};

const PORTAL_HEADLINE = "ImportaFácil PRO";

async function stripeRequest(secret: string, path: string, init?: RequestInit) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const type = typeof data?.error?.type === "string" ? data.error.type : "stripe_error";
    throw new Error(`Stripe portal request failed (${response.status}, ${type}).`);
  }
  return data;
}

export async function ensureStripePortalConfiguration(secret: string) {
  const listed = await stripeRequest(
    secret,
    "/v1/billing_portal/configurations?active=true&limit=100",
  );
  const configurations: StripePortalConfiguration[] = Array.isArray(listed?.data) ? listed.data : [];
  const existing =
    configurations.find((row) => row.business_profile?.headline === PORTAL_HEADLINE) ||
    configurations.find((row) => row.is_default) ||
    configurations[0];
  if (existing?.id) return existing.id;

  const params = new URLSearchParams();
  params.set("business_profile[headline]", PORTAL_HEADLINE);
  params.set("features[payment_method_update][enabled]", "true");
  params.set("features[invoice_history][enabled]", "true");
  params.set("features[subscription_cancel][enabled]", "true");
  params.set("features[subscription_cancel][mode]", "at_period_end");

  const created = await stripeRequest(secret, "/v1/billing_portal/configurations", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (typeof created?.id !== "string" || !created.id.startsWith("bpc_")) {
    throw new Error("Stripe portal configuration was not created.");
  }
  return created.id;
}

export async function createStripePortalSession(input: {
  secret: string;
  customerId: string;
  returnUrl: string;
}) {
  const configurationId = await ensureStripePortalConfiguration(input.secret);
  const params = new URLSearchParams();
  params.set("customer", input.customerId);
  params.set("return_url", input.returnUrl);
  params.set("configuration", configurationId);

  const session = await stripeRequest(input.secret, "/v1/billing_portal/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (typeof session?.url !== "string" || !session.url.startsWith("https://")) {
    throw new Error("Stripe portal session did not return a valid URL.");
  }
  return { url: session.url, configurationId };
}
