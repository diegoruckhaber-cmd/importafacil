import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { SavedSimulationRecord } from "./simulation-record";

const A4 = { width: 595.28, height: 841.89 };
const BLUE = rgb(0.145, 0.388, 0.922);
const BLUE_DARK = rgb(0.07, 0.16, 0.34);
const BLUE_SOFT = rgb(0.94, 0.97, 1);
const TEXT = rgb(0.07, 0.10, 0.16);
const MUTED = rgb(0.40, 0.47, 0.56);
const BORDER = rgb(0.82, 0.86, 0.91);
const LINE = rgb(0.88, 0.91, 0.94);
const SOFT = rgb(0.97, 0.98, 0.99);
const GREEN = rgb(0.04, 0.55, 0.38);
const GREEN_SOFT = rgb(0.92, 0.98, 0.95);
const AMBER_SOFT = rgb(1, 0.98, 0.90);

const money = (value: unknown) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const usd = (value: unknown) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "USD" }).replace("US$", "USD");
const pct = (value: unknown) => value == null ? "-" : Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";
const num = (value: unknown, digits = 2) => Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

function taxLinePct(line: any) {
  if (!line) return null;
  if (Number.isFinite(Number(line.displayRate))) return Number(line.displayRate);
  if (Number.isFinite(Number(line.rate))) return Number(line.rate) * 100;
  return null;
}

function labelRegime(value: unknown) {
  const labels: Record<string, string> = {
    "lucro-real": "Lucro Real",
    "lucro-presumido": "Lucro Presumido",
    "simples-nacional": "Simples Nacional",
    "nao-informado": "Não informado",
  };
  return labels[String(value)] || "Não informado";
}

function labelApplication(value: unknown) {
  const labels: Record<string, string> = {
    commercial_resale: "Revenda",
    industrialization: "Industrialização",
    use_consumption: "Uso e consumo",
  };
  return labels[String(value)] || "Não informada";
}

function labelTransport(value: unknown) {
  const labels: Record<string, string> = {
    maritime_long_course: "Marítimo - longo curso",
    air: "Aéreo",
    road: "Rodoviário",
    other: "Outro",
  };
  return labels[String(value)] || String(value || "Não informado");
}

function labelDeclaration(value: unknown) {
  return String(value || "").toLowerCase() === "duimp" ? "DUIMP" : String(value || "DI").toUpperCase();
}

function safeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "simulacao-importacao";
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function uniqueRateLabel(rows: any[], getter: (row: any) => number | null | undefined) {
  const values = rows
    .map(getter)
    .filter((value): value is number => Number.isFinite(Number(value)))
    .map((value) => Number(Number(value).toFixed(6)));
  const unique = [...new Set(values)];
  if (!unique.length) return "";
  if (unique.length === 1) return pct(unique[0]);
  return "por item";
}

function defenseRateLabel(row: any) {
  const d = row?.federal?.defenseCommercial;
  if (d?.rate == null) return "-";
  const value = Number(d.rate).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  if (d.unit === "AD_VALOREM") return value + "%";
  const units: Record<string, string> = {
    USD_PER_KG: "USD/kg",
    USD_PER_TON: "USD/t",
    USD_PER_UNIT: "USD/un.",
    USD_PER_PAIR: "USD/par",
    USD_PER_THOUSAND_UNITS: "USD/mil un.",
    USD_PER_SQUARE_METER: "USD/m²",
  };
  return value + " " + (units[d.unit] || String(d.unit || ""));
}

function cleanAttention(points: unknown[]) {
  const seen = new Set<string>();
  return points
    .map((point) => String(point || "").replace(/https?:\/\/\S+/g, "").trim())
    .filter(Boolean)
    .filter((point) => !/\bresolved\b|Fundamento:/i.test(point))
    .filter((point) => {
      if (seen.has(point)) return false;
      seen.add(point);
      return true;
    });
}

export async function buildSimulationReportPdf(sim: Pick<SavedSimulationRecord, "name" | "input" | "result" | "created_at">) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const result: any = sim.result || {};
  const summary: any = result.summary || {};
  const items: any[] = Array.isArray(result.items) ? result.items : [];
  const attention = cleanAttention(Array.isArray(result.attentionPoints) ? result.attentionPoints : []);
  const legalTrace: any[] = Array.isArray(result.legalTrace) ? result.legalTrace : [];
  const input: any = sim.input || {};
  const margin = 31;
  const contentWidth = A4.width - margin * 2;
  let page!: PDFPage;
  let y = 0;

  const addPage = () => {
    page = pdf.addPage([A4.width, A4.height]);
    y = A4.height - 34;
  };

  const ensure = (height: number) => {
    if (y - height < 42) addPage();
  };

  const text = (value: string, x: number, size = 7.5, color = TEXT, font: PDFFont = regular, maxWidth?: number, lineHeight?: number) => {
    const lines = maxWidth ? wrapText(value, font, size, maxWidth) : [value];
    const lh = lineHeight || size * 1.25;
    for (const line of lines) {
      ensure(lh);
      page.drawText(line, { x, y, size, font, color });
      y -= lh;
    }
    return lines.length;
  };

  const section = (title: string) => {
    ensure(22);
    page.drawText(title.toUpperCase(), { x: margin, y, size: 8.1, font: bold, color: BLUE });
    y -= 5;
    page.drawLine({ start: { x: margin, y }, end: { x: A4.width - margin, y }, thickness: 1.05, color: BLUE });
    y -= 12;
  };

  const keyValueRow = (label: string, value: string, boldValue = false, accent = false) => {
    ensure(14);
    page.drawText(label, { x: margin, y, size: 7.2, font: regular, color: MUTED });
    const vFont = boldValue ? bold : regular;
    const vColor = accent ? GREEN : TEXT;
    const width = vFont.widthOfTextAtSize(value, 7.5);
    page.drawText(value, { x: A4.width - margin - width, y, size: 7.5, font: vFont, color: vColor });
    y -= 3;
    page.drawLine({ start: { x: margin, y }, end: { x: A4.width - margin, y }, thickness: 0.45, color: LINE });
    y -= 9;
  };

  const threeValueBand = (values: Array<{ label: string; value: string; accent?: boolean }>) => {
    ensure(50);
    const gap = 3;
    const width = (contentWidth - gap * 2) / 3;
    values.forEach((entry, index) => {
      const x = margin + index * (width + gap);
      page.drawRectangle({
        x, y: y - 42, width, height: 42,
        color: entry.accent ? GREEN_SOFT : SOFT,
        borderColor: entry.accent ? rgb(0.62, 0.86, 0.76) : BORDER,
        borderWidth: 0.65,
      });
      page.drawText(entry.label.toUpperCase(), { x: x + 8, y: y - 12, size: 6.1, font: bold, color: MUTED });
      page.drawText(entry.value, { x: x + 8, y: y - 31, size: 12.1, font: bold, color: entry.accent ? GREEN : TEXT });
    });
    y -= 51;
  };

  addPage();

  page.drawText("ImportaFácil", { x: margin, y, size: 18, font: bold, color: BLUE_DARK });
  const reportTitle = "SIMULAÇÃO DE IMPORTAÇÃO";
  const reportSub = "PRÉ-ESTUDO TRIBUTÁRIO E FINANCEIRO";
  page.drawText(reportTitle, {
    x: A4.width - margin - bold.widthOfTextAtSize(reportTitle, 9.5), y: y + 2, size: 9.5, font: bold, color: TEXT,
  });
  page.drawText(reportSub, {
    x: A4.width - margin - bold.widthOfTextAtSize(reportSub, 7), y: y - 10, size: 7, font: bold, color: BLUE,
  });
  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: A4.width - margin, y }, thickness: 1.4, color: BLUE });
  y -= 13;

  const scenario = String(sim.name || input.scenarioName || "Simulação de importação");
  const reportDate = new Date(sim.created_at || Date.now()).toLocaleDateString("pt-BR");
  const meta = [
    ["SIMULAÇÃO", scenario],
    ["DATA", reportDate],
    ["DESTINO", String(result.operation?.destinationUf || input.destinationUf || "-")],
    ["STATUS", result.status === "calculated" ? "Concluído" : result.status === "alert" ? "Concluído com alertas" : "Incompleto"],
  ];
  const metaW = contentWidth / 4;
  meta.forEach(([label, value], index) => {
    const x = margin + index * metaW;
    page.drawRectangle({ x, y: y - 31, width: metaW, height: 31, color: index % 2 ? rgb(0.985,0.99,1) : rgb(1,1,1), borderColor: BORDER, borderWidth: 0.55 });
    page.drawText(label, { x: x + 6, y: y - 9, size: 5.8, font: bold, color: MUTED });
    const valueLines = wrapText(value, bold, 7.2, metaW - 12).slice(0,2);
    let my = y - 20;
    valueLines.forEach((line) => { page.drawText(line, { x: x + 6, y: my, size: 7.2, font: bold, color: TEXT }); my -= 8; });
  });
  y -= 40;

  section("Dados da operação");
  const operationRows = [
    "UF de destino: " + String(result.operation?.destinationUf || input.destinationUf || "-") + "    Regime: " + labelRegime(result.operation?.companyTaxRegime || input.companyTaxRegime) + "    Finalidade: " + (items.length === 1 ? labelApplication(items[0]?.creditAnalysis?.application || input.items?.[0]?.destination) : "Múltiplas aplicações"),
    "Modal: " + labelTransport(input.transportMode) + "    Declaração: " + labelDeclaration(input.declarationType) + "    Câmbio: R$ " + num(result.operation?.exchange || input.exchange || 0, 4),
    "Frete: " + usd(input.freight || 0) + "    Seguro: " + usd(input.insurance || 0) + "    Margem alvo padrão: " + pct(input.targetMarginPercent || 0),
  ];
  operationRows.forEach((row) => {
    text(row, margin, 7.2, TEXT, regular, contentWidth, 9);
    y -= 1;
  });
  y -= 4;

  section("Mercadorias");
  const cols = [
    { x: margin, w: 22, label: "CÓD." },
    { x: margin + 24, w: 122, label: "DESCRIÇÃO" },
    { x: margin + 148, w: 51, label: "NCM" },
    { x: margin + 201, w: 46, label: "ORIGEM" },
    { x: margin + 249, w: 48, label: "QTD." },
    { x: margin + 299, w: 52, label: "FOB UNIT." },
    { x: margin + 353, w: 31, label: "II" },
    { x: margin + 386, w: 30, label: "IPI" },
    { x: margin + 418, w: 33, label: "ICMS" },
    { x: margin + 453, w: 50, label: "DEFESA" },
    { x: margin + 505, w: 28, label: "CUSTO/U." },
  ];
  page.drawRectangle({ x: margin, y: y - 14, width: contentWidth, height: 15, color: SOFT });
  cols.forEach((col) => page.drawText(col.label, { x: col.x, y: y - 9, size: 5.4, font: bold, color: MUTED }));
  y -= 19;

  items.forEach((row, index) => {
    ensure(28);
    const sourceItem = input.items?.find((item: any) => item.itemId === row.itemId) || input.items?.[index] || {};
    const application = row.creditAnalysis?.application || sourceItem.destination;
    const itemName = String(row.name || row.itemId || "-");
    const nameLines = wrapText(itemName, regular, 6.5, 118).slice(0,2);
    const origin = String(row.origin || sourceItem.origin || "-");
    const qty = Number(row.quantity ?? sourceItem.quantity ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    const fobUnit = usd(sourceItem.fobUnit || 0).replace("USD ","USD ");
    const iiRate = pct(row.federal?.ii?.rate);
    const ipiRate = pct(row.federal?.ipi?.rate);
    const icmsRate = pct(row.state?.icmsGeneralRate ?? row.calculation?.icmsNormalRate ?? taxLinePct(row.calculation?.taxLines?.icms));
    const defense = defenseRateLabel(row);
    const costUnit = row.commercial?.breakEvenPricePerUnitBrl == null ? "-" : money(row.commercial.breakEvenPricePerUnitBrl).replace("R$ ","R$ ");
    const cells = [
      String(index + 1).padStart(2, "0"),
      nameLines[0] || "-",
      String(row.ncm || sourceItem.ncm || "-"),
      origin.length > 10 ? origin.slice(0,10) : origin,
      qty,
      fobUnit,
      iiRate,
      ipiRate,
      icmsRate,
      defense,
      costUnit,
    ];
    cols.forEach((col, ci) => {
      const value = cells[ci];
      const font = ci === 1 ? bold : regular;
      page.drawText(value, { x: col.x, y, size: ci >= 6 ? 5.6 : 6.2, font, color: TEXT });
    });
    if (nameLines[1]) page.drawText(nameLines[1], { x: cols[1].x, y: y - 8, size: 6.2, font: bold, color: TEXT });
    const sub = "Aplicação: " + labelApplication(application) + (row.federal?.mercosurEuPreference?.appliedPreference ? " | Mercosul-UE aplicado" : "");
    page.drawText(sub, { x: cols[1].x, y: y - (nameLines[1] ? 16 : 9), size: 5.4, font: regular, color: MUTED });
    y -= nameLines[1] ? 26 : 20;
    page.drawLine({ start: { x: margin, y: y + 4 }, end: { x: A4.width - margin, y: y + 4 }, thickness: 0.45, color: LINE });
  });
  y -= 3;

  section("Principais valores");
  threeValueBand([
    { label: "Créditos recuperáveis", value: summary.recoverableTaxCreditsBrl == null ? "A validar" : money(summary.recoverableTaxCreditsBrl) },
    { label: "Desembolso bruto", value: money(summary.grossDisbursementBrl ?? summary.landedCostBrl) },
    { label: "Custo líquido", value: summary.economicNetCostBrl == null ? "A validar" : money(summary.economicNetCostBrl), accent: true },
  ]);

  section("Resumo financeiro");
  page.drawText("IMPORTAÇÃO", { x: margin, y, size: 6.4, font: bold, color: BLUE_DARK }); y -= 11;
  const totalFobUsd = (input.items || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0) * Number(item.fobUnit || 0), 0);
  keyValueRow("Valor FOB (USD)", usd(totalFobUsd), true);
  keyValueRow("Frete internacional (USD)", usd(input.freight || 0), true);
  keyValueRow("Seguro internacional", money(summary.insuranceBrl), false);
  if (summary.customsValueBrl != null) keyValueRow("Valor aduaneiro", money(summary.customsValueBrl), true, true);

  page.drawText("TRIBUTOS NA IMPORTAÇÃO", { x: margin, y, size: 6.4, font: bold, color: BLUE_DARK }); y -= 11;
  keyValueRow("II (" + (uniqueRateLabel(items, (row) => row.federal?.ii?.rate) || "por item") + ")", money(summary.iiBrl), false);
  keyValueRow("IPI (" + (uniqueRateLabel(items, (row) => row.federal?.ipi?.rate) || "por item") + ")", money(summary.ipiBrl), false);
  keyValueRow("PIS-Importação (" + (uniqueRateLabel(items, (row) => taxLinePct(row.calculation?.taxLines?.pisImport)) || "por item") + ")", money(summary.pisImportBrl), false);
  keyValueRow("Cofins-Importação (" + (uniqueRateLabel(items, (row) => taxLinePct(row.calculation?.taxLines?.cofinsImport)) || "por item") + ")", money(summary.cofinsImportBrl), false);
  keyValueRow("ICMS-Importação (" + (uniqueRateLabel(items, (row) => row.state?.icmsGeneralRate ?? row.calculation?.icmsNormalRate ?? taxLinePct(row.calculation?.taxLines?.icms)) || "por item") + ")", money(summary.icmsImportBrl), false);
  keyValueRow("Defesa comercial", money(summary.defenseCommercialBrl), false);
  const totalTaxes = Number(summary.iiBrl || 0) + Number(summary.ipiBrl || 0) + Number(summary.pisImportBrl || 0) + Number(summary.cofinsImportBrl || 0) + Number(summary.icmsImportBrl || 0) + Number(summary.defenseCommercialBrl || 0);
  keyValueRow("Total de tributos e defesa comercial", money(totalTaxes), true, true);

  page.drawText("DESPESAS E LOGÍSTICA", { x: margin, y, size: 6.4, font: bold, color: BLUE_DARK }); y -= 11;
  keyValueRow("Taxa Siscomex", money(summary.siscomexBrl), false);
  keyValueRow("AFRMM", money(summary.afrmmBrl), false);
  keyValueRow("Armazenagem", money(summary.storageBrl), false);
  keyValueRow("Outras despesas", money(summary.otherExpensesBrl), false);
  const totalExpenses = Number(summary.siscomexBrl || 0) + Number(summary.afrmmBrl || 0) + Number(summary.storageBrl || 0) + Number(summary.otherExpensesBrl || 0);
  keyValueRow("Total de despesas e logística", money(totalExpenses), true, true);

  page.drawText("CRÉDITOS RECUPERÁVEIS ESTIMADOS", { x: margin, y, size: 6.4, font: bold, color: BLUE_DARK }); y -= 11;
  keyValueRow("IPI", money(summary.ipiCreditBrl), false);
  keyValueRow("ICMS", money(summary.icmsCreditBrl), false);
  keyValueRow("PIS-Importação", money(summary.pisImportCreditBrl), false);
  keyValueRow("Cofins-Importação", money(summary.cofinsImportCreditBrl), false);
  keyValueRow("Total de créditos recuperáveis", summary.recoverableTaxCreditsBrl == null ? "A validar" : money(summary.recoverableTaxCreditsBrl), true, true);

  page.drawText("FECHAMENTO DA OPERAÇÃO", { x: margin, y, size: 6.4, font: bold, color: BLUE_DARK }); y -= 11;
  const totalWeight = (input.items || []).reduce((sum: number, item: any) => sum + Number(item.weightKg || 0), 0);
  keyValueRow("Peso líquido total", Number(totalWeight).toLocaleString("pt-BR",{maximumFractionDigits:2}) + " kg", false);
  keyValueRow("Desembolso bruto", money(summary.grossDisbursementBrl ?? summary.landedCostBrl), true, true);
  keyValueRow("Créditos recuperáveis", summary.recoverableTaxCreditsBrl == null ? "A validar" : money(summary.recoverableTaxCreditsBrl), true);
  keyValueRow("Custo econômico líquido", summary.economicNetCostBrl == null ? "A validar" : money(summary.economicNetCostBrl), true, true);

  if (attention.length || legalTrace.length) {
    addPage();
    page.drawText("ImportaFácil", { x: margin, y, size: 16, font: bold, color: BLUE_DARK });
    const detailsTitle = "DETALHES E VALIDAÇÕES";
    page.drawText(detailsTitle, { x: A4.width - margin - bold.widthOfTextAtSize(detailsTitle, 9), y: y + 1, size: 9, font: bold, color: TEXT });
    y -= 16;
    page.drawLine({ start: { x: margin, y }, end: { x: A4.width - margin, y }, thickness: 1.15, color: BLUE });
    y -= 15;

    if (attention.length) {
      section("Pontos de atenção");
      attention.forEach((point, index) => {
        const lines = wrapText(point, regular, 7.3, contentWidth - 33);
        const h = Math.max(26, lines.length * 9 + 12);
        ensure(h + 5);
        page.drawRectangle({ x: margin, y: y - h + 5, width: contentWidth, height: h, color: AMBER_SOFT, borderColor: rgb(0.95,0.80,0.39), borderWidth: 0.55 });
        page.drawCircle({ x: margin + 12, y: y - 8, size: 6, color: rgb(0.98,0.87,0.52) });
        page.drawText(String(index + 1), { x: margin + 9.6, y: y - 10.4, size: 5.8, font: bold, color: TEXT });
        let py = y - 8;
        lines.forEach((line) => { page.drawText(line, { x: margin + 26, y: py, size: 7.3, font: regular, color: TEXT }); py -= 9; });
        y -= h + 5;
      });
      y -= 4;
    }

    if (legalTrace.length) {
      section("Rastreabilidade técnica");
      legalTrace.slice(0, 24).forEach((entry: any) => {
        const line = [entry.itemId, entry.tax, entry.status, entry.legalBasis].filter(Boolean).join(" | ");
        text(line, margin, 6.5, MUTED, regular, contentWidth, 8.3);
        y -= 1;
      });
    }

    y -= 5;
    section("Premissas e limitações");
    [
      "Este documento é um pré-estudo e reproduz os resultados calculados a partir das premissas informadas.",
      "O custo econômico líquido considera apenas créditos tributários estimados conforme regime tributário, aplicação da mercadoria e condições informadas.",
      "Benefícios, enquadramentos especiais, preferências tarifárias e medidas de defesa comercial devem ser validados com a documentação efetiva da operação.",
    ].forEach((note) => { text("- " + note, margin, 6.8, MUTED, regular, contentWidth, 8.5); y -= 2; });
  }

  const pages = pdf.getPages();
  pages.forEach((p, index) => {
    p.drawLine({ start: { x: margin, y: 27 }, end: { x: A4.width - margin, y: 27 }, thickness: 0.55, color: BORDER });
    p.drawText("ImportaFácil - Simulador de Importação", { x: margin, y: 15, size: 6.2, font: regular, color: MUTED });
    const footer = "Valores estimados, sujeitos à conferência.  |  Página " + (index + 1) + " de " + pages.length;
    const w = regular.widthOfTextAtSize(footer, 6.2);
    p.drawText(footer, { x: A4.width - margin - w, y: 15, size: 6.2, font: regular, color: MUTED });
  });

  return pdf.save();
}

export async function downloadSimulationReportPdf(sim: Pick<SavedSimulationRecord, "name" | "input" | "result" | "created_at">) {
  const status = String(sim.result?.status || "");
  if (status !== "calculated" && status !== "alert") {
    throw new Error("O PDF executivo só pode ser gerado após a conclusão da simulação.");
  }
  const bytes = await buildSimulationReportPdf(sim);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName(String(sim.name || sim.input?.scenarioName || "simulacao-importacao")) + ".pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
