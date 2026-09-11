"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { compareSavedSimulationV2, savedSimulationComparable, type SavedSimulationRecord } from "../../lib/simulation-record";
const br=(n:number)=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export default function Comparar(){
 const[plan,setPlan]=useState("FREE");const[ready,setReady]=useState(false);const[items,setItems]=useState<SavedSimulationRecord[]>([]);const[selected,setSelected]=useState<string[]>([]);const[error,setError]=useState("");
 useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user){location.href="/auth";return}const[{data:p},{data:sims}]=await Promise.all([supabase.from("profiles").select("plan").eq("id",user.id).maybeSingle(),supabase.from("simulations").select("id,name,input,result,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100)]);setPlan(p?.plan||"FREE");const eligible=((sims||[]) as SavedSimulationRecord[]).filter(savedSimulationComparable);setItems(eligible);setSelected(eligible.slice(0,2).map(x=>x.id));setReady(true)})()},[]);
 const rows=useMemo(()=>{try{return selected.length>=2?compareSavedSimulationV2(items.filter(x=>selected.includes(x.id))):[]}catch(e){setError(e instanceof Error?e.message:"Não foi possível comparar.");return[]}},[items,selected]);
 const best=rows[0];
 if(!ready)return <main style={{padding:40}}>Carregando...</main>;if(plan.toUpperCase()==="FREE")return <main style={page}><div style={locked}><small style={{letterSpacing:1,color:"#777"}}>RECURSO PRO</small><h1>Comparador de Simulation V2</h1><p>Compare cenários salvos usando exatamente os resultados calculados pelo motor homologado.</p><a href="/upgrade" style={primary}>Conhecer o PRO</a></div></main>;
 const toggle=(id:string)=>setSelected(current=>current.includes(id)?current.filter(x=>x!==id):current.length<4?[...current,id]:current);
 return <main style={page}><div style={{maxWidth:1200,margin:"auto"}}><a href="/dashboard" style={{color:"#111"}}>← Meu painel</a><h1 style={{fontSize:40,marginBottom:8}}>Comparar cenários V2</h1><p style={{color:"#666",maxWidth:820}}>Selecione de 2 a 4 simulações salvas. O comparador não recalcula tributos nem benefícios: ele compara contratos V2 já produzidos e preserva os status e alertas originais.</p>{items.length<2?<div style={locked}><h2>Faltam cenários V2 salvos.</h2><p>Salve pelo menos duas Simulation V2 calculadas para liberar a comparação.</p><a href="/simulacao-v2" style={primary}>Criar Simulation V2</a></div>:<><div style={{display:"grid",gap:10,margin:"24px 0"}}>{items.map(x=><label key={x.id} style={choice}><input type="checkbox" checked={selected.includes(x.id)} onChange={()=>toggle(x.id)}/><span><b>{x.name||"Simulation V2"}</b><small style={{display:"block",color:"#777",marginTop:3}}>{new Date(x.created_at).toLocaleString("pt-BR")} · {x.result.status}</small></span><strong style={{marginLeft:"auto"}}>{br(x.result.summary?.landedCostBrl)}</strong></label>)}</div>{selected.length<2&&<p style={{color:"#a15c00"}}>Selecione pelo menos dois cenários.</p>}{error&&<p style={{color:"#b00020"}}>{error}</p>}{rows.length>=2&&<div style={{background:"white",border:"1px solid #e5e5df",borderRadius:18,padding:22,overflowX:"auto"}}><div style={{marginBottom:18,padding:16,borderRadius:12,background:"#eef8f0"}}><b>Menor custo nacionalizado: {best.name}</b><div style={{fontSize:24,fontWeight:900,marginTop:4}}>{br(best.landedCostBrl)}</div></div><table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}><thead><tr><th style={th}>Indicador</th>{rows.map(x=><th key={x.id} style={th}>{x.name}</th>)}</tr></thead><tbody>{[
 ["Status",(x:any)=>x.status],
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
const page={minHeight:"100vh",background:"#f7f7f4",padding:"42px 24px"} as const;const locked={maxWidth:760,margin:"30px auto",background:"white",borderRadius:22,padding:42,border:"1px solid #e5e5df"} as const;const primary={display:"inline-block",padding:"12px 16px",background:"#111",color:"white",borderRadius:10,textDecoration:"none",fontWeight:700} as const;const choice={display:"flex",gap:12,alignItems:"center",padding:16,border:"1px solid #e5e5df",borderRadius:14,background:"white",cursor:"pointer"} as const;const th:React.CSSProperties={textAlign:"left",padding:10,borderBottom:"1px solid #ddd",fontSize:13,color:"#666"};const td:React.CSSProperties={padding:11,borderBottom:"1px solid #eee"};
