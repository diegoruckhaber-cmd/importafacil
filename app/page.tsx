export default function HomePage() {
  return (
    <main className="marketingPage">
      <header className="marketingHeader">
        <div className="wrap nav">
          <a className="logo" href="/">ImportaFácil</a>
          <nav aria-label="Navegação principal" className="marketingNav">
            <a href="#como-funciona">Como funciona</a>
            <a href="#pro">Planos</a>
            <a href="/auth">Entrar</a>
            <a className="navCta" href="/simulacao-v2">Simular grátis</a>
          </nav>
        </div>

        <section className="wrap hero" aria-labelledby="home-hero-title">
          <div>
            <div className="eyebrow">PRÉ-ESTUDO DE IMPORTAÇÃO</div>
            <h1 id="home-hero-title">Antes de importar, descubra se a conta fecha.</h1>
            <p>
              Simule tributos, despesas e custo nacionalizado antes de comprometer seu capital.
              Compare cenários com uma visão clara do que realmente impacta sua importação.
            </p>
            <div className="heroActions">
              <a className="primary" href="/simulacao-v2">Simular gratuitamente</a>
              <a className="ghost" href="#como-funciona">Ver como funciona</a>
            </div>
            <div className="proof">
              <span>✓ 27 UFs cobertas</span>
              <span>✓ Alíquotas federais automáticas</span>
              <span>✓ Premissas transparentes</span>
            </div>
          </div>

          <div className="heroPanel">
            <small>VISÃO DA OPERAÇÃO</small>
            <b>Da compra ao custo nacionalizado</b>
            <div className="big">1 visão<span> para decidir melhor</span></div>
            <div className="mini"><span>Tributos</span><strong>II · IPI · PIS · COFINS · ICMS</strong></div>
            <div className="mini"><span>Logística</span><strong>Frete · seguro · despesas</strong></div>
            <div className="mini"><span>Decisão</span><strong>Custo · preço alvo · margem</strong></div>
          </div>
        </section>
      </header>

      <section className="wrap section" id="como-funciona">
        <div className="sectionHead">
          <div>
            <div className="eyebrow dark">SIMPLES NA TELA. FORTE POR TRÁS.</div>
            <h2>Uma simulação para enxergar a operação inteira.</h2>
            <p>
              Você informa os dados da compra. O ImportaFácil organiza a operação,
              resolve os tributos disponíveis e apresenta o custo de forma legível para decisão.
            </p>
          </div>
        </div>
        <div className="featuresCommercial">
          <Feature n="01" t="Informe a operação" d="NCM, origem, quantidade, FOB, câmbio e estado de destino." />
          <Feature n="02" t="Inclua a logística" d="Frete, seguro, armazenagem e demais despesas da nacionalização." />
          <Feature n="03" t="Receba o custo" d="Tributos, custo nacionalizado e custo unitário em uma visão única." />
          <Feature n="04" t="Decida com contexto" d="Preço alvo, margem e alertas aparecem sem esconder premissas importantes." />
        </div>
      </section>

      <section className="darkSection">
        <div className="wrap two">
          <div>
            <div className="eyebrow">NÃO É SÓ UMA CALCULADORA</div>
            <h2>Uma camada de decisão para quem importa.</h2>
            <p>
              O ImportaFácil transforma dados dispersos em uma resposta objetiva:
              quanto custa, onde estão os riscos e qual resultado a operação precisa entregar.
            </p>
          </div>
          <div className="features">
            <Feature n="01" t="Custo real" d="Mercadoria, logística, tributos e despesas em uma visão única." />
            <Feature n="02" t="Cenários" d="Compare fornecedores, lotes e premissas antes de decidir." />
            <Feature n="03" t="Rastreabilidade" d="O resultado mantém as premissas e fontes usadas no pré-estudo." />
            <Feature n="04" t="Rentabilidade" d="Custo unitário, preço alvo, margem e capital necessário." />
          </div>
        </div>
      </section>

      <section className="wrap section" id="pro">
        <div className="sectionHead">
          <div>
            <div className="eyebrow dark">PLANOS</div>
            <h2>Comece grátis. Evolua quando fizer sentido.</h2>
            <p>Use o simulador para validar a ferramenta. O PRO adiciona histórico, comparação e relatórios.</p>
          </div>
        </div>
        <div className="priceGrid">
          <div className="priceCard">
            <small>GRÁTIS</small>
            <h3>Para começar</h3>
            <b>R$ 0</b>
            <ul>
              <li>Simulação tributária</li>
              <li>Pré-estudo de custo</li>
              <li>Até 3 simulações salvas</li>
              <li>Alertas do cálculo</li>
            </ul>
            <a className="secondaryBtn" href="/simulacao-v2">Começar grátis</a>
          </div>
          <div className="priceCard featured">
            <div className="tag">BETA CONTROLADO</div>
            <small>PRO</small>
            <h3>Para quem importa</h3>
            <b>R$ 29,90<em>/mês</em></b>
            <ul>
              <li>Histórico completo</li>
              <li>Comparação de cenários</li>
              <li>Relatórios profissionais</li>
              <li>Gestão da assinatura</li>
            </ul>
            <a className="secondaryBtn" href="/upgrade">Assinar PRO</a>
          </div>
          <div className="priceCard">
            <small>EMPRESA</small>
            <h3>Para equipes</h3>
            <b>Em breve</b>
            <ul>
              <li>Múltiplos usuários</li>
              <li>Dashboard corporativo</li>
              <li>Controles por empresa</li>
              <li>Fluxos compartilhados</li>
            </ul>
            <span className="secondaryBtn disabledCta">Em desenvolvimento</span>
          </div>
        </div>
      </section>

      <section className="wrap salesClosing">
        <div>
          <div className="eyebrow dark">PRONTO PARA SIMULAR?</div>
          <h2>Descubra o custo antes de fazer o pedido.</h2>
          <p>Leva poucos minutos para montar um pré-estudo e enxergar a operação com muito mais clareza.</p>
        </div>
        <a className="primaryBtn" href="/simulacao-v2">Fazer uma simulação</a>
      </section>

      <footer>
        <div className="wrap">
          <b>ImportaFácil</b>
          <span>Beta controlado · <a href="/privacidade">Privacidade</a> · <a href="/termos">Termos de uso</a></span>
        </div>
      </footer>
    </main>
  );
}

function Feature({n,t,d}:{n:string;t:string;d:string}) {
  return <div className="feature"><span>{n}</span><div><b>{t}</b><p>{d}</p></div></div>;
}
