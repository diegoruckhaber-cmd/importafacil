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

 return <main style={{minHeight:"100vh",background:"#f5f7fb",padding:"70px 24px"}}>
   <div style={{maxWidth:720,margin:"auto",background:"white",border:"1px solid #e4e7ec",borderRadius:22,padding:42}}>
     <a href="/dashboard" style={{color:"#315fe2",fontWeight:800,textDecoration:"none"}}>← Voltar</a>
     <small style={{display:"block",marginTop:35,letterSpacing:1,color:"#777"}}>IMPORTAFÁCIL PRO</small>
     <h1 style={{fontSize:44,margin:"8px 0 14px"}}>{isPro?"Seu PRO está ativo.":"Mais decisões. Menos planilhas."}</h1>
     <p style={{fontSize:18,lineHeight:1.6,color:"#666"}}>
       {isPro?"Gerencie sua assinatura, cobrança e documentos sem sair do fluxo do ImportaFácil.":"Tenha as ferramentas que transformam uma simulação em uma decisão de importação."}
     </p>
     {notice&&<div style={{padding:14,borderRadius:11,background:"#eef6ff",border:"1px solid #cfe3ff",margin:"20px 0",color:"#174a7e"}}>{notice}</div>}
     <div style={{display:"grid",gap:12,margin:"28px 0"}}>
       {["Comparação de cenários","Histórico completo de simulações","Relatórios profissionais","Recursos avançados do ImportaFácil"].map(x=><div key={x} style={{padding:14,border:"1px solid #e4e7ec",borderRadius:11}}>✓ {x}</div>)}
     </div>
     {isPro?<>
       <div style={{padding:14,borderRadius:11,background:"#eef8ef",border:"1px solid #cce7cf",marginBottom:18}}>
         <b>Plano PRO</b> · status {status}{periodLabel?" · período atual até "+periodLabel:""}
       </div>
       <div style={{display:"grid",gap:10}}>
         <button onClick={manageBilling} disabled={portalLoading||!ready} style={{width:"100%",padding:16,border:0,borderRadius:11,background:"#2b65f7",color:"white",fontSize:16,fontWeight:800,cursor:"pointer"}}>
           {portalLoading?"Abrindo portal...":"Gerenciar assinatura e cobrança"}
         </button>
         <a href="/dashboard" style={{display:"block",textAlign:"center",width:"100%",boxSizing:"border-box",padding:14,borderRadius:11,border:"1px solid #c8d7ff",color:"#2443a8",background:"#eef2ff",fontWeight:700,textDecoration:"none"}}>Ir para meu painel</a>
       </div>
       <p style={{fontSize:12,color:"#888",marginTop:18}}>No portal seguro da Stripe você pode atualizar a forma de pagamento, consultar faturas e solicitar o cancelamento da assinatura.</p>
     </>:<>
       <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:20}}><strong style={{fontSize:36}}>R$ 29,90</strong><span style={{color:"#777"}}>/ mês</span></div>
       <button onClick={checkout} disabled={loading||!ready} style={{width:"100%",padding:16,border:0,borderRadius:11,background:"#2b65f7",color:"white",fontSize:16,fontWeight:800,cursor:"pointer"}}>{loading?"Abrindo checkout...":"Assinar PRO"}</button>
       <p style={{fontSize:12,color:"#888",marginTop:18}}>O pagamento é processado com segurança pela Stripe. O plano PRO só é liberado após confirmação da assinatura.</p>
     </>}
     {error&&<p style={{color:"#b42318",marginTop:14,padding:12,borderRadius:10,background:"#fff1f0"}}>{error}</p>}
   </div>
 </main>
}
