import fs from "node:fs";
import path from "node:path";

const INDEX_URL = "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor";
const OUTPUT = path.join(process.cwd(), "data", "defesa-comercial-mdic.json");
const HEADERS = { "User-Agent": "ImportaFacil/1.0 (official MDIC catalog synchronizer)" };

const UNIT_PATTERNS = [
  ["USD_PER_THOUSAND_UNITS", /(?:US\$|USD)\s*([\d.,]+)\s*\/\s*(?:mil\s*unidades|milheiro|milheiros)/i],
  ["USD_PER_KG", /(?:US\$|USD)\s*([\d.,]+)\s*\/\s*kg/i],
  ["USD_PER_TON", /(?:US\$|USD)\s*([\d.,]+)\s*\/\s*(?:t|ton|tonelada|toneladas)/i],
  ["USD_PER_PAIR", /(?:US\$|USD)\s*([\d.,]+)\s*\/\s*par/i],
  ["USD_PER_UNIT", /(?:US\$|USD)\s*([\d.,]+)\s*\/\s*(?:unidade|unidades|un)/i],
  ["AD_VALOREM", /([\d.,]+)\s*%/],
];

function clean(value) {
  return value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#39;/gi, "'").replace(/&quot;/gi, '"').replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim();
}
function number(value) { return Number(value.replace(/\./g, "").replace(",", ".")); }
function origin(value) {
  const x = clean(value).toLowerCase();
  const map = { "coréia do sul": "Coreia do Sul", "coreia do sul": "Coreia do Sul", "tailândia": "Tailândia", "taipé chinês": "Taipé Chinês", "eua": "Estados Unidos da América", "estados unidos": "Estados Unidos da América", "estados unidos da américa": "Estados Unidos da América", "holanda": "Países Baixos", "países baixos": "Países Baixos" };
  return map[x] ?? clean(value);
}
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr|td|th|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "")
    .split("\n")
    .map(clean)
    .filter(Boolean)
    .join("\n");
}
function linksFromIndex(html) {
  const urls = new Set();
  for (const match of html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)) {
    const href = match[1].replace(/&amp;/g, "&");
    if (href.includes("/medidas-em-vigor/medidas-em-vigor/") && href.startsWith("https://www.gov.br/")) urls.add(href.split("#")[0]);
  }
  return [...urls].filter((url) => url !== INDEX_URL && !url.endsWith("/medidas-em-vigor"));
}
function parseNcm(raw) {
  const patterns = [...raw.matchAll(/\d{4}(?:\.\d{2})?(?:\.\d{2})?/g)].map((m) => m[0].replace(/\D/g, ""));
  for (const m of raw.matchAll(/(\d{4})\s+a\s+(\d{4})/gi)) {
    for (let n = Number(m[1]); n <= Number(m[2]); n++) patterns.push(String(n));
  }
  const exception = raw.match(/exceto\s*:\s*(.+)$/i);
  const exclusions = exception ? [...exception[1].matchAll(/\d{4}(?:\.\d{2})?(?:\.\d{2})?/g)].map((m) => m[0].replace(/\D/g, "")) : [];
  return { patterns: [...new Set(patterns)], exclusions };
}
function parsePage(url, html) {
  const text = stripHtml(html);
  const type = text.match(/Tipo de [Mm]edida:\s*([^\n]+)/)?.[1] ?? "";
  if (!/antidumping/i.test(type)) return null;
  const ncmRaw = text.match(/NCM:\s*([^\n]+)/i)?.[1];
  const originsRaw = text.match(/Pa[ií]s(?:es)? de [Oo]rigem:\s*([^\n]+)/i)?.[1];
  if (!ncmRaw || !originsRaw) return null;
  const ncm = parseNcm(ncmRaw);
  if (!ncm.patterns.length) return null;
  const origins = originsRaw.split(/,|;|\s+e\s+/).map(origin).filter(Boolean);
  const validity = text.match(/Prazo (?:de|da) [Vv]ig[eê]ncia:?\s*(\d{2}\/\d{2}\/\d{4})/)?.[1] ?? null;
  const suspended = /cobrança suspensa|medida suspensa/i.test(text);
  const section = text.match(/Direito\s+(?:Aplicado|aplicado)\s*:?([\s\S]+?)(?=Prazo\s+(?:de\s+)?vig[eê]ncia|Processos relacionados|Resumo do Caso|Compartilhe|$)/i)?.[1] ?? "";
  const options = Object.fromEntries(origins.map((x) => [x.toLowerCase(), []]));
  let currentOrigin = origins.length === 1 ? origins[0] : null;
  for (const lineRaw of section.split("\n")) {
    const line = clean(lineRaw);
    if (!line) continue;
    for (const candidate of origins) if (new RegExp(`\\b${candidate.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i").test(line)) currentOrigin = candidate;
    let detected = null;
    for (const [unit, pattern] of UNIT_PATTERNS) {
      const match = line.match(pattern);
      if (match) { detected = { unit, rate: number(match[1]) }; break; }
    }
    if (!detected || !currentOrigin) continue;
    let exporter = line.replace(/(?:US\$|USD)\s*[\d.,]+\s*\/\s*\S+/i, "").replace(/[\d.,]+\s*%/, "").replace(/^[-–—•:\s]+|[-–—•:\s]+$/g, "").trim();
    if (!exporter || /^(Direito|Origem|Produtor\/Exportador)/i.test(exporter)) continue;
    options[currentOrigin.toLowerCase()] ??= [];
    options[currentOrigin.toLowerCase()].push({ exporter, rate: detected.rate, unit: detected.unit, collectionSuspended: /suspens/i.test(line) });
  }
  for (const key of Object.keys(options)) {
    const seen = new Set(); options[key] = options[key].filter((x) => { const sig = `${x.exporter}|${x.rate}|${x.unit}`; if (seen.has(sig)) return false; seen.add(sig); return true; });
  }
  const title = text.match(/(?:^|\n)([^\n]+)\n(?:Compartilhe|Info|Informações)/)?.[1] ?? "";
  const legal = text.split("\n").filter((line) => /RESOLU[ÇC][AÃ]O\s+(?:GECEX|CAMEX)|CIRCULAR\s+SECEX/i.test(line)).slice(0, 8).join("; ");
  return {
    ncm: ncm.patterns[0], ncmPatterns: ncm.patterns, ncmExclusions: ncm.exclusions,
    product: clean(title), origins, measure: "antidumping", measureTypeText: clean(type),
    legalFoundation: legal, source: "MDIC/SECEX — Medidas de defesa comercial em vigor", sourceUrl: url,
    validityNote: [validity ? `Prazo de vigência: ${validity}` : "", suspended ? "Cobrança suspensa." : ""].filter(Boolean).join(" "),
    validUntil: validity, collectionSuspended: suspended, exportersByOrigin: options, syncedAt: new Date().toISOString(),
  };
}

const response = await fetch(INDEX_URL, { headers: HEADERS });
if (!response.ok) throw new Error(`MDIC index HTTP ${response.status}`);
const indexHtml = await response.text();
const urls = linksFromIndex(indexHtml);
const measures = [];
const failures = [];
for (const url of urls) {
  try {
    const page = await fetch(url, { headers: HEADERS });
    if (!page.ok) throw new Error(`HTTP ${page.status}`);
    const parsed = parsePage(url, await page.text());
    if (parsed) measures.push(parsed);
  } catch (error) {
    failures.push({ url, error: String(error) });
  }
}
if (measures.length < 40) throw new Error(`Crawl MDIC incompleto: ${measures.length} medidas extraídas de ${urls.length} páginas.`);
measures.sort((a, b) => `${a.ncm}|${a.product}|${a.sourceUrl}`.localeCompare(`${b.ncm}|${b.product}|${b.sourceUrl}`));
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(measures, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ indexPages: urls.length, antidumpingMeasures: measures.length, failures: failures.slice(0, 20) }, null, 2));
