import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { SavedSimulationRecord } from "./simulation-record";

const A4 = { width: 595.28, height: 841.89 };
const NAVY = rgb(0.058, 0.09, 0.165);
const BLUE = rgb(0.145, 0.388, 0.922);
const TEXT = rgb(0.059, 0.09, 0.165);
const MUTED = rgb(0.392, 0.455, 0.545);
const BORDER = rgb(0.886, 0.91, 0.941);
const SOFT = rgb(0.973, 0.98, 0.992);
const GREEN = rgb(0.086, 0.639, 0.29);
const AMBER = rgb(0.96, 0.62, 0.04);

const br = (value: unknown) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (value: unknown) => Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";

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
    commercial_resale: "Revenda/comercialização",
    industrialization: "Industrialização",
    use_consumption: "Uso e consumo",
  };
  return labels[String(value)] || "Não informada";
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

export async function buildSimulationReportPdf(sim: Pick<SavedSimulationRecord, "name" | "input" | "result" | "created_at">) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const summary = sim.result?.summary || {};
  const items = Array.isArray(sim.result?.items) ? sim.result.items : [];
  const attention = Array.isArray(sim.result?.attentionPoints) ? sim.result.attentionPoints : [];
  const margin = 42;
  const contentWidth = A4.width - margin * 2;
  let page: PDFPage;
  let y = 0;
  let pageNo = 0;

  const addPage = () => {
    page = pdf.addPage([A4.width, A4.height]);
    pageNo += 1;
    page.drawRectangle({ x: 0, y: A4.height - 64, width: A4.width, height: 64, color: NAVY });
    page.drawText("ImportaFácil", { x: margin, y: A4.height - 39, size: 19, font: bold, color: rgb(1, 1, 1) });
    page.drawText("RELATÓRIO EXECUTIVO DE IMPORTAÇÃO", { x: margin + 128, y: A4.height - 37, size: 8.5, font: bold, color: rgb(0.75, 0.82, 0.95) });
    y = A4.height - 92;
  };

  const ensure = (height: number) => {
    if (y - height < 54) addPage();
  };

  const drawText = (text: string, x: number, size = 10, color = TEXT, font: PDFFont = regular, maxWidth?: number, lineHeight?: number) => {
    const lines = maxWidth ? wrapText(text, font, size, maxWidth) : [text];
    const lh = lineHeight || size * 1.35;
    for (const line of lines) {
      ensure(lh);
      page.drawText(line, { x, y, size, font, color });
      y -= lh;
    }
    return lines.length * lh;
  };

  const heading = (eyebrow: string, title: string) => {
    ensure(48);
    page.drawText(eyebrow.toUpperCase(), { x: margin, y, size: 7.5, font: bold, color: BLUE });
    y -= 15;
    page.drawText(title, { x: margin, y, size: 16, font: bold, color: TEXT });
    y -= 26;
  };

  const metric = (x: number, topY: number, width: number, label: string, value: string, accent = false) => {
    page.drawRectangle({ x, y: topY - 58, width, height: 58, color: accent ? rgb(0.94, 0.99, 0.95) : rgb(1, 1, 1), borderColor: accent ? rgb(0.73, 0.93, 0.78) : BORDER, borderWidth: 1 });
    page.drawText(label, { x: x + 11, y: topY - 18, size: 7.5, font: bold, color: MUTED });
    page.drawText(value, { x: x + 11, y: topY - 41, size: 13, font: bold, color: accent ? GREEN : TEXT });
  };

  addPage();
  const title = String(sim.name || sim.input?.scenarioName || "Simulação de importação");
  drawText("PRÉ-ESTUDO DE IMPORTAÇÃO", margin, 8, BLUE, bold);
  drawText(title, margin, 22, TEXT, bold, contentWidth, 27);
  const created = new Date(sim.created_at || Date.now()).toLocaleString("pt-BR");
  drawText("Gerado em " + created + " · Resultado oficial salvo pelo ImportaFácil", margin, 8.5, MUTED, regular, contentWidth);
  y -= 9;

  const operationBits = [
    "Destino: " + String(sim.result?.operation?.destinationUf || sim.input?.destinationUf || "-"),
    "Regime: " + labelRegime(sim.result?.operation?.companyTaxRegime || sim.input?.companyTaxRegime),
    "Câmbio: " + Number(sim.result?.operation?.exchange || sim.input?.exchange || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
    "Itens: " + String(items.length),
  ];
  drawText(operationBits.join("  |  "), margin, 8.5, MUTED, regular, contentWidth);
  y -= 16;

  heading("Resumo financeiro", "Visão executiva");
  const gap = 9;
  const cardW = (contentWidth - gap) / 2;
  const top1 = y;
  metric(margin, top1, cardW, "Desembolso bruto estimado", br(summary.grossDisbursementBrl ?? summary.landedCostBrl));
  metric(margin + cardW + gap, top1, cardW, "Custo econômico líquido", summary.economicNetCostBrl == null ? "A validar" : br(summary.economicNetCostBrl), summary.economicNetCostBrl != null);
  y -= 68;
  const top2 = y;
  metric(margin, top2, cardW, "Créditos tributários estimados", summary.recoverableTaxCreditsBrl == null ? "A validar" : br(summary.recoverableTaxCreditsBrl));
  metric(margin + cardW + gap, top2, cardW, "Receita alvo", br(summary.targetRevenueBrl));
  y -= 78;

  heading("Composição", "Decomposição do desembolso");
  const rows: Array<[string, unknown, string, unknown]> = [
    ["Mercadorias", summary.merchandiseBrl, "Frete internacional", summary.freightBrl],
    ["Seguro internacional", summary.insuranceBrl, "II", summary.iiBrl],
    ["IPI", summary.ipiBrl, "PIS-Importação", summary.pisImportBrl],
    ["Cofins-Importação", summary.cofinsImportBrl, "ICMS-Importação", summary.icmsImportBrl],
    ["AFRMM", summary.afrmmBrl, "Taxa Siscomex", summary.siscomexBrl],
    ["Armazenagem", summary.storageBrl, "Outras despesas", summary.otherExpensesBrl],
    ["Defesa comercial", summary.defenseCommercialBrl, "Crédito ICMS estimado", summary.icmsCreditBrl],
    ["Crédito IPI estimado", summary.ipiCreditBrl, "Crédito PIS/Cofins estimado", Number(summary.pisImportCreditBrl || 0) + Number(summary.cofinsImportCreditBrl || 0)],
  ];
  for (const row of rows) {
    ensure(27);
    page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: margin + contentWidth, y: y + 5 }, thickness: 0.6, color: BORDER });
    page.drawText(row[0], { x: margin, y: y - 10, size: 8.2, font: regular, color: MUTED });
    page.drawText(br(row[1]), { x: margin + 180, y: y - 10, size: 8.5, font: bold, color: TEXT });
    page.drawText(row[2], { x: margin + 275, y: y - 10, size: 8.2, font: regular, color: MUTED });
    page.drawText(br(row[3]), { x: margin + 438, y: y - 10, size: 8.5, font: bold, color: TEXT });
    y -= 25;
  }
  y -= 12;

  heading("Itens", "Mercadorias simuladas");
  const cols = [margin, margin + 180, margin + 245, margin + 315, margin + 395, margin + 465];
  const headers = ["Item", "NCM", "Aplicação", "II", "IPI", "Custo/un."];
  ensure(28);
  page.drawRectangle({ x: margin, y: y - 18, width: contentWidth, height: 24, color: SOFT });
  headers.forEach((h, i) => page.drawText(h, { x: cols[i], y: y - 9, size: 7.2, font: bold, color: MUTED }));
  y -= 30;
  for (const item of items) {
    ensure(32);
    const app = item.creditAnalysis?.application || sim.input?.items?.find((x: any) => x.itemId === item.itemId)?.destination;
    page.drawText(String(item.name || item.itemId || "-").slice(0, 26), { x: cols[0], y, size: 8, font: bold, color: TEXT });
    page.drawText(String(item.ncm || "-"), { x: cols[1], y, size: 8, font: regular, color: TEXT });
    page.drawText(labelApplication(app).slice(0, 18), { x: cols[2], y, size: 7.2, font: regular, color: TEXT });
    page.drawText(pct(item.federal?.ii?.rate), { x: cols[3], y, size: 8, font: regular, color: TEXT });
    page.drawText(pct(item.federal?.ipi?.rate), { x: cols[4], y, size: 8, font: regular, color: TEXT });
    page.drawText(br(item.commercial?.breakEvenPricePerUnitBrl), { x: cols[5], y, size: 8, font: bold, color: TEXT });
    y -= 15;
    if (item.creditAnalysis?.totalRecoverableCredits != null) {
      page.drawText("Créditos recuperáveis estimados: " + br(item.creditAnalysis.totalRecoverableCredits), { x: cols[0], y, size: 7, font: regular, color: GREEN });
      y -= 13;
    }
    page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: margin + contentWidth, y: y + 5 }, thickness: 0.5, color: BORDER });
    y -= 6;
  }

  if (attention.length) {
    y -= 8;
    heading("Validações", "Pontos de atenção");
    attention.forEach((point: string, index: number) => {
      const lines = wrapText(String(point).replace(/https?:\/\/\S+/g, "").trim(), regular, 8, contentWidth - 34);
      const h = Math.max(34, lines.length * 11 + 16);
      ensure(h + 7);
      page.drawRectangle({ x: margin, y: y - h + 8, width: contentWidth, height: h, color: rgb(1, 0.985, 0.92), borderColor: rgb(0.96, 0.82, 0.43), borderWidth: 0.8 });
      page.drawCircle({ x: margin + 14, y: y - 7, size: 7, color: rgb(0.98, 0.88, 0.55) });
      page.drawText(String(index + 1), { x: margin + 11.5, y: y - 9.5, size: 6.5, font: bold, color: TEXT });
      let ty = y - 8;
      for (const line of lines) {
        page.drawText(line, { x: margin + 29, y: ty, size: 8, font: regular, color: TEXT });
        ty -= 11;
      }
      y -= h + 7;
    });
  }

  y -= 5;
  heading("Observações", "Premissas e limitações");
  const notes = [
    "Este documento é um pré-estudo e reproduz os dados e resultados da simulação. Não substitui classificação fiscal, despacho aduaneiro, consulta formal ou validação do tratamento tributário específico da operação.",
    "O desembolso bruto representa o caixa estimado da importação. O custo econômico líquido considera apenas créditos tributários que o motor conseguiu estimar a partir do regime tributário, aplicação da mercadoria e condições informadas.",
    "Em 2026, CBS e IBS na Duimp possuem tratamento transitório/informativo e não foram somados ao desembolso antes de 01/01/2027.",
  ];
  notes.forEach((note) => { drawText("• " + note, margin, 8, MUTED, regular, contentWidth, 11); y -= 4; });

  const pages = pdf.getPages();
  pages.forEach((p, index) => {
    p.drawLine({ start: { x: margin, y: 38 }, end: { x: A4.width - margin, y: 38 }, thickness: 0.6, color: BORDER });
    p.drawText("ImportaFácil · relatório gerado automaticamente", { x: margin, y: 23, size: 7, font: regular, color: MUTED });
    const pageText = "Página " + (index + 1) + " de " + pages.length;
    const width = regular.widthOfTextAtSize(pageText, 7);
    p.drawText(pageText, { x: A4.width - margin - width, y: 23, size: 7, font: regular, color: MUTED });
  });

  return pdf.save();
}

export async function downloadSimulationReportPdf(sim: Pick<SavedSimulationRecord, "name" | "input" | "result" | "created_at">) {
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
