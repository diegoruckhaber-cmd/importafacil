import { createHash, randomUUID } from "node:crypto";
import { supabaseAdminHeaders, supabaseElevatedKeyFromEnv } from "./supabase-admin.ts";

export async function persistOfficialSimulation(userId: string, name: string, input: unknown, result: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Persistência indisponível.");
  const execution = {
    id: randomUUID(),
    source: "official_server",
    executedAt: new Date().toISOString(),
    deploymentCommit: process.env.VERCEL_GIT_COMMIT_SHA || "local",
    inputSha256: createHash("sha256").update(JSON.stringify(input)).digest("hex"),
    resultSha256: createHash("sha256").update(JSON.stringify(result)).digest("hex"),
  };
  const response = await fetch(`${url}/rest/v1/rpc/save_official_simulation`, {
    method: "POST",
    headers: { ...supabaseAdminHeaders(supabaseElevatedKeyFromEnv()), "Content-Type": "application/json" },
    body: JSON.stringify({ p_user_id: userId, p_name: name, p_input: input, p_result: result, p_execution: execution }),
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (payload.code === "P0001" && payload.message === "simulation_limit_reached") return { limited: true as const };
    throw new Error("Não foi possível salvar a execução oficial.");
  }
  const [record] = await response.json();
  if (!record?.id) throw new Error("Resposta de persistência inválida.");
  return { limited: false as const, id: record.id, createdAt: record.created_at, execution };
}
