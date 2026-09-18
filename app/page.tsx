import type { CSSProperties } from "react";

export default function HomePage() {
  return (
    <main style={{minHeight:"100vh",background:"#f7f7f4",color:"#111"}}>
      <header style={{borderBottom:"1px solid #e4e4de",background:"#fff"}}>
        <div style={{maxWidth:1120,margin:"0 auto",padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20}}>
          <a href="/" style={{fontWeight:900,fontSize:20,color:"#111",textDecoration:"none"}}>ImportaFácil</a>
          <nav aria-label="Navegação principal" style={{display:"flex",gap:18,alignItems:"center",flexWrap:"wrap"}}>
            <a href="/simulacao-v2" style={navLink}>Simular</a>
            <a href="/regras" style={navLink}>Regras</a>
            <a href="/auth" style={navLink}>Entrar</a>
            <a href="/upgrade" style={{...navLink,fontWeight:800}}>PRO</a>
          </nav>
        </div>
      </header>

      <section aria-labelledby="hero-title" style={{maxWidth:1120,margin:"0 auto",padding:"86px 24px 68px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:46,alignItems:"center"}}>
        <div>
          <div style={eyebrow}>BETA CONTROLADO · 27 UFs ATIVAS</div>
          <h1 id="hero-title" style={{fontSize:"clamp(40px,6vw,72px)",lineHeight:1.02,letterSpacing:"-0.04em",margin:"18px 0 24px",maxWidth:760}}>
            Antes de importar, descubra se a conta fecha.
          </h1>
          <p style={{fontSize:20,lineHeight:1.6,color:"#5d5d57",maxWidth:700}}>
            Um único fluxo para tributos federais, ICMS estadual, custo nacionalizado, alertas jurídicos e memória auditável da simulação.
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:32}}>
            <a href="/simulacao-v2" style={primary}>Abrir Simulation V2</a>
            <a href="/auth" style={secondary}>Criar conta</a>
          </div>
          <p style={{fontSize:13,color:"#777",marginTop:18,lineHeight:1.5}}>
            Nas UFs em escopo <b>general_rate_only</b>, o produto aplica a regra geral homologada e mantém benefícios, ST, reduções e regimes especiais fora do cálculo automático.
          </p>
        </div>
        <div style={{background:"#111",color:"#fff",borderRadius:24,padding:34,minHeight:340,display:"grid",alignContent:"space-between",boxShadow:"0 25px 70px rgba(0,0,0,.14)"}}>
          <div>
            <div style={{fontSize:12,letterSpacing:1.4,color:"#aaa"}}>FLUXO CANÔNICO</div>
            <h2 style={{fontSize:34,lineHeight:1.15,margin:"12px 0 20px"}}>Simulation V2</h2>
            <p style={{color:"#c6c6c1",lineHeight:1.6}}>A experiência principal do ImportaFácil agora concentra entrada, cálculo, alertas e resultado em uma única superfície.</p>
          </div>
          <div style={{display:"grid",gap:10}}>
            {["NCM e fontes federais oficiais","ICMS nas 27 UFs homologadas","Defesa comercial e alertas fail-closed","Histórico, comparação e relatórios"].map((item,index)=>
              <div key={item} style={{display:"flex",gap:12,padding:"12px 0",borderTop:"1px solid #333"}}>
                <b style={{color:"#888"}}>{String(index+1).padStart(2,"0")}</b><span>{item}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{background:"#fff",borderTop:"1px solid #e4e4de",borderBottom:"1px solid #e4e4de"}}>
        <div style={{maxWidth:1120,margin:"0 auto",padding:"64px 24px"}}>
          <div style={eyebrow}>UM PRODUTO, UM FLUXO</div>
          <h2 style={{fontSize:38,margin:"12px 0 32px"}}>Do pré-estudo à decisão.</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
            {[
              ["01","Informe a operação","Destino, NCM, origem, quantidade, valores e premissas da importação."],
              ["02","O motor resolve","Fontes federais, ICMS, defesa comercial e escopo jurídico são avaliados sem atalhos silenciosos."],
              ["03","Leia o status","Calculado, alerta, requer informação, bloqueado ou não suportado: o sistema explicita o que sabe."],
              ["04","Guarde a memória","Usuários autenticados podem salvar, comparar e gerar relatórios a partir do snapshot calculado."]
            ].map(([n,title,body])=><article key={n} style={card}><small style={{color:"#888",fontWeight:800}}>{n}</small><h3 style={{fontSize:21,margin:"12px 0"}}>{title}</h3><p style={{color:"#666",lineHeight:1.55,margin:0}}>{body}</p></article>)}
          </div>
        </div>
      </section>

      <section id="pro" style={{maxWidth:1120,margin:"0 auto",padding:"72px 24px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:24,alignItems:"center"}}>
          <div>
            <div style={eyebrow}>IMPORTAFÁCIL PRO</div>
            <h2 style={{fontSize:42,margin:"12px 0 18px"}}>R$ 29,90 <span style={{fontSize:18,color:"#777",fontWeight:400}}>/ mês</span></h2>
            <p style={{color:"#666",lineHeight:1.6,fontSize:18}}>Histórico completo, comparação de cenários, relatórios profissionais e recursos avançados para quem importa com frequência.</p>
          </div>
          <div style={{display:"grid",gap:12}}>
            <a href="/upgrade" style={primary}>Assinar PRO</a>
            <a href="/dashboard" style={secondary}>Abrir meu painel</a>
          </div>
        </div>
      </section>
      <footer style={{borderTop:"1px solid #e4e4de",padding:"26px 24px",background:"#fff"}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"flex",justifyContent:"space-between",gap:18,flexWrap:"wrap",fontSize:13,color:"#666"}}>
          <span>ImportaFácil · beta controlado</span>
          <span><a href="/privacidade" style={navLink}>Privacidade</a> · <a href="/termos" style={navLink}>Termos de uso</a></span>
        </div>
      </footer>
    </main>
  );
}

const navLink: CSSProperties={color:"#333",textDecoration:"none",fontSize:14};
const eyebrow: CSSProperties={fontSize:12,fontWeight:900,letterSpacing:1.2,color:"#666"};
const primary: CSSProperties={display:"inline-block",padding:"14px 19px",borderRadius:11,background:"#111",color:"#fff",textDecoration:"none",fontWeight:800,textAlign:"center"};
const secondary: CSSProperties={display:"inline-block",padding:"13px 19px",borderRadius:11,border:"1px solid #111",color:"#111",textDecoration:"none",fontWeight:800,textAlign:"center"};
const card: CSSProperties={background:"#f8f8f5",border:"1px solid #e5e5df",borderRadius:18,padding:24};
