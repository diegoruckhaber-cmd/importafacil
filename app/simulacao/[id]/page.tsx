"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { savedSimulationKind, simulationStatusLabel, simulationProvenanceLabel, type SavedSimulationRecord } from "../../../lib/simulation-record";
import MobileBottomNav from "../../components/MobileBottomNav";

const br=(n:number)=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const pct=(n:number)=>`${Number(n||0).toLocaleString("pt-BR",{maximumFractionDigits:2})}%`;
const labels:Record<string,string>={quantity:"Quantidade",fobUsd:"FOB unitário (US$)",fx:"Câmbio (R$/US$)",freightUsd:"Frete internacional (US$)",insuranceUsd:"Seguro internacional (US$)",otherBrl:"Outras despesas (R$)",ii:"II (%)",ipi:"IPI (%)",pis:"PIS (%)",cofins:"COFINS (%)",icms:"ICMS (%)",margin:"Margem desejada (%)"};

export default function SimulationDetail(){
 const params=useParams<{id:string}>();const[sim,setSim]=useState<SavedSimulationRecord|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
 useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user){location.href="/auth";return}const{data,error}=await supabase.from("simulations").select("id,name,input,result,created_at,server_execution").eq("id",params.id).eq("user_id",user.id).maybeSingle();if(error||!data)setError("Não foi possível encontrar esta simulação.");else setSim(data as SavedSimulationRecord);setLoading(false)})()},[params.id]);
 if(loading)return <main className="productLoading">Carregando simulação...</main>;if(error||!sim)return <main className="productContentPage"><div className="productLocked"><h1>Simulação não encontrada</h1><p>{error||"Esta simulação pode ter sido removida."}</p><a href="/dashboard" className="accountBack">← Voltar ao painel</a></div></main>;
 const kind=savedSimulationKind(sim);
 return <main className="productContentPage"><div className="productContentShell"><div className="productPageTop"><a href="/dashboard" className="accountBack">← Meu painel</a><div className="productPageActions">{kind==="v2"&&<a href={`/relatorio?id=${sim.id}`} className="secondaryBtn">Relatório</a>}<button onClick={()=>window.print()} className="secondaryBtn">Imprimir / Salvar PDF</button></div></div><article className="productArticle"><small className="productEyebrow">IMPORTAFÁCIL · SIMULAÇÃO</small><h1 className="productPageTitle">{sim.name||"Simulação de importação"}</h1><p className="productMeta">Criada em {new Date(sim.created_at).toLocaleString("pt-BR")}</p><p>{simulationProvenanceLabel(sim)}</p>{kind==="v2"?<V2Result sim={sim}/>:kind==="sc"?<SCResult sim={sim}/>:<LegacyResult sim={sim}/>}</article></div><MobileBottomNav active="history" /></main>;
}

function V2Result({sim}:{sim:SavedSimulationRecord}){
 const r=sim.result,s=r.summary;
 if(!s)return <><p className="productLead">Este snapshot não possui resumo executivo disponível.</p><Premises input={sim.input}/><Disclaimer/></>;
 const attention=(r.attentionPoints||[]) as string[];
 return <>
  <section className="savedResultStatus" data-status={r.status}>
    <div><small>STATUS DA SIMULAÇÃO</small><b>{simulationStatusLabel(r.status)}</b></div>
    <span>{attention.length ? `${attention.length} ponto(s) de atenção` : "Sem alertas registrados"}</span>
  </section>
  <section className="savedResultHighlights">
    <Metric label="Custo nacionalizado" value={br(Number(s.landedCostBrl))}/>
    <Metric label="Mercadorias" value={br(Number(s.merchandiseBrl))}/>
    <Metric label="Tributos de importação" value={br(Number(s.importTaxesBrl))}/>
    <Metric label="Economia ICMS-importação" value={br(Number(s.icmsImportSavingsBrl))}/>
  </section>
  <div className="savedResultLayout">
    <div>
      <section className="savedResultSection">
        <div className="savedResultSectionHead"><div><small>DETALHAMENTO</small><h2>Itens da simulação</h2></div><span>{(r.items||[]).length} item(ns)</span></div>
        <div className="resultTableWrap"><table className="resultTable"><thead><tr><th>Item</th><th>NCM</th><th>Status</th><th>II</th><th>IPI</th><th>Custo/un.</th><th>Margem</th><th>Preço alvo/un.</th></tr></thead><tbody>{(r.items||[]).map((x:any)=><tr key={x.itemId}><td>{x.name}</td><td><span className="ncmPill">{x.ncm}</span></td><td>{simulationStatusLabel(x.status)}</td><td>{pct(x.federal?.ii?.rate)}</td><td>{pct(x.federal?.ipi?.rate)}</td><td>{br(x.commercial?.breakEvenPricePerUnitBrl)}</td><td>{pct(x.commercial?.targetMarginPercent)}</td><td><b>{br(x.commercial?.targetSalePricePerUnitBrl)}</b></td></tr>)}</tbody></table></div>
      </section>
      {attention.length>0&&<section className="savedAttention"><div className="savedResultSectionHead"><div><small>ATENÇÃO</small><h2>Pontos de atenção</h2></div></div><div className="attentionList">{attention.map((x:string,i:number)=><div className="attentionItem" key={i}><span className="attentionNumber">{i+1}</span><div>{x}</div></div>)}</div></section>}
    </div>
    <aside className="savedResultAside">
      <div className="savedExecutiveCard"><small>RESUMO EXECUTIVO</small><h3>Visão consolidada</h3><p>O custo nacionalizado estimado desta operação é <b>{br(Number(s.landedCostBrl))}</b>. O resultado preserva exatamente as premissas e o cálculo oficial salvos no momento da simulação.</p><div><span>Valor aduaneiro</span><b>{br(Number(s.customsValueBrl))}</b></div><div><span>Defesa comercial</span><b>{br(Number(s.defenseCommercialBrl))}</b></div><div><span>Receita na margem alvo</span><b>{br(Number(s.targetRevenueBrl))}</b></div><div><span>Lucro estimado</span><b>{br(Number(s.estimatedProfitBrl))}</b></div></div>
      <details className="savedPremises"><summary>Premissas da operação</summary><Premises input={sim.input}/></details>
    </aside>
  </div>
  <Disclaimer/>
 </>;
}
function SCResult({sim}:{sim:SavedSimulationRecord}){const r=sim.result;return <><h2 style={{marginTop:30}}>Resultado da operação</h2><div style={grid}>{[["Valor aduaneiro",r.totalCustomsValue],["Despesas rateadas",r.totalAllocatedExpenses],["Tributos normais",r.totalNormalTaxes],["Economia ICMS-importação",r.totalImportICMSSavings],["Custo antes do benefício",r.totalLandedCostBeforeBenefit],["Custo final",r.totalLandedCostAfterBenefit]].map(([a,b])=><Metric key={String(a)} label={String(a)} value={br(Number(b))}/>)}</div><h2 style={{marginTop:32}}>Premissas</h2><Premises input={sim.input}/><Disclaimer/></>}
function LegacyResult({sim}:{sim:SavedSimulationRecord}){return <><h2 style={{marginTop:30}}>Resultado legado</h2><div style={grid}>{[["Custo total",sim.result.total],["Custo unitário",sim.result.unit],["Preço mínimo",sim.result.sale],["Lucro estimado",sim.result.profit],["Impostos",sim.result.tax]].map(([a,b])=><Metric key={String(a)} label={String(a)} value={br(Number(b))}/>)}</div><h2 style={{marginTop:32}}>Premissas</h2><div style={grid}>{Object.entries(sim.input).map(([key,value])=><div key={key} style={metric}><small style={{color:"#777"}}>{labels[key]||key}</small><div style={{fontWeight:700,marginTop:4}}>{typeof value==="number"?value.toLocaleString("pt-BR"):String(value)}</div></div>)}</div><Disclaimer/></>}
function Premises({input}:{input:Record<string,any>}){return <div style={grid}>{Object.entries(input).filter(([k])=>k!=="items"&&k!=="expenses").map(([k,v])=><div key={k} style={metric}><small style={{color:"#777"}}>{k}</small><div style={{fontWeight:700,marginTop:4}}>{typeof v==="number"?v.toLocaleString("pt-BR"):String(v)}</div></div>)}</div>}
function Metric({label,value}:{label:string;value:string}){return <div style={metric}><small style={{color:"#777"}}>{label}</small><div style={{fontSize:19,fontWeight:800,marginTop:5}}>{value}</div></div>}
function Disclaimer(){return <div style={{marginTop:28,padding:18,borderRadius:12,background:"#f5f7fb",color:"#555"}}>Os valores são estimativos. Valide NCM, tratamento tributário, despesas e demais premissas antes de comprometer capital.</div>}
const grid={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12} as const;const metric={padding:16,border:"1px solid #eee",borderRadius:12} as const;const table={width:"100%",borderCollapse:"collapse"} as const;const th:React.CSSProperties={textAlign:"left",padding:"10px 8px",borderBottom:"1px solid #ddd",fontSize:13,color:"#666"};const td:React.CSSProperties={padding:"11px 8px",borderBottom:"1px solid #eee"};
