import { NextResponse } from "next/server";

const SUPABASE_URL = "https://fagjbhhmbpdsmoyjcood.supabase.co";
const SUPABASE_KEY = "sb_publishable_9akcQKdMBZYFvwCbNvnW-A_n0rYOudi";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const source = String(body.source || "landing_page").slice(0, 80);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Digite um e-mail válido." }, { status: 400 });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({ email, source })
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Não foi possível concluir o cadastro agora." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível concluir o cadastro agora." }, { status: 500 });
  }
}
