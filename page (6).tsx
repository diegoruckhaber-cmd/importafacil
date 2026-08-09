import Link from "next/link";
export default function Page(){
return <main style={{maxWidth:"850px",margin:"60px auto",padding:"0 20px",fontFamily:"system-ui",lineHeight:1.7}}>
<p style={{color:"#315fe2",fontWeight:800}}>IMPORTAFÁCIL</p>
<h1>Como calcular o preço de venda de um produto importado?</h1>
<p>Comece pelo custo efetivo da mercadoria e defina a margem desejada. Depois, considere os demais componentes do modelo comercial, como despesas de venda, impostos da saída, comissões e custos operacionais quando aplicáveis.

Uma margem aparentemente boa sobre o custo pode não representar a margem real sobre o preço de venda. Por isso, deixe explícita a fórmula usada e teste diferentes cenários.

Use uma simulação antes de fechar a compra para saber qual preço mínimo precisa ser praticado.</p>
<p><Link href="/#simulador">→ Fazer uma simulação gratuita</Link></p>
</main>}
