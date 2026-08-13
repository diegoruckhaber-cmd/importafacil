export default function SCAuditPage() {
  return <main className="wrap scTest">
    <div className="scHeader">
      <div>
        <div className="eyebrow dark">AUDITORIA · RATEIO POR ITEM</div>
        <h1>Memória de cálculo da operação</h1>
        <p>Visualização de auditoria do rateio por item. A próxima camada exibirá cada despesa, critério, participação e valor alocado.</p>
      </div>
      <a className="secondaryBtn" href="/sc-operation">Voltar para operação</a>
    </div>
    <section className="card"><h2>Camada de auditoria preparada</h2><p>O motor de rateio já está disponível para alimentar esta memória de cálculo.</p></section>
  </main>;
}
