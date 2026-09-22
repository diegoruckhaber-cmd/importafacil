"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Upgrade(){
 const[ready,setReady]=useState(false);
 const[loading,setLoading]=useState(false);
 const[portalLoading,setPortalLoading]=useState(false);
 const[error,setError]=useState("");
 const[plan,setPlan]=useState("FREE");
 const[status,setStatus]=useState("none");
 const[currentPeriodEnd,setCurrentPeriodEnd]=useState<string|null>(null);
 const[notice,setNotice]=useState("");

 useEffect(()=>{(async()=>{
   const{data:{session}}=await supabase.auth.getSession();
   if(!session?.user){location.href="/auth";return}
   const params=new URLSearchParams(window.location.search);
   if(params.get("portal")==="returned")setNotice("As alterações de cobrança são sincronizadas automaticamente após confirmação da Stripe.");
   try{
     const response=await fetch("/api/subscription",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"});
     if(response.ok){
       const data=await response.json();
       setPlan(String(data.plan||"FREE").toUpperCase());
       setStatus(String(data.status||"none"));
       setCurrentPeriodEnd(data.currentPeriodEnd||null);
     }
   }finally{setReady(true)}
 })()},[]);

 async function authenticatedPost(path:string){
   const{data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token){location.href="/auth";return null}
   return fetch(path,{method:"POST",headers:{Authorization:"Bearer "+session.access_token}});
 }

 async function checkout(){
   setLoading(true);setError("");
   const r=await authenticatedPost("/api/checkout");
   if(!r){setLoading(false);return}
   const d=await r.json().catch(()=>({}));
   if(!r.ok){setError(d.error||"Não foi possível iniciar o checkout.");setLoading(false);return}
   location.href=d.url;
 }

 async function manageBilling(){
   setPortalLoading(true);setError("");
   const r=await authenticatedPost("/api/billing-portal");
   if(!r){setPortalLoading(false);return}
   const d=await r.json().catch(()=>({}));
   if(!r.ok){setError(d.error||"Não foi possível abrir o portal de cobrança.");setPortalLoading(false);return}
   location.href=d.url;
 }

 const isPro=plan==="PRO";
 const periodLabel=currentPeriodEnd?new Date(currentPeriodEnd).toLocaleDateString("pt-BR"):null;

 return <main className="accountPage"><div className="accountShell">
   <div className="accountCard">
     <a href="/dashboard" className="accountBack">← Voltar ao painel</a>
     <small className="accountEyebrow">IMPORTAFÁCIL PRO</small>
     <h1 className="accountTitle">{isPro?"Seu PRO está ativo.":"Mais decisões. Menos planilhas."}</h1>
     <p className="accountIntro">
       {isPro?"Gerencie sua assinatura, cobrança e documentos sem sair do fluxo do ImportaFácil.":"Tenha as ferramentas que transformam uma simulação em uma decisão de importação."}
     </p>
     {notice&&<div className="productNoticeInfo">{notice}</div>}
     <div className="upgradeBenefits">
       {["Comparação de cenários","Histórico completo de simulações","Relatórios profissionais","Recursos avançados do ImportaFácil"].map(x=><div key={x} className="upgradeBenefit">✓ {x}</div>)}
     </div>
     {isPro?<>
       <div style={{padding:14,borderRadius:11,background:"#eef8ef",border:"1px solid #cce7cf",marginBottom:18}}>
         <b>Plano PRO</b> · status {status}{periodLabel?" · período atual até "+periodLabel:""}
       </div>
       <div style={{display:"grid",gap:10}}>
         <button onClick={manageBilling} disabled={portalLoading||!ready} className="productPrimaryWide">
           {portalLoading?"Abrindo portal...":"Gerenciar assinatura e cobrança"}
         </button>
         <a href="/dashboard" className="productSecondaryWide">Ir para meu painel</a>
       </div>
       <p className="billingFine">No portal seguro da Stripe você pode atualizar a forma de pagamento, consultar faturas e solicitar o cancelamento da assinatura.</p>
     </>:<>
       <div className="priceLine"><strong>R$ 29,90</strong><span>/ mês</span></div>
       <button onClick={checkout} disabled={loading||!ready} className="productPrimaryWide">{loading?"Abrindo checkout...":"Assinar PRO"}</button>
       <p className="billingFine">O pagamento é processado com segurança pela Stripe. O plano PRO só é liberado após confirmação da assinatura.</p>
     </>}
     {error&&<p className="productError">{error}</p>}
   </div>
 </div></main>
}
