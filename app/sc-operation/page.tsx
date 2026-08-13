"use client";

import { useMemo, useState } from "react";
import { calculateSCMultiItemFinalCost } from "../../lib/sc-multi-item-final-cost-engine";
import { decideSCItem } from "../../lib/sc-decision-engine";
import { resolveSCBenefit } from "../../lib/sc-benefit-resolution";

type ItemState = {
  id: string;
  name: string;
  quantity: number;
  unitFobUsd: number;
  weightKg: number;
  volumeM3: number;
  iiRate: number;
  ipiRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsRate: number;
  ttd: "409" | "410" | "77" | "none";
  destination: "commercial_resale" | "industrialization";
  validConcession: boolean;
  importEntryInSC: boolean;
};

type ExpenseState = {
  id: string;
  description: string;
  amount: number;
  treatment: "operational_cost" | "icms_import_base" | "conditional";
  allocation: "item_value" | "quantity" | "weight" | "volume";
};

const money = (n: number | null) => n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const makeItem = (index: number): ItemState => ({
  id: `ITEM-${index}`,
  name: `Produto ${index}`,
  quantity: index === 1 ? 1000 : 500,
  unitFobUsd: index === 1 ? 10 : 18,
  weightKg: index === 1 ? 1000 : 750,
  volumeM3: index === 1 ? 1 : 1.5,
  iiRate: 10,
  ipiRate: 5,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsRate: 17,
  ttd: index === 1 ? "410" : "none",
  destination: "commercial_resale",
  validConcession: true,
  importEntryInSC: true,
});

export default function SCOperationPage() {
  const [exchangeRate, setExchangeRate] = useState(5.5);
  const [freightUsd, setFreightUsd] = useState(1200);
  const [insuranceUsd, setInsuranceUsd] = useState(100);
  const [items, setItems] = useState<ItemState[]>([makeItem(1), makeItem(2)]);
  const [expenses, setExpenses] = useState<ExpenseState[]>([
    { id: "ARM-001", description: "Armazenagem", amount: 3500, treatment: "operational_cost", allocation: "weight" },
    { id: "ICMS-001", description: "Acréscimo tributável no ICMS", amount: 0, treatment: "icms_import_base", allocation: "item_value" },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const calculation = useMemo(() => {
    if (!submitted) return null;

    try {
      const engineItems = items.map((item) => ({
        itemId: item.id,
        customsValue: item.quantity * item.unitFobUsd * exchangeRate,
        quantity: item.quantity,
        weightKg: item.weightKg,
        volumeM3: item.volumeM3,
        iiRate: item.iiRate,
        ipiRate: item.ipiRate,
        pisImportRate: item.pisImportRate,
        cofinsImportRate: item.cofinsImportRate,
        icmsRate: item.icmsRate,
      }));

      const engineExpenses = [
        {
          id: "FREIGHT",
          description: "Frete internacional",
          amount: freightUsd * exchangeRate,
          treatment: "customs_base" as const,
          allocation: "item_value" as const,
        },
        {
          id: "INSURANCE",
          description: "Seguro internacional",
          amount: insuranceUsd * exchangeRate,
          treatment: "customs_base" as const,
          allocation: "item_value" as const,
        },
        ...expenses.map((expense) => ({ ...expense })),
      ];

      const benefitsByItem: Record<string, ReturnType<typeof resolveSCBenefit>> = {};

      items.forEach((item) => {
        if (item.ttd === "none" || item.ttd === "77") return;

        const decision = decideSCItem({
          id: item.id,
          ttd: Number(item.ttd) as 409 | 410,
          destination: item.destination,
          validConcession: item.validConcession,
          importEntryInSC: item.importEntryInSC,
          sameNcmPositionAfterFractionation: true,
        });

        if (decision.decision !== "apply") return;

        benefitsByItem[item.id] = resolveSCBenefit({
          ttd: Number(item.ttd) as 409 | 410,
          destination: item.destination,
          normalOutputICMS: 0,
          taxableOutput: true,
          industrializationInSC: item.destination === "industrialization",
          preservesOriginalCharacteristics: true,
          sameNcmPosition: true,
          otherDeferment: false,
          paragraph23Or24: false,
          equivalentTaxableEventElection: false,
        });
      });

      return calculateSCMultiItemFinalCost({ items: engineItems, expenses: engineExpenses, benefitsByItem });
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Não foi possível calcular a operação." };
    }
  }, [submitted, items, expenses, exchangeRate, freightUsd, insuranceUsd]);

  const updateItem = <K extends keyof ItemState>(id: string, key: K, value: ItemState[K]) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));
    setSubmitted(false);
  };

  const updateExpense = <K extends keyof ExpenseState>(id: string, key: K, value: ExpenseState[K]) => {
    setExpenses((current) => current.map((expense) => expense.id === id ? { ...expense, [key]: value } : expense));
    setSubmitted(false);
  };

  const addItem = () => setItems((current) => [...current, makeItem(current.length + 1)]);
  const removeItem = (id: string) => setItems((current) => current.length > 1 ? current.filter((item) => item.id !== id) : current);
  const addExpense = () => setExpenses((current) => [...current, { id: `EXP-${current.length + 1}`, description: "Nova despesa", amount: 0, treatment: "operational_cost", allocation: "item_value" }]);

  return <main className="wrap scTest">
    <div className="scHeader">
      <div>
        <div className="eyebrow dark">LABORATÓRIO SC · MOTOR POR ITEM</div>
        <h1>Uma importação. Vários produtos. Regras diferentes.</h1>
        <p>O cálculo agora trabalha item a item: despesas são rateadas, bases tributárias são recalculadas e o benefício de SC é aplicado somente onde a camada jurídica confirmou a elegibilidade.</p>
      </div>
      <a className="secondaryBtn" href="/sc-test">Teste jurídico</a>
    </div>

    <section className="card" style={{ marginBottom: 18 }}>
      <h2 style={{ marginTop: 0 }}>Dados globais do embarque</h2>
      <div className="fields">
        <Field label="Câmbio (R$/US$)" value={exchangeRate} onChange={setExchangeRate} />
        <Field label="Frete internacional (US$)" value={freightUsd} onChange={setFreightUsd} />
        <Field label="Seguro internacional (US$)" value={insuranceUsd} onChange={setInsuranceUsd} />
      </div>
    </section>

    <section className="card" style={{ marginBottom: 18 }}>
      <div className="resultTop"><h2>Itens da importação</h2><button className="secondaryBtn" onClick={addItem}>+ Adicionar item</button></div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
          <thead><tr><th>Produto</th><th>Qtd.</th><th>FOB US$</th><th>Peso kg</th><th>m³</th><th>II %</th><th>IPI %</th><th>ICMS %</th><th>TTD</th><th>Ato</th><th /></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id}>
            <td><input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} /></td>
            <td><input type="number" min="0" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} /></td>
            <td><input type="number" min="0" step="any" value={item.unitFobUsd} onChange={(e) => updateItem(item.id, "unitFobUsd", Number(e.target.value))} /></td>
            <td><input type="number" min="0" step="any" value={item.weightKg} onChange={(e) => updateItem(item.id, "weightKg", Number(e.target.value))} /></td>
            <td><input type="number" min="0" step="any" value={item.volumeM3} onChange={(e) => updateItem(item.id, "volumeM3", Number(e.target.value))} /></td>
            <td><input type="number" min="0" step="any" value={item.iiRate} onChange={(e) => updateItem(item.id, "iiRate", Number(e.target.value))} /></td>
            <td><input type="number" min="0" step="any" value={item.ipiRate} onChange={(e) => updateItem(item.id, "ipiRate", Number(e.target.value))} /></td>
            <td><input type="number" min="0" step="any" value={item.icmsRate} onChange={(e) => updateItem(item.id, "icmsRate", Number(e.target.value))} /></td>
            <td><select value={item.ttd} onChange={(e) => updateItem(item.id, "ttd", e.target.value as ItemState["ttd"])}><option value="none">Normal</option><option value="409">TTD 409</option><option value="410">TTD 410</option><option value="77">TTD 77</option></select></td>
            <td><input type="checkbox" checked={item.validConcession} onChange={(e) => updateItem(item.id, "validConcession", e.target.checked)} /></td>
            <td><button className="secondaryBtn" onClick={() => removeItem(item.id)}>Excluir</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <p style={{ marginBottom: 0, color: "#64748b" }}>Peso e cubagem alimentam o rateio. Cada item mantém sua própria tributação e tratamento SC.</p>
    </section>

    <section className="card" style={{ marginBottom: 18 }}>
      <div className="resultTop"><h2>Despesas adicionais</h2><button className="secondaryBtn" onClick={addExpense}>+ Adicionar despesa</button></div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead><tr><th>Descrição</th><th>Valor R$</th><th>Tratamento</th><th>Rateio</th></tr></thead>
          <tbody>{expenses.map((expense) => <tr key={expense.id}>
            <td><input value={expense.description} onChange={(e) => updateExpense(expense.id, "description", e.target.value)} /></td>
            <td><input type="number" min="0" step="any" value={expense.amount} onChange={(e) => updateExpense(expense.id, "amount", Number(e.target.value))} /></td>
            <td><select value={expense.treatment} onChange={(e) => updateExpense(expense.id, "treatment", e.target.value as ExpenseState["treatment"])}><option value="operational_cost">Custo operacional</option><option value="icms_import_base">Acréscimo base ICMS</option><option value="conditional">Condicional</option></select></td>
            <td><select value={expense.allocation} onChange={(e) => updateExpense(expense.id, "allocation", e.target.value as ExpenseState["allocation"])}><option value="item_value">Valor aduaneiro</option><option value="quantity">Quantidade</option><option value="weight">Peso</option><option value="volume">Cubagem</option></select></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>

    <button className="primaryBtn" onClick={() => setSubmitted(true)}>Calcular operação completa</button>

    {calculation && "error" in calculation && <section className="card" style={{ marginTop: 18 }}><div className="warning">⚠ {calculation.error}</div></section>}

    {calculation && !('error' in calculation) && <section className="card scResult" style={{ marginTop: 18 }}>
      <div className="resultTop"><div><div className="eyebrow dark">RESULTADO CONSOLIDADO</div><h2>Custo final por item</h2></div><Status status={calculation.status} /></div>
      <div className="metrics">
        <Metric t="Valor aduaneiro total" v={money(calculation.totalCustomsValue)} />
        <Metric t="Despesas rateadas" v={money(calculation.totalAllocatedExpenses)} />
        <Metric t="Tributos normais" v={money(calculation.totalNormalTaxes)} />
        <Metric t="Economia ICMS-importação" v={money(calculation.totalImportICMSSavings)} hi />
        <Metric t="Custo antes do benefício" v={money(calculation.totalLandedCostBeforeBenefit)} />
        <Metric t="Custo final após benefício" v={money(calculation.totalLandedCostAfterBenefit)} hi />
      </div>

      <div style={{ overflowX: "auto", marginTop: 18 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 950 }}>
          <thead><tr><th>Item</th><th>Tributos normais</th><th>ICMS economizado</th><th>Tributos após benefício</th><th>Custo antes</th><th>Custo final</th><th>Status</th></tr></thead>
          <tbody>{calculation.items.map((item) => <tr key={item.itemId}>
            <td><b>{item.itemId}</b></td>
            <td>{money(item.normalTaxTotal)}</td>
            <td>{money(item.importICMSSavings)}</td>
            <td>{money(item.benefitTaxTotal)}</td>
            <td>{money(item.landedCostBeforeBenefit)}</td>
            <td><b>{money(item.landedCostAfterBenefit)}</b></td>
            <td><Status status={item.benefit.decision} /></td>
          </tr>)}</tbody>
        </table>
      </div>

      {calculation.warnings.length > 0 && <div className="warning" style={{ marginTop: 18 }}>⚠️ {calculation.warnings.join(" ")}</div>}
      <div className="warning" style={{ marginTop: 12 }}>O crédito presumido da saída não é descontado neste custo de importação. Ele será calculado em uma etapa própria da venda/saída.</div>
    </section>}
  </main>;
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label>{label}<input type="number" min="0" step="any" value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>;
}

function Metric({ t, v, hi }: { t: string; v: string; hi?: boolean }) {
  return <div className={`metric ${hi ? "hi" : ""}`}><small>{t}</small><b>{v}</b></div>;
}

function Status({ status }: { status: string }) {
  const label = status === "calculated" || status === "apply" ? "APLICÁVEL" : status === "blocked" || status === "deny" ? "BLOQUEADO" : "CONDICIONAL";
  return <span className={`status ${status}`}>{label}</span>;
}
