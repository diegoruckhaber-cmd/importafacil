"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { compareSavedSimulationV2, savedSimulationComparable, simulationStatusLabel, simulationProvenanceLabel, type SavedSimulationRecord } from "../../lib/simulation-record";
const br=(n:number)=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export default function Comparar(){
 const[plan,setPlan]=useState("FREE");const[ready,setReady]=useState(false);const[items,setItems]=useState<SavedSimulationRecord[]>([]);const[selected,setSelected]=useState<string[]>([]);const[error,setError]=useState("");
 useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user){location.href="/auth";return}const[{data:p},{data:sims}]=await Promise.all([supabase.from("profiles").select("plan").eq("id",user.id).maybeSingle(),supabase.from("simulations").select("id,name,input,result,created_at,server_execution").eq("user_id",user.id).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(100)]);setPlan(p?.plan||"FREE");const eligible=((sims||[]) as SavedSimulationRecord[]).filter(savedSimulationComparable);setItems(eligible);setSelected(eligible.slice(0,2).map(x=>x.id));setReady(true)})()},[]);
 const rows=useMemo(()=>{try{return selected.length>=2?compareSavedSimulationV2(items.filter(x=>selected.includes(x.id))):[]}catch{return[]}},[items,selected]);
 const [offset,setOffset]=useState(100);const[hasMore,setHasMore]=useState(true);const[loadingMore,setLoadingMore]=useState(false);
 async function loadMore(){setLoadingMore(true);try{const{data,error}=await supabase.from("simulations").select("id,name,input,result,created_at,server_execution").order("created_at",{ascending:false}).order("id",{ascending:false}).range(offset,offset+99);if(error)throw error;setItems(current=>[...current,...(data||[]).filter(savedSimulationComparable)].filter((x,i,all)=>all.findIndex(y=>y.id===x.id)===i));setOffset(offset+100);setHasMore((data||[]).length===100)}catch{setError("Não foi possível carregar mais cenários.")}finally{setLoadingMore(false)}}
 const best=rows[0];
 if(!ready)return <main className="productLoading">Carregando...</main>;if(plan.toUpperCase()==="FREE")return <main className="productContentPage"><div className="productLocked"><small className="productEyebrow">RECURSO PRO</small><h1 className="productPageTitle">Comparador de cenários</h1><p className="accountIntro">Compare cenários salvos usando exatamente os resultados calculados pelo motor homologado.</p><a href="/upgrade" className="primaryBtn">Conhecer o PRO</a></div></main>;
 const toggle=(id:string)=>setSelected(current=>current.includes(id)?current.filter(x=>x!==id):current.length<4?[...current,id]:current);
 return <main className="productContentPage"><div className="productContentShell wide"><a href="/dashboard" className="accountBack">← Meu painel</a><h1 className="productPageTitle">Comparar cenários</h1><p className="productLead">Selecione de 2 a 4 simulações salvas. O comparador não recalcula tributos nem benefícios: ele compara resultados oficiais já produzidos e preserva os status e alertas originais.</p>{hasMore&&<button disabled={loadingMore} onClick={loadMore}>{loadingMore?"Carregando...":"Carregar mais cenários"}</button>}{items.length<2?<div className="productLocked"><h2>Faltam cenários salvos.</h2><p>Salve pelo menos duas simulações calculadas para liberar a comparação.</p><a href="/simulacao-v2" className="primaryBtn">Criar simulação</a></div>:<><div className="productChoiceList">{items.map(x=><label key={x.id} className="productChoice"><input type="checkbox" checked={selected.includes(x.id)} onChange={()=>toggle(x.id)}/><span><b>{x.name||"Simulação"}</b><small style={{display:"block",color:"#777",marginTop:3}}>{new Date(x.created_at).toLocaleString("pt-BR")} · {simulationStatusLabel(x.result.status)}</small></span><strong style={{marginLeft:"auto"}}>{br(x.result.summary?.landedCostBrl)}</strong></label>)}</div>{selected.length<2&&<p style={{color:"#a15c00"}}>Selecione pelo menos dois cenários.</p>}{error&&<p style={{color:"#b00020"}}>{error}</p>}{rows.length>=2&&<div className="productComparison"><div className="productComparisonHighlight"><b>Menor custo nacionalizado: {best.name}</b><div style={{fontSize:24,fontWeight:900,marginTop:4}}>{br(best.landedCostBrl)}</div></div><table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}><thead><tr><th style={th}>Indicador</th>{rows.map(x=><th key={x.id} style={th}>{x.name}</th>)}</tr></thead><tbody>{[
 ["Status",(x:any)=>simulationStatusLabel(x.status)],
 ["Itens",(x:any)=>String(x.itemCount)],
 ["Mercadorias",(x:any)=>br(x.merchandiseBrl)],
 ["Valor aduaneiro",(x:any)=>br(x.customsValueBrl)],
 ["Tributos de importação",(x:any)=>br(x.importTaxesBrl)],
 ["Defesa comercial",(x:any)=>br(x.defenseCommercialBrl)],
 ["Economia ICMS-importação",(x:any)=>br(x.icmsImportSavingsBrl)],
 ["Custo nacionalizado",(x:any)=>br(x.landedCostBrl)],
 ["Receita na margem alvo",(x:any)=>br(x.targetRevenueBrl)],
 ["Lucro estimado",(x:any)=>br(x.estimatedProfitBrl)],
 ].map(([label,fn]:any)=><tr key={label}><td style={td}><b>{label}</b></td>{rows.map(x=><td key={x.id} style={{...td,textAlign:"right"}}>{fn(x)}</td>)}</tr>)}</tbody></table></div>}</>}</div></main>;
}
const th:React.CSSProperties={textAlign:"left",padding:10,borderBottom:"1px solid #ddd",fontSize:13,color:"#666"};const td:React.CSSProperties={padding:11,borderBottom:"1px solid #eee"};
