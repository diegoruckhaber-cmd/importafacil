"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        router.push("/sc-operation");
        router.refresh();
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;

      if (data.session) {
        router.push("/sc-operation");
        router.refresh();
        return;
      }

      setMessage("Conta criada. Verifique seu e-mail para confirmar o cadastro e depois faça login.");
      setMode("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a autenticação.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f6f7f9", fontFamily: "system-ui" }}>
      <section style={{ width: "100%", maxWidth: 430, background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,.06)" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#64748b" }}>ImportaFácil</div>
          <h1 style={{ margin: "8px 0 6px", fontSize: 30 }}>{mode === "login" ? "Entrar" : "Criar sua conta"}</h1>
          <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
            {mode === "login" ? "Acesse suas simulações de importação." : "Crie sua conta para salvar e recuperar suas simulações."}
          </p>
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600 }}>
            E-mail
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" placeholder="voce@empresa.com.br" style={{ padding: "12px 13px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 16 }} />
          </label>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600 }}>
            Senha
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Mínimo de 6 caracteres" style={{ padding: "12px 13px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 16 }} />
          </label>

          {error && <div style={{ padding: 12, borderRadius: 10, background: "#fef2f2", color: "#b91c1c", fontSize: 14 }}>{error}</div>}
          {message && <div style={{ padding: 12, borderRadius: 10, background: "#f0fdf4", color: "#166534", fontSize: 14 }}>{message}</div>}

          <button type="submit" disabled={busy} style={{ border: 0, borderRadius: 10, padding: "13px 16px", background: "#111827", color: "white", fontSize: 16, fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>
            {busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }} style={{ marginTop: 18, border: 0, background: "transparent", color: "#2563eb", cursor: "pointer", fontSize: 14 }}>
          {mode === "login" ? "Ainda não tenho uma conta" : "Já tenho uma conta"}
        </button>
      </section>
    </main>
  );
}
