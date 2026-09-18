export const metadata = {
  title: "Privacidade | ImportaFácil",
  description: "Como o ImportaFácil trata dados de conta, simulações, cobrança e telemetria operacional.",
};

export default function PrivacyPage() {
  return (
    <main style={{maxWidth:860,margin:"0 auto",padding:"56px 24px 80px",lineHeight:1.65,color:"#222"}}>
      <a href="/" style={{color:"#111",fontWeight:800}}>← ImportaFácil</a>
      <h1 style={{fontSize:42,margin:"28px 0 8px"}}>Privacidade</h1>
      <p style={{color:"#666"}}>Versão de 18/09/2026 · beta controlado</p>

      <h2>Quais dados entram no produto</h2>
      <p>Ao criar uma conta, o serviço de autenticação pode tratar e-mail, nome informado, credenciais e dados técnicos de sessão. Ao salvar um pré-estudo, o ImportaFácil armazena as premissas e o snapshot do resultado vinculados à sua conta para permitir histórico, comparação e relatórios.</p>

      <h2>Cobrança</h2>
      <p>Pagamentos e gestão do plano PRO são processados pela Stripe. O ImportaFácil guarda apenas referências necessárias para sincronizar o estado da assinatura e liberar ou retirar o acesso ao PRO. Dados completos de cartão não são armazenados pelo ImportaFácil.</p>

      <h2>Infraestrutura</h2>
      <p>Autenticação e persistência usam Supabase; aplicação e runtime usam Vercel; cobrança usa Stripe. Esses provedores tratam dados conforme os serviços necessários para operar o produto.</p>

      <h2>Telemetria operacional</h2>
      <p>Eventos estruturados de cálculo e billing são projetados para não registrar e-mail, identificador de usuário, NCM, descrição de produto, exportador, valores comerciais, tokens ou mensagens brutas de erro. Eles registram sinais técnicos como tipo de evento, status, duração, códigos de erro permitidos e versão do deploy.</p>

      <h2>Uso e retenção</h2>
      <p>Os dados de conta e simulações são mantidos enquanto forem necessários para fornecer os recursos contratados e operar o beta. Registros técnicos podem ser mantidos pelos provedores de infraestrutura de acordo com a configuração e retenção de cada serviço.</p>

      <h2>Cuidados do usuário</h2>
      <p>Evite inserir em descrições ou campos livres informações pessoais desnecessárias, segredos comerciais que não sejam necessários ao cálculo, senhas, tokens ou dados de cartão.</p>

      <h2>Beta controlado</h2>
      <p>Durante o beta, o escopo técnico e esta página podem evoluir. Mudanças relevantes devem ser refletidas nesta página antes de uma abertura comercial irrestrita.</p>

      <p style={{marginTop:36}}><a href="/termos">Ver termos de uso →</a></p>
    </main>
  );
}
