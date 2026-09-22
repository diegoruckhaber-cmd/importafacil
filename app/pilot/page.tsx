"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const labels = ["", "Muito baixo", "Baixo", "Neutro", "Alto", "Muito alto"];

export default function PilotPage() {
  const [ease, setEase] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [value, setValue] = useState(0);
  const [wouldPay, setWouldPay] = useState<"" | "yes" | "no">("");
  const [blocker, setBlocker] = useState("");
  const [pricingComment, setPricingComment] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function token() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      location.href = "/auth";
      return null;
    }
    return session.access_token;
  }

  useEffect(() => {
    (async () => {
      const accessToken = await token();
      if (!accessToken) return;
      const response = await fetch("/api/pilot-pulse", {
        headers: { Authorization: "Bearer " + accessToken },
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data.response) return;
      setEase(Number(data.response.ease_score || 0));
      setConfidence(Number(data.response.confidence_score || 0));
      setValue(Number(data.response.value_score || 0));
      setWouldPay(data.response.would_pay ? "yes" : "no");
      setBlocker(data.response.blocker || "");
      setPricingComment(data.response.pricing_comment || "");
    })();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    if (!ease || !confidence || !value || !wouldPay) {
      setNotice("Preencha as três notas e a pergunta sobre o plano PRO.");
      return;
    }
    setSaving(true);
    const accessToken = await token();
    if (!accessToken) return;

    const response = await fetch("/api/pilot-pulse", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        easeScore: ease,
        confidenceScore: confidence,
        valueScore: value,
        wouldPay: wouldPay === "yes",
        blocker,
        pricingComment,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Avaliação salva. Obrigado por participar do piloto." : (data.error || "Não foi possível salvar."));
    setSaving(false);
  }

  return (
    <main className="productContentPage">
      <div className="productContentShell">
        <div className="productPageTop">
          <a href="/dashboard" className="accountBack">← Meu painel</a>
          <a href="/feedback?from=/pilot" className="secondaryBtn">Relatar problema</a>
        </div>
        <article className="productArticle">
          <small className="productEyebrow">PILOTO IMPORTAFÁCIL</small>
          <h1 className="productPageTitle">Como foi sua experiência?</h1>
          <p className="productLead">São cinco respostas rápidas para sabermos o que precisa melhorar antes de ampliar o beta.</p>

          <form onSubmit={submit} className="pilotForm">
            <Score label="Facilidade para concluir a simulação" value={ease} set={setEase} />
            <Score label="Confiança no resultado apresentado" value={confidence} set={setConfidence} />
            <Score label="Valor percebido para sua rotina de importação" value={value} set={setValue} />

            <fieldset className="pilotFieldset">
              <legend>Você pagaria R$ 29,90/mês pelo PRO com os recursos atuais?</legend>
              <label><input type="radio" name="would-pay" checked={wouldPay==="yes"} onChange={()=>setWouldPay("yes")} /> Sim</label>
              <label><input type="radio" name="would-pay" checked={wouldPay==="no"} onChange={()=>setWouldPay("no")} /> Não</label>
            </fieldset>

            <label className="pilotLabel">O que mais atrapalhou ou gerou dúvida? <span>(opcional)</span>
              <textarea maxLength={1000} value={blocker} onChange={e=>setBlocker(e.target.value)} placeholder="Conte o principal ponto de atrito." />
            </label>
            <label className="pilotLabel">Comentário sobre o valor do PRO <span>(opcional)</span>
              <textarea maxLength={1000} value={pricingComment} onChange={e=>setPricingComment(e.target.value)} placeholder="O que faria o plano valer a pena para você?" />
            </label>

            <button className="primaryBtn" type="submit" disabled={saving}>{saving ? "Salvando..." : "Enviar avaliação"}</button>
            {notice && <div className="accountMessage" role="status">{notice}</div>}
          </form>
        </article>
      </div>
    </main>
  );
}

function Score({label,value,set}:{label:string;value:number;set:(value:number)=>void}) {
  return <fieldset className="pilotFieldset"><legend>{label}</legend><div className="pilotScores">
    {[1,2,3,4,5].map(n=><label key={n}><input type="radio" name={label} checked={value===n} onChange={()=>set(n)} /><span>{n}<small>{labels[n]}</small></span></label>)}
  </div></fieldset>;
}
