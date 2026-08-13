"use client";

import { useMemo, useState } from "react";
import { allocateImportCost } from "../../lib/import-cost-allocation";

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SCAuditPage() {
  const [exchange, setExchange] = useState(5.5);
  const [freight, setFreight] = useState(1200);
  const [insurance, setInsurance] = useState(100);
  const [storage, setStorage] = useState(3500);
  const [method, setMethod] = useState<"item_value" | "quantity" | "weight" | "volume">("weight");
  const items = [
    { id: "ITEM-1", name: "Produto 1", qty: 1000, unitUsd: 10, weight: 1000, volume: 1 },
    { id: "ITEM-2", name: "Produto 2", qty: 500, unitUsd: 18, weight: 750, volume: 1.5 },
  ];

  const rows = useMemo(() => {
    const inputs = items.map((item) => ({ itemId: item.id, customsValue: item.qty * item.unitUsd * exchange, quantity: item.qty, weightKg: item.weight, volumeM3: item.volume }));
    const expenses = [
      { id: "FREIGHT", description: "Frete internacional", amount: freight * exchange, allocation: "item_value" as const, treatment: "Base aduaneira" },
      { id: "INSURANCE", description: "Seguro internacional", amount: insurance * exchange, allocation: "item_value" as const, treatment: "Base aduaneira" },
      { id: "STORAGE", description: "Armazenagem", amount: storage, allocation: method, treatment: "Custo operacional" },
    ];
    return expenses.map((expense) => ({ ...expense, allocations: allocateImportCost(expense.amount, inputs, expense.allocation) }));
  }, [exchange, freight, insurance, storage, method]);

  return <main className="wrap scTest">
    <div className="scHeader"><div><div className="eyebrow dark">AUDITORIA · RATEIO POR ITEM</div><h1>Memória de cálculo da operação</h1><p>Esta tela mostra exatamente como cada despesa compartilhada chega a cada produto e qual percentual de rateio foi utilizado.</p></div><a className="secondaryBtn" href="/sc-operation">Voltar para operação</a></div>

    <section className="card" style={{ marginBottom: 18 }}><h2 style={{ marginTop: 0 }}>Parâmetros</h2><div className="fields">
      <label>Câmbio (R$/US$)<input type="number" step="any" value={exchange} onChange={(e) => setExchange(Number(e.target.value))} /></label>
      <label>Frete internacional (US$)<input type="number" step="any" value={freight} onChange={(e) => setFreight(Number(e.target.value))} /></label>
      <label>Seguro internacional (US$)<input type="number" step="any" value={insurance} onChange={(e) => setInsurance(Number(e.target.value))} /></label>
      <label>Armazenagem (R$)<input type="number" step="any" value={storage} onChange={(e) => setStorage(Number(e.target.value))} /></label>
      <label>Critério da armazenagem<select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}><option value="item_value">Valor aduaneiro</option><option value="quantity">Quantidade</option><option value="weight">Peso</option><option value="volume">Cubagem</option></select></label>
    </div></section>

    <section className="card"><h2 style={{ marginTop: 0 }}>Composição por item</h2>{items.map((item) => {
      const fob = item.qty * item.unitUsd * exchange;
      const detail = rows.map((row) => ({ ...row, allocation: row.allocations.find((allocation) => allocation.itemId === item.id) })).filter((row) => row.allocation);
      const totalExpenses = detail.reduce((sum, row) => sum + (row.allocation?.allocatedCost ?? 0), 0);
      return <details key={item.id} open style={{ marginBottom: 12, border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>{item.name} · FOB {money(fob)} · Despesas rateadas {money(totalExpenses)}</summary>
        <div style={{ overflowX: "auto", marginTop: 12 }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}><thead><tr><th>Despesa</th><th>Total</th><th>Critério</th><th>Participação</th><th>Valor alocado</th><th>Tratamento</th></tr></thead><tbody>
          <tr><td>FOB do item</td><td>{money(fob)}</td><td>Valor do item</td><td>100%</td><td>{money(fob)}</td><td>Mercadoria</td></tr>
          {detail.map((row) => { const allocated = row.allocation?.allocatedCost ?? 0; const share = row.allocation?.share ?? 0; return <tr key={row.id}><td>{row.description}</td><td>{money(row.amount)}</td><td>{row.allocation === "item_value" ? "Valor aduaneiro" : row.allocation === "quantity" ? "Quantidade" : row.allocation === "weight" ? "Peso" : "Cubagem"}</td><td>{(share * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</td><td>{money(allocated)}</td><td>{row.treatment}</td></tr>; })}
          <tr><td><b>Total</b></td><td>—</td><td>—</td><td>—</td><td><b>{money(fob + totalExpenses)}</b></td><td>Base econômica antes dos tributos</td></tr>
        </tbody></table></div>
      </details>;
    })}</section>
  </main>;
}
