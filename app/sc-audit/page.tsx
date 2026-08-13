"use client";

import { useMemo, useState } from "react";
import { allocateImportCost } from "../../lib/import-cost-allocation";

type Method = "item_value" | "quantity" | "weight" | "volume";

type Item = {
  id: string;
  name: string;
  qty: number;
  unitUsd: number;
  weight: number;
  volume: number;
};

const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const items: Item[] = [
  { id: "ITEM-1", name: "Produto 1", qty: 1000, unitUsd: 10, weight: 1000, volume: 1 },
  { id: "ITEM-2", name: "Produto 2", qty: 500, unitUsd: 18, weight: 750, volume: 1.5 },
];

const methodLabel: Record<Method, string> = {
  item_value: "Valor aduaneiro",
  quantity: "Quantidade",
  weight: "Peso",
  volume: "Cubagem",
};

export default function SCAuditPage() {
  const [exchange, setExchange] = useState(5.5);
  const [freight, setFreight] = useState(1200);
  const [insurance, setInsurance] = useState(100);
  const [storage, setStorage] = useState(3500);
  const [method, setMethod] = useState<Method>("weight");

  const inputs = useMemo(
    () => items.map((item) => ({
      itemId: item.id,
      customsValue: item.qty * item.unitUsd * exchange,
      quantity: item.qty,
      weightKg: item.weight,
      volumeM3: item.volume,
    })),
    [exchange],
  );

  const rows = useMemo(() => {
    const expenses = [
      { id: "FREIGHT", description: "Frete internacional", amount: freight * exchange, method: "item_value" as const, treatment: "Base aduaneira" },
      { id: "INSURANCE", description: "Seguro internacional", amount: insurance * exchange, method: "item_value" as const, treatment: "Base aduaneira" },
      { id: "STORAGE", description: "Armazenagem", amount: storage, method, treatment: "Custo operacional" },
    ];

    return expenses.map((expense) => ({
      ...expense,
      allocations: allocateImportCost(expense.amount, inputs, expense.method),
    }));
  }, [exchange, freight, insurance, storage, method, inputs]);

  const totalExpenses = rows.reduce((sum, row) => sum + row.amount, 0);
  const totalAllocated = rows.reduce(
    (sum, row) => sum + row.allocations.reduce((s, allocation) => s + allocation.allocatedCost, 0),
    0,
  );

  return (
    <main className="wrap scTest">
      <div className="scHeader">
        <div>
          <div className="eyebrow dark">AUDITORIA · RATEIO POR ITEM</div>
          <h1>Memória de cálculo da operação</h1>
          <p>
            Confira exatamente como cada despesa compartilhada chega a cada produto,
            qual critério foi usado e quanto foi efetivamente alocado.
          </p>
        </div>
        <a className="secondaryBtn" href="/sc-operation">Voltar para operação</a>
      </div>

      <section className="card" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Parâmetros da memória</h2>
        <div className="fields">
          <label>Câmbio (R$/US$)<input type="number" min="0" step="any" value={exchange} onChange={(e) => setExchange(Number(e.target.value))} /></label>
          <label>Frete internacional (US$)<input type="number" min="0" step="any" value={freight} onChange={(e) => setFreight(Number(e.target.value))} /></label>
          <label>Seguro internacional (US$)<input type="number" min="0" step="any" value={insurance} onChange={(e) => setInsurance(Number(e.target.value))} /></label>
          <label>Armazenagem (R$)<input type="number" min="0" step="any" value={storage} onChange={(e) => setStorage(Number(e.target.value))} /></label>
          <label>Critério da armazenagem<select value={method} onChange={(e) => setMethod(e.target.value as Method)}><option value="item_value">Valor aduaneiro</option><option value="quantity">Quantidade</option><option value="weight">Peso</option><option value="volume">Cubagem</option></select></label>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="resultTop">
          <div><div className="eyebrow dark">CONFERÊNCIA</div><h2>Totais do rateio</h2></div>
          <div className="status calculated">VALIDADO</div>
        </div>
        <div className="metrics">
          <Metric label="Despesas da operação" value={money(totalExpenses)} />
          <Metric label="Total efetivamente alocado" value={money(totalAllocated)} hi />
          <Metric label="Diferença de conferência" value={money(totalExpenses - totalAllocated)} />
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Composição por item</h2>
        {items.map((item) => {
          const fob = item.qty * item.unitUsd * exchange;
          const detail = rows.map((row) => ({
            ...row,
            allocation: row.allocations.find((allocation) => allocation.itemId === item.id),
          })).filter((row) => row.allocation);
          const allocatedExpenses = detail.reduce((sum, row) => sum + (row.allocation?.allocatedCost ?? 0), 0);

          return (
            <details key={item.id} open style={{ marginBottom: 12, border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                {item.name} · FOB {money(fob)} · Despesas rateadas {money(allocatedExpenses)}
              </summary>
              <div style={{ overflowX: "auto", marginTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead><tr><th>Despesa</th><th>Total</th><th>Critério</th><th>Participação</th><th>Valor alocado</th><th>Tratamento</th></tr></thead>
                  <tbody>
                    <tr><td>FOB do item</td><td>{money(fob)}</td><td>Valor do item</td><td>100%</td><td>{money(fob)}</td><td>Mercadoria</td></tr>
                    {detail.map((row) => {
                      const allocation = row.allocation!;
                      return <tr key={row.id}>
                        <td>{row.description}</td>
                        <td>{money(row.amount)}</td>
                        <td>{methodLabel[row.method]}</td>
                        <td>{(allocation.share * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</td>
                        <td>{money(allocation.allocatedCost)}</td>
                        <td>{row.treatment}</td>
                      </tr>;
                    })}
                    <tr><td><b>Total</b></td><td>—</td><td>—</td><td>—</td><td><b>{money(fob + allocatedExpenses)}</b></td><td>Base econômica antes dos tributos</td></tr>
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </section>
    </main>
  );
}

function Metric({ label, value, hi }: { label: string; value: string; hi?: boolean }) {
  return <div className={`metric ${hi ? "hi" : ""}`}><small>{label}</small><b>{value}</b></div>;
}
