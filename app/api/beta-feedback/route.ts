import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildOperationalEvent, emitOperationalEvent } from "../../../lib/operational-observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = new Set(["bug", "calculation_question", "ux", "feature_request", "other"]);
const MAX_FEEDBACK_PER_HOUR = 10;

function userClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function safePagePath(value: unknown) {
  const path = String(value || "").trim().slice(0, 200);
  return path.startsWith("/") ? path : null;
}

export async function POST(req: Request) {
  const startedAtMs = Date.now();
  const authorization = req.headers.get("authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    emitOperationalEvent(buildOperationalEvent({
      event: "beta.feedback",
      outcome: "rejected",
      reasonCode: "missing_session",
      startedAtMs,
    }));
    return NextResponse.json({ error: "Faça login para enviar feedback." }, { status: 401 });
  }

  const supabase = userClient(accessToken);
  if (!supabase) {
    emitOperationalEvent(buildOperationalEvent({
      event: "beta.feedback",
      outcome: "failed",
      reasonCode: "auth_environment_unavailable",
      startedAtMs,
    }));
    return NextResponse.json({ error: "Feedback indisponível no ambiente." }, { status: 503 });
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      emitOperationalEvent(buildOperationalEvent({
        event: "beta.feedback",
        outcome: "rejected",
        reasonCode: "invalid_session",
        startedAtMs,
      }));
      return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
    }

    const body = await req.json();
    const category = String(body?.category || "").trim();
    const message = String(body?.message || "").trim();
    const pagePath = safePagePath(body?.pagePath);

    if (!CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Selecione uma categoria válida." }, { status: 400 });
    }
    if (message.length < 10 || message.length > 2000) {
      return NextResponse.json({ error: "O feedback deve ter entre 10 e 2.000 caracteres." }, { status: 400 });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: quotaError } = await supabase
      .from("beta_feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if (quotaError) {
      emitOperationalEvent(buildOperationalEvent({
        event: "beta.feedback",
        outcome: "failed",
        reasonCode: "quota_check_failed",
        mode: category,
        startedAtMs,
      }));
      return NextResponse.json({ error: "Não foi possível validar o limite de feedback agora." }, { status: 503 });
    }

    if ((recentCount || 0) >= MAX_FEEDBACK_PER_HOUR) {
      emitOperationalEvent(buildOperationalEvent({
        event: "beta.feedback",
        outcome: "rejected",
        reasonCode: "hourly_quota_exceeded",
        mode: category,
        startedAtMs,
      }));
      return NextResponse.json(
        { error: "Limite temporário de feedback atingido. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } },
      );
    }

    const { data, error } = await supabase
      .from("beta_feedback")
      .insert({
        user_id: user.id,
        category,
        message,
        page_path: pagePath,
      })
      .select("id,created_at")
      .single();

    if (error || !data) {
      emitOperationalEvent(buildOperationalEvent({
        event: "beta.feedback",
        outcome: "failed",
        reasonCode: "persistence_failed",
        mode: category,
        startedAtMs,
      }));
      return NextResponse.json({ error: "Não foi possível registrar o feedback agora." }, { status: 500 });
    }

    emitOperationalEvent(buildOperationalEvent({
      event: "beta.feedback",
      outcome: "success",
      mode: category,
      startedAtMs,
    }));

    return NextResponse.json(
      { ok: true, id: data.id, createdAt: data.created_at },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    emitOperationalEvent(buildOperationalEvent({
      event: "beta.feedback",
      outcome: "failed",
      reasonCode: "unexpected_error",
      startedAtMs,
    }));
    return NextResponse.json({ error: "Não foi possível registrar o feedback agora." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const authorization = req.headers.get("authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return NextResponse.json({ error: "Faça login para consultar feedback." }, { status: 401 });

  const supabase = userClient(accessToken);
  if (!supabase) return NextResponse.json({ error: "Feedback indisponível no ambiente." }, { status: 503 });

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const { data, error } = await supabase
    .from("beta_feedback")
    .select("id,category,message,page_path,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: "Não foi possível consultar seu feedback." }, { status: 500 });

  return NextResponse.json(
    { feedback: data || [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(req: Request) {
  const startedAtMs = Date.now();
  const authorization = req.headers.get("authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return NextResponse.json({ error: "Faça login para excluir feedback." }, { status: 401 });

  const supabase = userClient(accessToken);
  if (!supabase) return NextResponse.json({ error: "Feedback indisponível no ambiente." }, { status: 503 });

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Informe o feedback que deseja excluir." }, { status: 400 });
  }

  const id = String(body.id || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Identificador de feedback inválido." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("beta_feedback")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    emitOperationalEvent(buildOperationalEvent({
      event: "beta.feedback",
      outcome: "failed",
      reasonCode: "delete_failed",
      mode: "delete",
      startedAtMs,
    }));
    return NextResponse.json({ error: "Não foi possível excluir o feedback agora." }, { status: 500 });
  }

  if (!data?.length) {
    return NextResponse.json({ error: "Feedback não encontrado." }, { status: 404 });
  }

  emitOperationalEvent(buildOperationalEvent({
    event: "beta.feedback",
    outcome: "success",
    mode: "delete",
    startedAtMs,
  }));

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
