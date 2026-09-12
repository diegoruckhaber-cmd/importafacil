import { getRuleHistory } from "../../lib/rule-history";

export const dynamic = "force-dynamic";

export default function RegrasPage() {
  const history = getRuleHistory();

  return (
    <main style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 24px" }}>
      <h1>Histórico e fontes das regras</h1>
      <p>
        Consulta somente leitura das fontes jurídicas versionadas no ImportaFácil. Esta tela não altera nem recalcula regras fiscais.
      </p>
      <p>
        Snapshot federal ativo: <strong>{history.federalSnapshot}</strong> · Manifesto: <strong>{history.federalManifestVersion}</strong>
      </p>
      <div style={{ display: "grid", gap: 16, marginTop: 32 }}>
        {history.entries.map((entry) => (
          <article key={entry.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>{entry.title}</h2>
            <p><strong>{entry.id}</strong> · {entry.scope} · {entry.authority}</p>
            {entry.effectiveFrom ? <p>Vigência cadastrada a partir de {entry.effectiveFrom}</p> : null}
            <p>{entry.notes}</p>
            <a href={entry.officialUrl} target="_blank" rel="noreferrer">Abrir fonte oficial</a>
          </article>
        ))}
      </div>
    </main>
  );
}
