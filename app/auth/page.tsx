"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Mode = "login" | "signup" | "forgot" | "recovery";

function friendlyAuthError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || "");
  const normalized = raw.toLowerCase();

  if (normalized.includes("email rate limit exceeded")) {
    return "O serviço de e-mail atingiu o limite temporário. Aguarde alguns minutos e tente novamente.";
  }
  if (normalized.includes("user already registered")) {
    return "Este e-mail já possui uma conta. Entre com sua senha ou use a recuperação de acesso.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
  }
  if (normalized.includes("weak password") || normalized.includes("password should be at least")) {
    return "Use uma senha mais forte, com pelo menos 10 caracteres, incluindo maiúscula, minúscula, número e símbolo.";
  }
  if (normalized.includes("same password")) {
    return "A nova senha precisa ser diferente da senha atual.";
  }
  if (normalized.includes("invalid email")) {
    return "Digite um endereço de e-mail válido.";
  }
  if (normalized.includes("too many requests") || normalized.includes("rate limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.";
  }
  return raw || "Não foi possível concluir a operação. Tente novamente.";
}

function passwordIssue(value: string) {
  if (value.length < 10) return "A senha precisa ter pelo menos 10 caracteres.";
  if (!/[a-z]/.test(value)) return "Inclua pelo menos uma letra minúscula.";
  if (!/[A-Z]/.test(value)) return "Inclua pelo menos uma letra maiúscula.";
  if (!/[0-9]/.test(value)) return "Inclua pelo menos um número.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Inclua pelo menos um símbolo.";
  return "";
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const error = hash.get("error_description") || hash.get("error");
    const recoveryFromHash = hash.get("type") === "recovery";

    if (error) {
      setMessage(friendlyAuthError(decodeURIComponent(error.replace(/\+/g, " "))));
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
    if (recoveryFromHash) setMode("recovery");

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("recovery");
        setMessage("Defina uma nova senha forte para concluir a recuperação.");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !recoveryFromHash && window.location.pathname === "/auth") {
        window.location.href = "/dashboard";
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setMessage("");
    setPassword("");
    setPasswordConfirmation("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "forgot") {
        const normalizedEmail = email.trim();
        if (!normalizedEmail) throw new Error("Digite seu e-mail para recuperar o acesso.");
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: window.location.origin + "/auth",
        });
        if (error) throw error;
        setMessage("Se existir uma conta para este e-mail, enviaremos um link de recuperação. Verifique também a caixa de spam.");
        return;
      }

      if (mode === "recovery") {
        const issue = passwordIssue(password);
        if (issue) throw new Error(issue);
        if (password !== passwordConfirmation) throw new Error("As senhas digitadas não coincidem.");

        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await supabase.auth.signOut();
        setPassword("");
        setPasswordConfirmation("");
        setMode("login");
        setMessage("Senha atualizada com sucesso. Entre novamente com sua nova senha.");
        return;
      }

      if (mode === "signup") {
        const issue = passwordIssue(password);
        if (issue) throw new Error(issue);

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin + "/auth",
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

  const isRecovery = mode === "recovery";
  const isForgot = mode === "forgot";

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f7f4" }}>
      <section style={{ width: "100%", maxWidth: 460, background: "white", border: "1px solid #e6e6df", borderRadius: 20, padding: 32, boxShadow: "0 16px 50px rgba(0,0,0,.06)" }}>
        <a href="/" style={{ fontWeight: 800, color: "#111", textDecoration: "none" }}>← ImportaFácil</a>
        <h1 style={{ fontSize: 32, margin: "28px 0 8px" }}>
          {mode === "signup" ? "Crie sua conta" : mode === "login" ? "Entrar no ImportaFácil" : mode === "forgot" ? "Recuperar acesso" : "Criar nova senha"}
        </h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
          {mode === "signup"
            ? "Salve suas simulações e acompanhe sua evolução."
            : mode === "login"
              ? "Acesse suas simulações salvas."
              : mode === "forgot"
                ? "Informe seu e-mail. Por segurança, a resposta não confirma se existe uma conta cadastrada."
                : "Use uma senha nova e forte para proteger sua conta."}
        </p>

        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          {mode === "signup" && <input required autoComplete="name" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} style={input} />}
          {!isRecovery && <input required type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={input} />}
          {!isForgot && (
            <input
              required
              minLength={mode === "signup" || isRecovery ? 10 : 6}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "login" ? "Sua senha" : "Senha forte (mínimo 10 caracteres)"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={input}
            />
          )}
          {isRecovery && (
            <input
              required
              minLength={10}
              type="password"
              autoComplete="new-password"
              placeholder="Confirme a nova senha"
              value={passwordConfirmation}
              onChange={e => setPasswordConfirmation(e.target.value)}
              style={input}
            />
          )}
          {(mode === "signup" || isRecovery) && (
            <small style={{ color: "#777", lineHeight: 1.45 }}>
              Use 10+ caracteres com letra maiúscula, minúscula, número e símbolo. Evite reutilizar senhas de outros serviços.
            </small>
          )}
          <button disabled={loading} style={{ ...button, opacity: loading ? 0.65 : 1 }}>
            {loading
              ? "Aguarde..."
              : mode === "signup"
                ? "Criar conta"
                : mode === "login"
                  ? "Entrar"
                  : mode === "forgot"
                    ? "Enviar link de recuperação"
                    : "Atualizar senha"}
          </button>
        </form>

        {message && <p style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "#f1f1ec", lineHeight: 1.45 }}>{message}</p>}

        {mode === "login" && (
          <button onClick={() => switchMode("forgot")} style={linkButton}>
            Esqueci minha senha
          </button>
        )}
        {!isRecovery && (
          <button onClick={() => switchMode(mode === "signup" ? "login" : "signup")} style={linkButton}>
            {mode === "signup" ? "Já tenho uma conta → Entrar" : "Ainda não tenho conta → Criar conta"}
          </button>
        )}
        {mode === "forgot" && (
          <button onClick={() => switchMode("login")} style={linkButton}>
            ← Voltar para entrar
          </button>
        )}
      </section>
    </main>
  );
}

const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #ddd", borderRadius: 10, fontSize: 16 };
const button: React.CSSProperties = { padding: "14px 16px", border: 0, borderRadius: 10, background: "#111", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer" };
const linkButton: React.CSSProperties = { marginTop: 16, border: 0, background: "none", cursor: "pointer", color: "#555", padding: 0, display: "block" };
