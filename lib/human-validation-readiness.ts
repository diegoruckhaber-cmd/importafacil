import { supabaseAdminHeaders, supabaseElevatedKeyFromEnv } from "./supabase-admin";

import { summarizeHumanValidation, type HumanValidationReadiness } from "./human-validation-status";

async function exists(path: string, filters: Record<string, string>) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = supabaseElevatedKeyFromEnv();
  if (!baseUrl || !key) throw new Error("Supabase backend environment unavailable.");

  const params = new URLSearchParams({ select: "id", limit: "1", ...filters });
  const response = await fetch(`${baseUrl}/rest/v1/${path}?${params.toString()}`, {
    headers: { ...supabaseAdminHeaders(key), Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Human validation query failed for ${path}.`);
  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0;
}

export async function getHumanValidationReadiness(): Promise<HumanValidationReadiness> {
  try {
    const [verifiedV2, livePro, pilotResponse] = await Promise.all([
      exists("simulations", {
        "server_execution": "not.is.null",
        "result->>contract": "eq.importafacil-simulation-v2",
      }),
      exists("subscriptions", {
        provider: "eq.stripe",
        plan: "eq.PRO",
        status: "in.(active,trialing)",
      }),
      exists("pilot_responses", {}),
    ]);

    return summarizeHumanValidation([
      { id: "server_verified_v2", satisfied: verifiedV2 },
      { id: "live_pro_subscription", satisfied: livePro },
      { id: "pilot_response", satisfied: pilotResponse },
    ]);
  } catch {
    return {
      contract: "importafacil-human-validation-v1",
      status: "unavailable",
      markers: [
        { id: "server_verified_v2", satisfied: false },
        { id: "live_pro_subscription", satisfied: false },
        { id: "pilot_response", satisfied: false },
      ],
    };
  }
}
