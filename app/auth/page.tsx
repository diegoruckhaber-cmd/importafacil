"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const AUTH_REDIRECT_URL = "https://importafacil-projetovendas.vercel.app/auth";

function friendlyAuthError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || "");
  const normalized = raw.toLowerCase();

  if (normalized.includes("email rate limit exceeded")) {
    return "O serviço de e-mail atingiu o limite temporário de testes. Aguarde um pouco ou, para o ambiente de desenvolvimento, desative a confirmação de e-mail no Supabase. Você não precisa criar outra conta agora.";
  }
  if (normalized.includes("user already registered")) {
    return "Este e-mail já possui uma conta. Clique em “Já tenho uma conta → Entrar” para acessar o ImportaFácil.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
  }
  if (normalized.includes("password should be at least")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  if (normalized.includes("invalid email")) {
    return "Digite um endereço de e-mail válido.";
  }
  if (normalized.includes("too many requests") || normalized.includes("rate limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.";
  }
  return raw || "Não foi possível concluir a operação. Tente novamente.";
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const error = hash.get("error_description") || hash.get("error");

    if (error) {
      setMessage(friendlyAuthError(decodeURIComponent(error.replace(/\+/g, " "))));
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && window.location.pathname === "/auth") {
        window.location.href = "/dashboard";
      }
    });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: AUTH_REDIRECT_URL,
          },
        });

        if (error) throw error;

        if (data.session) {
          window.location.href = "/dashboard";
          return;
        }

        setMessage("Conta criada. Verifique seu e-mail para confirmar o cadastro.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setMessage(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f7f4" }}>
      <section style={{ width: "100%", maxWidth: 440, background: "white", border: "1px solid #e6e6df", borderRadius: 20, padding: 32, boxShadow: "0 16px 50px rgba(0,0,0,.06)" }}>
        <a href="/" style={{ fontWeight: 800, color: "#111", textDecoration: "none" }}>← ImportaFácil</a>
        <h1 style={{ fontSize: 32, margin: "28px 0 8px" }}>{mode === "signup" ? "Crie sua conta" : "Entrar no ImportaFácil"}</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>{mode === "signup" ? "Salve suas simulações e acompanhe sua evolução." : "Acesse suas simulações salvas."}</p>

        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          {mode === "signup" && <input required placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} style={input} />}
          <input required type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={input} />
          <input required minLength={6} type="password" placeholder="Senha (mínimo 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} style={input} />
          <button disabled={loading} style={{ ...button, opacity: loading ? 0.65 : 1 }}>
            {loading ? "Aguarde..." : mode === "signup" ? "Criar conta" : "Entrar"}
          </button>
        </form>

        {message && <p style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "#f1f1ec", lineHeight: 1.45 }}>{message}</p>}

        <button onClick={() => { setMessage(""); setMode(mode === "signup" ? "login" : "signup"); }} style={{ marginTop: 20, border: 0, background: "none", cursor: "pointer", color: "#555" }}>
          {mode === "signup" ? "Já tenho uma conta → Entrar" : "Ainda não tenho conta → Criar conta"}
        </button>
      </section>
    </main>
  );
}

const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #ddd", borderRadius: 10, fontSize: 16 };
const button: React.CSSProperties = { padding: "14px 16px", border: 0, borderRadius: 10, background: "#111", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer" };
