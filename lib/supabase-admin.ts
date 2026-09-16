export type SupabaseElevatedKeyKind = "secret" | "legacy_service_role" | "invalid";

function decodeJwtPayload(key: string): Record<string, unknown> | null {
  try {
    const [, payload] = key.split(".");
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function supabaseElevatedKeyKind(key: string): SupabaseElevatedKeyKind {
  if (key.startsWith("sb_secret_") && key.length > 20) return "secret";
  if (key.startsWith("eyJ")) {
    const payload = decodeJwtPayload(key);
    if (payload?.role === "service_role") return "legacy_service_role";
  }
  return "invalid";
}

export function supabaseElevatedKeyFromEnv() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function supabaseAdminHeaders(key: string): Record<string, string> {
  const kind = supabaseElevatedKeyKind(key);
  if (kind === "secret") return { apikey: key };
  if (kind === "legacy_service_role") {
    return { apikey: key, Authorization: `Bearer ${key}` };
  }
  throw new Error("Supabase elevated backend key is not configured correctly.");
}
