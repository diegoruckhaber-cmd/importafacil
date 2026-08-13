"use client";

import { useMemo, useState } from "react";
import { calculateSCMultiItemFinalCost } from "../../lib/sc-multi-item-final-cost-engine";
import { decideSCItem } from "../../lib/sc-decision-engine";
import { resolveSCBenefit } from "../../lib/sc-benefit-resolution";

type TTD = "409" | "410" | "77" | "none";
type Destination = "commercial_resale" | "industrialization";
type Allocation = "item_value" | "quantity" | "weight" | "volume";
type Treatment = "operational_cost" | "icms_import_base" | "conditional";

type ItemState = {
  id: string;
  ncm: string;
  name: string;
  origin: string;
  quantity: number;
  unitFobUsd: number;
  weightKg: number;
  volumeM3: number;
  iiRate: number;
  ipiRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsRate: number;
  ttd: TTD;
  destination: Destination;
  validConcession: boolean;
  importEntryInSC: boolean;
  expanded: boolean;
};

type ExpenseState = {
  id: string;
  description: string;
  amount: number;
  treatment: Treatment;
  allocation: Allocation;
};

const money = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const makeItem = (index: number): ItemState => ({
  id: `ITEM-${index}`,
  ncm: index === 1 ? "3907.60.00" : "2915.90.90",
  name: `Produto ${index}`,
  origin: "CN",
  quantity: index === 1 ? 1000 : 500,
  unitFobUsd: index === 1 ? 10 : 18,
  weightKg: index === 1 ? 1000 : 750,
  volumeM3: index === 1 ? 1 : 1.5,
  iiRate: 10,
  ipiRate: 5,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsRate: 17,
  ttd: index === 1 ? "410" : index === 2 ? "77" : "none",
  destination: index === 2 ? "industrialization" : "commercial_resale",
  validConcession: true,
  importEntryInSC: true,
  expanded: false,
});

export default function SCOperationPage() {
  const [operationName, setOperationName] = useState("Nova importação");
  const [importDate, setImportDate] = useState("2026-08-13");
  const [importer, setImporter] = useState("Trust Importação e Exportação");
  const [state, setState] = useState("SC");
  const [exchangeRate, setExchangeRate] = useState(5.5);
  const [freightUsd, setFreightUsd] = useState(1200);
  const [insuranceUsd, setInsuranceUsd] = useState(100);
  const [items, setItems] = useState<ItemState[]>([makeItem(1), makeItem(2)]);
  const [expenses, setExpenses] = useState<ExpenseState[]>([
    { id: "ARM-001", description: "Armazenagem", amount: 3500, treatment: "operational_cost", allocation: "weight" },
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
        { id: "FREIGHT", description: "Frete internacional", amount: freightUsd * exchangeRate, treatment: "customs_base" as const, allocation: "item_value" as const },
        { id: "INSURANCE", description: "Seguro internacional", amount: insuranceUsd * exchangeRate, treatment: "customs_base" as const, allocation: "item_value" as const },
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
        if (decision.decision !== "apply") {
          benefitsByItem[item.id] = {
            decision: decision.decision,
            importDeferred: false,
            outputPresumedCredit: false,
            benefitICMS: null,
            estimatedSavings: null,
            reasons: decision.reasons,
            blockingIssues: decision.blockingIssues,
            source: "SC decision engine",
          };
          return;
        }
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

  return (
    <main className="wrap scTest">
      <header className="scHeader">
        <div>
          <div className="eyebrow dark">IMPORTAFÁCIL · NOVA IMPORTAÇÃO</div>
          <h1>Uma operação. Vários itens. Um cálculo auditável.</h1>
          <p>Preencha os dados da operação, produtos e despesas. O motor calcula o custo por item e preserva a memória da composição do resultado.</p>
        </div>
        <a className="secondaryBtn" href="/sc-test">Abrir laboratório jurídico</a>
      </header>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="sectionTitle"><span className="step">1</span><div><h2>Dados da operação</h2><p>Informações globais que serão compartilhadas por todos os itens.</p></div></div>
        <div className="fields four">
          <Field label="Nome da simulação" value={operationName} onChange={setOperationName} text />
          <Field label="Data da importação" value={importDate} onChange={setImportDate} text type="date" />
          <Field label="Importador" value={importer} onChange={setImporter} text />
          <Field label="UF desembaraço" value={state} onChange={setState} text />
          <Field label="Câmbio R$/US$" value={exchangeRate} onChange={setExchangeRate} />
          <Field label="Frete internacional US$" value={freightUsd} onChange={setFreightUsd} />
          <Field label="Seguro internacional US$" value={insuranceUsd} onChange={setInsuranceUsd} />
        </div>
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="resultTop">
          <div className="sectionTitle"><span className="step">2</span><div><h2>Produtos da importação</h2><p>NCM, origem, valor, peso, destinação e tratamento tributário por item.</p></div></div>
          <button className="secondaryBtn" onClick={addItem}>+ Adicionar item</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="importTable">
            <thead><tr><th>Item</th><th>NCM</th><th>Origem</th><th>Qtd.</th><th>FOB unit. US$</th><th>Peso kg</th><th>m³</th><th>Destinação</th><th>TTD</th><th>Ato</th><th /></tr></thead>
            <tbody>{items.map((item) => <tr key={item.id}>
              <td><input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} /></td>
              <td><input value={item.ncm} onChange={(e) => updateItem(item.id, "ncm", e.target.value)} placeholder="0000.00.00" /></td>
              <td><input value={item.origin} onChange={(e) => updateItem(item.id, "origin", e.target.value.toUpperCase())} maxLength={2} /></td>
              <td><input type="number" min="0" step="any" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} /></td>
              <td><input type="number" min="0" step="any" value={item.unitFobUsd} onChange={(e) => updateItem(item.id, "unitFobUsd", Number(e.target.value))} /></td>
              <td><input type="number" min="0" step="any" value={item.weightKg} onChange={(e) => updateItem(item.id, "weightKg", Number(e.target.value))} /></td>
              <td><input type="number" min="0" step="any" value={item.volumeM3} onChange={(e) => updateItem(item.id, "volumeM3", Number(e.target.value))} /></td>
              <td><select value={item.destination} onChange={(e) => updateItem(item.id, "destination", e.target.value as Destination)}><option value="commercial_resale">Revenda</option><option value="industrialization">Industrialização SC</option></select></td>
              <td><select value={item.ttd} onChange={(e) => updateItem(item.id, "ttd", e.target.value as TTD)}><option value="none">Normal</option><option value="409">TTD 409</option><option value="410">TTD 410</option><option value="77">TTD 77</option></select></td>
              <td><input aria-label={`Ato concessivo ${item.id}`} type="checkbox" checked={item.validConcession} onChange={(e) => updateItem(item.id, "validConcession", e.target.checked)} /></td>
              <td><button className="secondaryBtn" onClick={() => removeItem(item.id)}>Excluir</button></td>
            </tr>)}
            </tbody>
          </table>
        </div>
        <div className="itemAdvancedGrid">
          {items.map((item) => <div className="miniCard" key={item.id}>
            <button className="miniCardButton" onClick={() => updateItem(item.id, "expanded", !item.expanded)}><b>{item.id} · parâmetros fiscais</b><span>{item.expanded ? "−" : "+"}</span></button>
            {item.expanded && <div className="advancedFields">
              <Field label="II %" value={item.iiRate} onChange={(v) => updateItem(item.id, "iiRate", v)} />
              <Field label="IPI %" value={item.ipiRate} onChange={(v) => updateItem(item.id, "ipiRate", v)} />
              <Field label="PIS-Importação %" value={item.pisImportRate} onChange={(v) => updateItem(item.id, "pisImportRate", v)} />
              <Field label="COFINS-Importação %" value={item.cofinsImportRate} onChange={(v) => updateItem(item.id, "cofinsImportRate", v)} />
              <Field label="ICMS %" value={item.icmsRate} onChange={(v) => updateItem(item.id, "icmsRate", v)} />
              <label className="checkField"><input type="checkbox" checked={item.importEntryInSC} onChange={(e) => updateItem(item.id, "importEntryInSC", e.target.checked)} /> Desembaraço em SC</label>
            </div>}
          </div>)}
        </div>
        <div className="infoNote">Os percentuais acima permanecem editáveis nesta versão de testes. Na versão fiscal automatizada, o motor passará a resolvê-los a partir da NCM, origem, vigência e enquadramento.</div>
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="resultTop"><div className="sectionTitle"><span className="step">3</span><div><h2>Despesas e rateio</h2><p>Cada despesa pode ter tratamento e critério de rateio próprios.</p></div></div><button className="secondaryBtn" onClick={addExpense}>+ Adicionar despesa</button></div>
        <div style={{ overflowX: "auto" }}>
          <table className="importTable expenseTable"><thead><tr><th>Despesa</th><th>Valor R$</th><th>Tratamento</th><th>Critério de rateio</th></tr></thead>
            <tbody>{expenses.map((expense) => <tr key={expense.id}>
              <td><input value={expense.description} onChange={(e) => updateExpense(expense.id, "description", e.target.value)} /></td>
              <td><input type="number" min="0" step="any" value={expense.amount} onChange={(e) => updateExpense(expense.id, "amount", Number(e.target.value))} /></td>
              <td><select value={expense.treatment} onChange={(e) => updateExpense(expense.id, "treatment", e.target.value as Treatment)}><option value="operational_cost">Custo operacional</option><option value="icms_import_base">Base ICMS-importação</option><option value="conditional">Condicional</option></select></td>
              <td><select value={expense.allocation} onChange={(e) => updateExpense(expense.id, "allocation", e.target.value as Allocation)}><option value="item_value">Valor aduaneiro</option><option value="quantity">Quantidade</option><option value="weight">Peso</option><option value="volume">Cubagem</option></select></td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="allocationSummary"><span>Frete: <b>{money(freightUsd * exchangeRate)}</b></span><span>Seguro: <b>{money(insuranceUsd * exchangeRate)}</b></span><span>Despesas adicionais: <b>{money(expenses.reduce((sum, e) => sum + e.amount, 0))}</b></span></div>
      </section>

      <button className="primaryBtn calculateBtn" onClick={() => setSubmitted(true)}>Calcular operação completa</button>

      {calculation && "error" in calculation && <section className="card" style={{ marginTop: 18 }}><div className="warning">⚠ {calculation.error}</div></section>}

      {calculation && !("error" in calculation) && <ResultView calculation={calculation} items={items} />}
    </main>
  );
}

function ResultView({ calculation, items }: { calculation: any; items: ItemState[] }) {
  return <section className="card scResult" style={{ marginTop: 18 }}>
    <div className="resultTop"><div className="sectionTitle"><span className="step">4</span><div><div className="eyebrow dark">RESULTADO</div><h2>Custo final por item</h2><p>O cálculo mantém o caminho da despesa até o custo final.</p></div></div><Status status={calculation.status} /></div>
    <div className="metrics">
      <Metric t="Valor aduaneiro total" v={money(calculation.totalCustomsValue)} />
      <Metric t="Despesas rateadas" v={money(calculation.totalAllocatedExpenses)} />
      <Metric t="Tributos normais" v={money(calculation.totalNormalTaxes)} />
      <Metric t="Economia ICMS-importação" v={money(calculation.totalImportICMSSavings)} hi />
      <Metric t="Custo antes do benefício" v={money(calculation.totalLandedCostBeforeBenefit)} />
      <Metric t="Custo final" v={money(calculation.totalLandedCostAfterBenefit)} hi />
    </div>
    <div className="memoryList">
      {calculation.items.map((result: any) => {
        const source = items.find((item) => item.id === result.itemId);
        return <details className="memoryItem" key={result.itemId}>
          <summary><span><b>{result.itemId}</b> · {source?.name} · NCM {source?.ncm}</span><span><b>{money(result.landedCostAfterBenefit)}</b> · <Status status={result.benefit.decision} /></span></summary>
          <div className="memoryGrid">
            <div><span>Valor aduaneiro</span><b>{money(result.customsValue)}</b></div>
            <div><span>Despesas rateadas</span><b>{money(result.allocatedExpensesTotal)}</b></div>
            <div><span>Tributos normais</span><b>{money(result.normalTaxTotal)}</b></div>
            <div><span>ICMS economizado</span><b>{money(result.importICMSSavings)}</b></div>
            <div><span>Custo antes do benefício</span><b>{money(result.landedCostBeforeBenefit)}</b></div>
            <div><span>Custo final</span><b>{money(result.landedCostAfterBenefit)}</b></div>
          </div>
          <div className="memoryNotes"><b>Tratamento:</b> {source?.ttd === "none" ? "Regime normal" : `TTD ${source?.ttd}`} · <b>Origem:</b> {source?.origin} · <b>Destinação:</b> {source?.destination === "industrialization" ? "Industrialização SC" : "Revenda"}</div>
        </details>;
      })}
    </div>
    {calculation.warnings.length > 0 && <div className="warning" style={{ marginTop: 18 }}>⚠️ {calculation.warnings.join(" ")}</div>}
    <div className="infoNote" style={{ marginTop: 12 }}>O crédito presumido da saída não é descontado neste custo de importação. A etapa de venda/saída será calculada separadamente.</div>
  </section>;
}

function Field({ label, value, onChange, text = false, type = "text" }: { label: string; value: string | number; onChange: (value: any) => void; text?: boolean; type?: string }) {
  return <label className="field"><span>{label}</span><input type={text ? type : "number"} min={text ? undefined : 0} step={text ? undefined : "any"} value={value} onChange={(e) => onChange(text ? e.target.value : Number(e.target.value))} /></label>;
}

function Metric({ t, v, hi = false }: { t: string; v: string; hi?: boolean }) {
  return <div className={`metric ${hi ? "highlight" : ""}`}><span>{t}</span><strong>{v}</strong></div>;
}

function Status({ status }: { status: string }) {
  const normalized = String(status).toLowerCase();
  const label = normalized === "apply" || normalized === "approved" ? "APLICÁVEL" : normalized === "conditional" ? "CONDICIONAL" : normalized === "not_apply" ? "NÃO APLICÁVEL" : normalized.toUpperCase();
  return <span className={`status ${normalized === "apply" ? "ok" : normalized === "conditional" ? "warn" : "neutral"}`}>{label}</span>;
}
