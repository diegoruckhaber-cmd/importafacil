export const metadata = {
  title: "Termos de uso | ImportaFácil",
  description: "Condições de uso do beta controlado do ImportaFácil.",
};

export default function TermsPage() {
  return (
    <main style={{maxWidth:860,margin:"0 auto",padding:"56px 24px 80px",lineHeight:1.65,color:"#222"}}>
      <a href="/" style={{color:"#111",fontWeight:800}}>← ImportaFácil</a>
      <h1 style={{fontSize:42,margin:"28px 0 8px"}}>Termos de uso do beta</h1>
      <p style={{color:"#666"}}>Versão de 18/09/2026 · beta controlado</p>

      <h2>Finalidade</h2>
      <p>O ImportaFácil é uma ferramenta de apoio ao pré-estudo de importações. Ele organiza premissas, fontes fiscais suportadas, cálculos e alertas para auxiliar a análise de uma operação.</p>

      <h2>Não substitui validação profissional</h2>
      <p>Os resultados não constituem parecer jurídico, contábil ou tributário e não substituem a conferência documental e fiscal aplicável ao processo real. Antes de assumir obrigações comerciais, financeiras ou aduaneiras, valide as premissas relevantes para a operação concreta.</p>

      <h2>Escopo fiscal</h2>
      <p>Santa Catarina possui motor estadual específico nos cenários suportados. Nas demais UFs ativadas como <strong>general_rate_only</strong>, o cálculo automático cobre a regra geral homologada de ICMS de importação. Benefícios, reduções, isenções, substituição tributária, diferimentos, antecipações e regimes especiais permanecem fora desse escopo salvo quando o produto declarar suporte explícito.</p>

      <h2>Fail-closed</h2>
      <p>Quando o motor não consegue provar um tratamento com os dados e fontes suportados, ele pode exigir informação adicional, emitir alerta, bloquear o cálculo ou marcar a operação como não suportada. Não contorne esses estados tratando-os como resultado definitivo.</p>

      <h2>Plano FREE e PRO</h2>
      <p>O plano FREE possui limites de produto. O PRO é uma assinatura recorrente e a cobrança é processada pela Stripe. Cancelamentos e informações de cobrança disponíveis são gerenciados pelo portal de cobrança ligado à conta.</p>

      <h2>Fontes e atualizações</h2>
      <p>Regras fiscais publicadas no motor são versionadas e passam por revisão. A coleta automática de fontes oficiais não autoriza publicação automática de uma nova regra: mudanças fiscais continuam sujeitas a revisão e testes antes de chegarem à produção.</p>

      <h2>Disponibilidade do beta</h2>
      <p>O beta pode receber correções, ajustes de escopo e mudanças de interface. A abertura comercial irrestrita depende de revisão manual de release e não é ativada automaticamente.</p>

      <p style={{marginTop:36}}><a href="/privacidade">Ver política de privacidade →</a></p>
    </main>
  );
}
