import Link from "next/link";

const posts=[
["/conteudo/custo-de-importacao","Custo de Importação: como calcular o custo real"],
["/conteudo/quanto-custa-importar-da-china","Quanto custa importar da China?"],
["/conteudo/custo-nacionalizado","O que é custo nacionalizado?"],
["/conteudo/importacao-direta-ou-trading","Importação direta ou Trading?"],
["/conteudo/preco-de-venda-importado","Como calcular preço de venda de produto importado?"]
];

export default function Conteudo(){
 return <main style={{maxWidth:900,margin:"60px auto",padding:"0 20px",fontFamily:"system-ui"}}>
  <p style={{color:"#315fe2",fontWeight:800}}>IMPORTAFÁCIL</p>
  <h1>Conteúdo para tomar decisões melhores de importação</h1>
  <p>Guias práticos para transformar preço, logística e tributos em uma decisão econômica.</p>
  <div style={{display:"grid",gap:12,marginTop:30}}>
   {posts.map(([href,title])=><Link key={href} href={href} style={{padding:20,border:"1px solid #e4e7ec",borderRadius:12,textDecoration:"none",color:"#152033"}}><b>{title}</b><br/><small>Leia o guia →</small></Link>)}
  </div>
 </main>
}
