"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setMessage("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        setMessage("Conta criada. Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Não foi possível concluir a operação.");
    } finally { setLoading(false); }
  }

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f7f7f4"}}>
    <section style={{width:"100%",maxWidth:440,background:"white",border:"1px solid #e6e6df",borderRadius:20,padding:32,boxShadow:"0 16px 50px rgba(0,0,0,.06)"}}>
      <a href="/" style={{fontWeight:800,color:"#111",textDecoration:"none"}}>← ImportaFácil</a>
      <h1 style={{fontSize:32,margin:"28px 0 8px"}}>{mode === "signup" ? "Crie sua conta" : "Entrar no ImportaFácil"}</h1>
      <p style={{color:"#666",marginBottom:24}}>{mode === "signup" ? "Salve suas simulações e acompanhe sua evolução." : "Acesse suas simulações salvas."}</p>
      <form onSubmit={submit} style={{display:"grid",gap:14}}>
        {mode === "signup" && <input required placeholder="Seu nome" value={name} onChange={e=>setName(e.target.value)} style={input}/>} 
        <input required type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={input}/>
        <input required minLength={6} type="password" placeholder="Senha (mínimo 6 caracteres)" value={password} onChange={e=>setPassword(e.target.value)} style={input}/>
        <button disabled={loading} style={button}>{loading ? "Aguarde..." : mode === "signup" ? "Criar conta" : "Entrar"}</button>
      </form>
      {message && <p style={{marginTop:16,padding:12,borderRadius:10,background:"#f1f1ec"}}>{message}</p>}
      <button onClick={()=>setMode(mode === "signup" ? "login" : "signup")} style={{marginTop:20,border:0,background:"none",cursor:"pointer",color:"#555"}}>
        {mode === "signup" ? "Já tenho uma conta → Entrar" : "Ainda não tenho conta → Criar conta"}
      </button>
    </section>
  </main>
}

const input: React.CSSProperties = {width:"100%",boxSizing:"border-box",padding:"13px 14px",border:"1px solid #ddd",borderRadius:10,fontSize:16};
const button: React.CSSProperties = {padding:"14px 16px",border:0,borderRadius:10,background:"#111",color:"white",fontSize:16,fontWeight:700,cursor:"pointer"};
