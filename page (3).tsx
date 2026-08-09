import Link from "next/link";
export default function Page(){
return <main style={{maxWidth:"850px",margin:"60px auto",padding:"0 20px",fontFamily:"system-ui",lineHeight:1.7}}>
<p style={{color:"#315fe2",fontWeight:800}}>IMPORTAFÁCIL</p>
<h1>Quanto custa importar da China para o Brasil?</h1>
<p>O custo de uma importação da China não é determinado apenas pelo valor pago ao fornecedor. Câmbio, frete internacional, seguro, tributos, despesas aduaneiras e custos locais podem alterar bastante o resultado.

Uma boa análise começa pelo custo total da operação e termina na margem de venda. Compare fornecedores pelo custo efetivo, e não apenas pelo preço FOB.

Faça uma simulação no ImportaFácil e veja como mudanças no preço, frete, quantidade e câmbio afetam a operação.</p>
<p><Link href="/#simulador">→ Fazer uma simulação gratuita</Link></p>
</main>}
