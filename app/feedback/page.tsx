"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type FeedbackRow = {
  id: string;
  category: string;
  message: string;
  page_path: string | null;
  created_at: string;
};

const labels: Record<string, string> = {
  bug: "Problema / erro",
  calculation_question: "Dúvida sobre cálculo",
  ux: "Experiência de uso",
  feature_request: "Sugestão de recurso",
  other: "Outro",
};

export default function FeedbackPage() {
  const [category, setCategory] = useState("bug");
  const [message, setMessage] = useState("");
  const [pagePath, setPagePath] = useState("");
  const [history, setHistory] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [notice, setNotice] = useState("");

  async function authToken() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      location.href = "/auth";
      return null;
    }
    return session.access_token;
  }

  async function loadHistory() {
    const token = await authToken();
    if (!token) return;
    const response = await fetch("/api/beta-feedback", {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      setHistory(Array.isArray(data.feedback) ? data.feedback : []);
    }
    setLoading(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    if (from?.startsWith("/")) setPagePath(from.slice(0, 200));
    loadHistory();
  }, []);

  async function removeFeedback(id: string) {
    if (!window.confirm("Excluir este feedback da sua conta?")) return;
    setDeletingId(id);
    setNotice("");
    const token = await authToken();
    if (!token) return;

    const response = await fetch("/api/beta-feedback", {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice(data.error || "Não foi possível excluir o feedback.");
      setDeletingId("");
      return;
    }

    setHistory(rows => rows.filter(row => row.id !== id));
    setNotice("Feedback excluído da sua conta.");
    setDeletingId("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setNotice("");
    const token = await authToken();
    if (!token) return;

    const response = await fetch("/api/beta-feedback", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category, message, pagePath: pagePath || null }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice(data.error || "Não foi possível enviar o feedback.");
      setSending(false);
      return;
    }

    setMessage("");
    setNotice("Obrigado. O feedback foi registrado para revisão do beta.");
    setSending(false);
    await loadHistory();
  }

  return (
    <main style={{minHeight:"100vh",background:"#f7f7f4",padding:"48px 24px"}}>
      <div style={{maxWidth:860,margin:"auto"}}>
        <a href="/dashboard" style={{color:"#111"}}>← Meu painel</a>
        <small style={{display:"block",marginTop:30,letterSpacing:1,color:"#777"}}>BETA CONTROLADO</small>
        <h1 style={{fontSize:42,margin:"8px 0 12px"}}>Feedback do ImportaFácil</h1>
        <p style={{color:"#666",lineHeight:1.6,maxWidth:720}}>
          Encontrou um erro, ficou com dúvida sobre um cálculo ou percebeu algo que pode melhorar?
          Registre aqui. O conteúdo do feedback fica associado à sua conta para acompanhamento e não é enviado aos logs de telemetria.
        </p>

        <form onSubmit={submit} style={{marginTop:26,background:"white",border:"1px solid #e5e5df",borderRadius:18,padding:24,display:"grid",gap:16}}>
          <label style={label}>
            Categoria
            <select value={category} onChange={e=>setCategory(e.target.value)} style={input}>
              {Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label style={label}>
            O que aconteceu?
            <textarea
              required
              minLength={10}
              maxLength={2000}
              value={message}
              onChange={e=>setMessage(e.target.value)}
              placeholder="Descreva o contexto, o resultado esperado e o que você observou."
              style={{...input,minHeight:150,resize:"vertical"}}
            />
            <small style={{color:"#888",fontWeight:400}}>{message.length}/2000 caracteres</small>
          </label>
          <label style={label}>
            Página relacionada (opcional)
            <input value={pagePath} onChange={e=>setPagePath(e.target.value.slice(0,200))} placeholder="/simulacao-v2" style={input}/>
          </label>
          <button disabled={sending} style={button}>{sending?"Enviando...":"Enviar feedback"}</button>
          {notice&&<div role="status" style={{padding:12,borderRadius:10,background:"#f1f1ec"}}>{notice}</div>}
        </form>

        <section style={{marginTop:32}}>
          <h2 style={{fontSize:26}}>Meus feedbacks recentes</h2>
          {loading?<p>Carregando...</p>:history.length===0?<p style={{color:"#777"}}>Você ainda não enviou feedback nesta conta.</p>:
            <div style={{display:"grid",gap:10}}>
              {history.map(row=><article key={row.id} style={{background:"white",border:"1px solid #e5e5df",borderRadius:14,padding:18}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                  <b>{labels[row.category]||row.category}</b>
                  <small style={{color:"#888"}}>{new Date(row.created_at).toLocaleString("pt-BR")}</small>
                </div>
                <p style={{lineHeight:1.55,whiteSpace:"pre-wrap"}}>{row.message}</p>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginTop:10,flexWrap:"wrap"}}>
                  {row.page_path?<small style={{color:"#777"}}>Página: {row.page_path}</small>:<span />}
                  <button
                    type="button"
                    disabled={deletingId===row.id}
                    onClick={()=>removeFeedback(row.id)}
                    style={{border:"1px solid #d7d7d0",background:"white",borderRadius:8,padding:"8px 10px",cursor:"pointer"}}
                  >
                    {deletingId===row.id?"Excluindo...":"Excluir"}
                  </button>
                </div>
              </article>)}
            </div>
          }
        </section>
      </div>
    </main>
  );
}

const label: React.CSSProperties={display:"grid",gap:7,fontSize:13,fontWeight:800,color:"#555"};
const input: React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"12px 13px",border:"1px solid #d6d6cf",borderRadius:10,fontSize:15,fontFamily:"inherit",background:"white"};
const button: React.CSSProperties={padding:"14px 16px",border:0,borderRadius:10,background:"#111",color:"white",fontWeight:800,fontSize:15,cursor:"pointer"};
