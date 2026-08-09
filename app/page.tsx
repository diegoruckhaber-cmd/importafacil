"use client";

import { useMemo, useState } from "react";

const br=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const initial={quantity:1000,fobUsd:10,fx:5.5,freightUsd:1200,insuranceUsd:100,otherBrl:3500,ii:12,ipi:0,pis:2.1,cofins:9.65,icms:17,margin:30};
const labels:Record<string,string>={quantity:"Quantidade",fobUsd:"Preço unitário FOB (US$)",fx:"Câmbio (R$/US$)",freightUsd:"Frete internacional (US$)",insuranceUsd:"Seguro internacional (US$)",otherBrl:"Outras despesas (R$)",ii:"II (%)",ipi:"IPI (%)",pis:"PIS (%)",cofins:"COFINS (%)",icms:"ICMS (%)",margin:"Margem desejada (%)"};

function calc(s:any){
 const merchandise=s.quantity*s.fobUsd*s.fx, freight=s.freightUsd*s.fx, insurance=s.insuranceUsd*s.fx;
 const cif=merchandise+freight+insurance, ii=cif*s.ii/100, ipi=(cif+ii)*s.ipi/100;
 const pis=cif*s.pis/100, cofins=cif*s.cofins/100, base=cif+ii+ipi+pis+cofins+s.otherBrl;
 const icms=s.icms>=100?0:base*(s.icms/100)/(1-s.icms/100), total=base+icms;
 const unit=total/s.quantity, sale=s.margin>=100?0:unit/(1-s.margin/100);
 return {total,unit,sale,profit:sale*s.quantity-total,tax:ii+ipi+pis+cofins+icms};
}

export default function Home(){
 const [s,setS]=useState(initial), [result,setResult]=useState<any>(null), [email,setEmail]=useState(""), [lead,setLead]=useState(""), [saving,setSaving]=useState(false);
 const r=useMemo(()=>calc(s),[s]);
 const change=(k:string,v:string)=>setS((x:any)=>({...x,[k]:Number(v)}));
 const calculate=()=>setResult(r);
 const capture=async(e:any)=>{e.preventDefault(); if(!email.includes("@")) return setLead("Digite um e-mail válido."); setSaving(true); setLead(""); try { const res=await fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,source:"landing_page"})}); const data=await res.json(); if(!res.ok) throw new Error(data.error||"Erro"); setLead("Cadastro recebido. Você está na lista de acesso antecipado."); setEmail(""); } catch { setLead("Não conseguimos concluir agora. Tente novamente em instantes."); } finally { setSaving(false); }};

 return <main>
  <header>
   <div className="wrap nav"><b className="logo">ImportaFácil</b><a href="#pro">PRO</a></div>
   <section className="wrap hero">
    <div><div className="eyebrow">PRÉ-ESTUDO DE IMPORTAÇÃO</div>
     <h1>Antes de importar, descubra se a conta fecha.</h1>
     <p>Calcule custo nacionalizado, preço mínimo e lucro estimado — e compare decisões de compra com muito mais clareza.</p>
     <div className="heroActions"><a className="primary" href="#simulador">Simular gratuitamente</a><a className="ghost" href="#pro">Conhecer o PRO</a></div>
     <div className="proof"><span>✓ Sem cartão</span><span>✓ Resultado em segundos</span><span>✓ Premissas transparentes</span></div>
    </div>
    <div className="heroPanel"><small>EXEMPLO</small><b>Importação de 1.000 unidades</b><div className="big">{br(calc(initial).unit)}<span>/un.</span></div><div className="mini"><span>Preço mínimo</span><strong>{br(calc(initial).sale)}</strong></div><div className="mini"><span>Lucro estimado</span><strong>{br(calc(initial).profit)}</strong></div></div>
   </section>
  </header>

  <section className="wrap section" id="simulador">
   <div className="sectionHead"><div><div className="eyebrow dark">CALCULADORA GRATUITA</div><h2>Faça sua primeira simulação</h2><p>Use valores aproximados agora. Depois, valide NCM e tratamento tributário nas fontes oficiais.</p></div></div>
   <div className="grid">
    <div className="card">
     <div className="fields">{Object.entries(s).map(([k,v])=><label key={k}>{labels[k]||k}<input aria-label={labels[k]||k} type="number" min="0" step="any" value={v as number} onChange={e=>change(k,e.target.value)}/></label>)}</div>
     <button className="primaryBtn" onClick={calculate}>Calcular agora</button>
     <p className="fine">Os resultados são estimativos e não substituem classificação fiscal, tratamento administrativo ou orientação profissional.</p>
    </div>
    <div className="card result">
     <div className="resultTop"><h3>Seu resultado</h3><span>Estimativa</span></div>
     {!result?<div className="empty">Preencha as premissas e clique em calcular.</div>:
      <div className="metrics"><Metric t="Custo total" v={br(result.total)} hi/><Metric t="Custo por unidade" v={br(result.unit)}/><Metric t="Preço mínimo" v={br(result.sale)}/><Metric t="Lucro estimado" v={br(result.profit)}/><Metric t="Impostos estimados" v={br(result.tax)}/></div>}
    </div>
   </div>
  </section>

  <section className="darkSection">
   <div className="wrap two"><div><div className="eyebrow">NÃO É SÓ UMA CALCULADORA</div><h2>Uma camada de decisão para quem importa.</h2><p>O objetivo é transformar dados dispersos em uma resposta simples: quanto custa, quanto preciso vender e se essa operação merece meu capital.</p></div>
   <div className="features"><Feature n="01" t="Custo real" d="Mercadoria, logística, tributos e despesas em uma visão única."/><Feature n="02" t="Cenários" d="Compare fornecedores, lotes e premissas antes de decidir."/><Feature n="03" t="Risco" d="Valide NCM e acompanhe pontos regulatórios relevantes."/><Feature n="04" t="Rentabilidade" d="Preço mínimo, margem, lucro e capital necessário." /></div></div>
  </section>

  <section className="wrap section" id="pro">
   <div className="sectionHead"><div><div className="eyebrow dark">PLANO PRO</div><h2>Quando importar deixa de ser uma aposta.</h2><p>Estamos validando a disposição de pagamento antes de conectar o checkout.</p></div></div>
   <div className="priceGrid">
    <div className="priceCard"><small>GRÁTIS</small><h3>Para testar</h3><b>R$ 0</b><ul><li>Calculadora básica</li><li>Pré-estudo de custo</li><li>Preço mínimo estimado</li><li>Teste sem cartão</li></ul><a className="secondaryBtn" href="#simulador">Começar grátis</a></div>
    <div className="priceCard featured"><div className="tag">OFERTA DE VALIDAÇÃO</div><small>PRO</small><h3>Para quem importa</h3><b>R$ 29,90<em>/mês</em></b><ul><li>Histórico na nuvem</li><li>Comparação de cenários</li><li>Relatórios profissionais</li><li>NCMs monitoradas</li><li>Indicadores de margem e ROI</li></ul><button className="secondaryBtn" onClick={()=>document.getElementById("lead")?.scrollIntoView({behavior:"smooth"})}>Quero ser avisado</button></div>
    <div className="priceCard"><small>EMPRESA</small><h3>Para equipes</h3><b>Em breve</b><ul><li>Múltiplos usuários</li><li>Dashboard</li><li>Várias NCMs</li><li>Alertas</li><li>Controle por empresa</li></ul><button className="secondaryBtn" onClick={()=>document.getElementById("lead")?.scrollIntoView({behavior:"smooth"})}>Entrar na lista</button></div>
   </div>
  </section>

  <section className="wrap lead" id="lead"><div><div className="eyebrow dark">PRIMEIROS USUÁRIOS</div><h2>Quer testar antes do lançamento?</h2><p>Entre na lista de acesso antecipado. Vamos usar os primeiros usuários para definir recursos e preço do PRO.</p></div>
   <form onSubmit={capture}><input type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/><button className="primaryBtn" disabled={saving}>{saving?"Enviando...":"Entrar na lista"}</button><small>{lead}</small></form>
  </section>

  <footer><div className="wrap"><b>ImportaFácil</b><span>© 2026 • MVP em validação</span></div></footer>
 </main>
}
function Metric({t,v,hi}:{t:string,v:string,hi?:boolean}){return <div className={"metric "+(hi?"hi":"")}><small>{t}</small><b>{v}</b></div>}
function Feature({n,t,d}:{n:string,t:string,d:string}){return <div className="feature"><span>{n}</span><div><b>{t}</b><p>{d}</p></div></div>}
