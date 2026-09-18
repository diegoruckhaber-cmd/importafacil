export default function NotFound() {
  return (
    <main style={{minHeight:"70vh",display:"grid",placeItems:"center",padding:"40px 24px",background:"#f7f7f4"}}>
      <div style={{maxWidth:620,textAlign:"center"}}>
        <small style={{letterSpacing:1,color:"#777"}}>404</small>
        <h1 style={{fontSize:42,margin:"10px 0"}}>Esta página não existe.</h1>
        <p style={{color:"#666",lineHeight:1.6}}>Volte ao fluxo principal ou abra uma nova Simulation V2.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginTop:22}}>
          <a href="/" style={{padding:"12px 16px",border:"1px solid #111",borderRadius:10,color:"#111",textDecoration:"none",fontWeight:700}}>Página inicial</a>
          <a href="/simulacao-v2" style={{padding:"12px 16px",background:"#111",borderRadius:10,color:"#fff",textDecoration:"none",fontWeight:800}}>Simular</a>
        </div>
      </div>
    </main>
  );
}
