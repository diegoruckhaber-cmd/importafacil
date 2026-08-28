#!/usr/bin/env python3
import json
import re
import time
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

INDEX_URL = "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor"
OUTPUT = "data/defesa-comercial-mdic.json"
BASE_HOST = "www.gov.br"
HEADERS = {"User-Agent": "ImportaFacil/1.0 (official MDIC catalog synchronizer)"}

UNIT_PATTERNS = [
    ("USD_PER_THOUSAND_UNITS", re.compile(r"(?:US\$|USD)\s*([\d.,]+)\s*/\s*(?:mil\s*unidades|milheiro|milheiros)", re.I)),
    ("USD_PER_KG", re.compile(r"(?:US\$|USD)\s*([\d.,]+)\s*/\s*kg", re.I)),
    ("USD_PER_TON", re.compile(r"(?:US\$|USD)\s*([\d.,]+)\s*/\s*(?:t|ton|tonelada|toneladas)", re.I)),
    ("USD_PER_PAIR", re.compile(r"(?:US\$|USD)\s*([\d.,]+)\s*/\s*par", re.I)),
    ("USD_PER_UNIT", re.compile(r"(?:US\$|USD)\s*([\d.,]+)\s*/\s*(?:unidade|unidades|un)", re.I)),
    ("USD_PER_SQUARE_METER", re.compile(r"(?:US\$|USD)\s*([\d.,]+)\s*/\s*m(?:²|2|etros?\s*quadrados?)", re.I)),
    ("AD_VALOREM", re.compile(r"([\d.,]+)\s*%")),
]

SUFFIX_UNIT_PATTERNS = [
    ("USD_PER_THOUSAND_UNITS", re.compile(r"([\d.,]+)\s*(?:US\$|USD)\s*/\s*(?:mil\s*unidades|milheiro|milheiros)", re.I)),
    ("USD_PER_KG", re.compile(r"([\d.,]+)\s*(?:US\$|USD)\s*/\s*kg", re.I)),
    ("USD_PER_TON", re.compile(r"([\d.,]+)\s*(?:US\$|USD)\s*/\s*(?:t|ton|tonelada|toneladas)", re.I)),
    ("USD_PER_PAIR", re.compile(r"([\d.,]+)\s*(?:US\$|USD)\s*/\s*par", re.I)),
    ("USD_PER_UNIT", re.compile(r"([\d.,]+)\s*(?:US\$|USD)\s*/\s*(?:unidade|unidades|un)", re.I)),
    ("USD_PER_SQUARE_METER", re.compile(r"([\d.,]+)\s*(?:US\$|USD)\s*/\s*m(?:²|2|etros?\s*quadrados?)", re.I)),
]

HEADER_UNIT_PATTERNS = [
    ("USD_PER_THOUSAND_UNITS", re.compile(r"(?:US\$|USD)\s*/\s*(?:mil\s*unidades|milheiro|milheiros)", re.I)),
    ("USD_PER_KG", re.compile(r"(?:US\$|USD)\s*/\s*kg", re.I)),
    ("USD_PER_TON", re.compile(r"(?:US\$|USD)\s*/\s*(?:t|ton|tonelada|toneladas)", re.I)),
    ("USD_PER_PAIR", re.compile(r"(?:US\$|USD)\s*/\s*par", re.I)),
    ("USD_PER_UNIT", re.compile(r"(?:US\$|USD)\s*/\s*(?:unidade|unidades|un)", re.I)),
    ("USD_PER_SQUARE_METER", re.compile(r"(?:US\$|USD)\s*/\s*m(?:²|2|etros?\s*quadrados?)", re.I)),
    ("AD_VALOREM", re.compile(r"ad\s*valorem|%", re.I)),
]


def number(value):
    value = value.strip().replace(".", "").replace(",", ".")
    try:
        return float(value)
    except ValueError:
        return None


def clean_text(text):
    return re.sub(r"\s+", " ", text).strip()


def normalize_origin(value):
    value = clean_text(value)
    value = re.sub(r"\([^)]*\)", "", value)
    value = re.sub(r"[\*,:;]+$", "", value).strip().lower()
    replacements = {
        "coreia": "Coreia do Sul", "coreia do sul": "Coreia do Sul", "coréia do sul": "Coreia do Sul",
        "japao": "Japão", "japão": "Japão",
        "tailândia": "Tailândia", "tailandia": "Tailândia", "reino da tailândia": "Tailândia", "do reino da tailândia": "Tailândia",
        "taipé chinês": "Taipé Chinês", "taipe chines": "Taipé Chinês",
        "eua": "Estados Unidos da América", "estados unidos": "Estados Unidos da América", "estados unidos da américa": "Estados Unidos da América", "united states": "Estados Unidos da América",
        "união europeia": "União Europeia", "uniao europeia": "União Europeia",
        "holanda": "Países Baixos", "países baixos": "Países Baixos",
        "república popular da china": "China", "republica popular da china": "China", "da china": "China", "china": "China",
        "da malásia": "Malásia", "malásia": "Malásia", "malasia": "Malásia",
        "da ucrânia": "Ucrânia", "ucrânia": "Ucrânia", "ucrania": "Ucrânia",
    }
    return replacements.get(value, value.title())


def split_origins(value):
    value = re.sub(r"\([^)]*\)", "", value)
    parts = re.split(r",|;|\s+e\s+", value)
    return [normalize_origin(x) for x in parts if x.strip()]


def parse_ncm_patterns(raw):
    patterns = []
    exclusions = []
    for match in re.finditer(r"\d{4}(?:\.\d{2})?(?:\.\d{2})?", raw):
        patterns.append(re.sub(r"\D", "", match.group(0)))
    exception = re.search(r"exceto\s*:\s*(.+)$", raw, re.I)
    if exception:
        exclusions = [re.sub(r"\D", "", x) for x in re.findall(r"\d{4}(?:\.\d{2})?(?:\.\d{2})?", exception.group(1))]
    return list(dict.fromkeys(patterns)), exclusions


def detect_header_unit(text):
    for unit, pattern in HEADER_UNIT_PATTERNS:
        if pattern.search(text):
            return unit
    return None


def detect_rate(cells, header_unit=None):
    line = " | ".join(cells)
    for unit, pattern in UNIT_PATTERNS + SUFFIX_UNIT_PATTERNS:
        match = pattern.search(line)
        if match:
            return unit, number(match.group(1))
    if header_unit:
        for cell in reversed(cells):
            if re.search(r"prazo|vig[eê]ncia|data", cell, re.I):
                continue
            match = re.search(r"(?<![\d.,])([\d]{1,3}(?:\.\d{3})*(?:,\d+)?|[\d]+(?:,\d+)?)\s*%?\s*$", cell)
            if match:
                rate = number(match.group(1))
                if rate is not None:
                    return header_unit, rate
    return None


def add_option(options, origin, exporter, rate, unit, suspended=False):
    if not origin or rate is None:
        return
    exporter = clean_text(exporter) or "Todos os produtores/exportadores"
    exporter = re.sub(r"\s*\|\s*$", "", exporter).strip()
    if not exporter:
        exporter = "Todos os produtores/exportadores"
    key = origin.lower()
    options.setdefault(key, []).append({"exporter": exporter, "rate": rate, "unit": unit, "collectionSuspended": bool(suspended)})


def parse_options(soup, text, origins):
    options = {origin.lower(): [] for origin in origins}
    current_origin = origins[0] if len(origins) == 1 else None

    # 1) Prefer real HTML tables. This covers the most structured MDIC pages.
    for table in soup.find_all("table"):
        rows = []
        for tr in table.find_all("tr"):
            cells = [clean_text(c.get_text(" ", strip=True)) for c in tr.find_all(["th", "td"])]
            if cells:
                rows.append(cells)
        if len(rows) < 2:
            continue
        header = " | ".join(rows[0]).lower()
        if "direito" not in header or not any(k in header for k in ("produtor", "exportador", "origem")):
            continue
        header_unit = detect_header_unit(header)
        for cells in rows[1:]:
            row_text = " | ".join(cells)
            if re.search(r"prazo\s+da\s+vig[eê]ncia|prazo\s+de\s+vig[eê]ncia", row_text, re.I):
                continue
            detected = detect_rate(cells, header_unit)
            if not detected or detected[1] is None:
                continue
            unit, rate = detected
            if len(cells) >= 3:
                origin = normalize_origin(cells[0])
                if origin.lower() not in options:
                    origin = current_origin
                else:
                    current_origin = origin
                exporter = cells[1]
            else:
                origin = current_origin
                exporter = cells[0]
            add_option(options, origin, exporter, rate, unit, "suspens" in row_text.lower())

    # 2) Parse the rendered "Direito Aplicado" section. MDIC has pages where the
    # data is rendered as plain text rather than an HTML table.
    lines = [clean_text(x) for x in text.splitlines() if clean_text(x)]
    start = next((i for i, line in enumerate(lines) if re.match(r"^Direito\s+Aplicado\s*:?$", line, re.I)), None)
    if start is not None:
        section_lines = []
        for line in lines[start + 1:]:
            if re.match(r"^Prazo\s+(?:da|de)\s+Vig[eê]ncia\s*:", line, re.I) or re.match(r"^Compartilhe", line, re.I):
                break
            section_lines.append(line)
        section_text = " | ".join(section_lines[:4])
        section_unit = detect_header_unit(section_text)
        for line in section_lines:
            if re.search(r"^(Fonte|Prazo|Resumo do Caso|Processos relacionados)\b", line, re.I):
                continue
            cells = [clean_text(x) for x in re.split(r"\s*\|\s*", line) if clean_text(x)]
            detected = detect_rate(cells or [line], section_unit)
            if not detected or detected[1] is None:
                origin_heading = next((candidate for candidate in origins if normalize_origin(line) == candidate), None)
                if origin_heading:
                    current_origin = origin_heading
                continue
            unit, rate = detected
            origin = current_origin
            if len(cells) >= 3:
                candidate = normalize_origin(cells[0])
                if candidate.lower() in options:
                    origin = candidate
                    current_origin = candidate
                exporter = cells[-2]
            elif len(cells) == 2:
                candidate = normalize_origin(cells[0])
                if candidate.lower() in options:
                    origin = candidate
                    current_origin = candidate
                exporter = cells[0]
            else:
                exporter = re.sub(r"(?:US\$|USD)\s*[\d.,]+\s*/\s*\S+|[\d.,]+\s*%|[\d]{1,3}(?:\.\d{3})*(?:,\d+)?\s*$", "", line, flags=re.I).strip(" -–—:|")
            if origin:
                add_option(options, origin, exporter, rate, unit, "suspens" in line.lower())

    # 3) Remove duplicate rows but preserve distinct exporter/rate/unit combinations.
    for key, values in list(options.items()):
        seen, deduped = set(), []
        for item in values:
            signature = (item["exporter"].casefold(), item["rate"], item["unit"])
            if signature not in seen:
                seen.add(signature)
                deduped.append(item)
        options[key] = deduped
    return options


def parse_page(url, html):
    soup = BeautifulSoup(html, "html.parser")
    h1 = soup.find("h1")
    title = clean_text(h1.get_text(" ", strip=True)) if h1 else ""
    text = soup.get_text("\n", strip=True)
    type_match = re.search(r"Tipo de [Mm]edida:\s*([^\n]+)", text)
    if not type_match or "antidumping" not in type_match.group(1).lower():
        return None
    ncm_match = re.search(r"NCM:\s*([^\n]+)", text, re.I)
    if not ncm_match:
        return None
    ncm_patterns, exclusions = parse_ncm_patterns(ncm_match.group(1))
    if not ncm_patterns:
        return None
    origin_match = re.search(r"Pa[ií]s(?:es)? de [Oo]rigem:\s*([^\n]+)", text, re.I)
    if not origin_match:
        return None
    origins = split_origins(origin_match.group(1))
    validity_match = re.search(r"Prazo (?:de|da) [Vv]ig[eê]ncia:?\s*([0-9]{2}/[0-9]{2}/[0-9]{4})", text)
    validity = validity_match.group(1) if validity_match else None
    if re.search(r"prazo\s+(?:da|de)\s+vig[eê]ncia\s*:\s*encerrada|\(medida encerrada\)", text, re.I):
        return None
    suspended = "cobrança suspensa" in text.lower() or "medida suspensa" in text.lower()
    options = parse_options(soup, text, origins)
    legal = []
    for line in text.splitlines():
        if re.search(r"RESOLU[ÇC][AÃ]O\s+(?:GECEX|CAMEX)|CIRCULAR\s+SECEX", line, re.I):
            legal.append(clean_text(line))
        if len(legal) >= 8:
            break
    return {
        "ncm": ncm_patterns[0], "ncmPatterns": ncm_patterns, "ncmExclusions": exclusions,
        "product": title, "origins": origins, "measure": "antidumping", "measureTypeText": clean_text(type_match.group(1)),
        "legalFoundation": "; ".join(legal), "source": "MDIC/SECEX — Medidas de defesa comercial em vigor", "sourceUrl": url,
        "validityNote": clean_text(" ".join(x for x in [f"Prazo de vigência: {validity}" if validity else "", "Cobrança suspensa." if suspended else ""] if x)),
        "validUntil": validity, "collectionSuspended": suspended,
        "exportersByOrigin": {origin.lower(): options.get(origin.lower(), []) for origin in origins},
        "syncedAt": datetime.now(timezone.utc).isoformat(),
    }


def main():
    session = requests.Session()
    session.headers.update(HEADERS)
    index = session.get(INDEX_URL, timeout=60)
    index.raise_for_status()
    soup = BeautifulSoup(index.text, "html.parser")
    urls = []
    for anchor in soup.find_all("a", href=True):
        url = urljoin(INDEX_URL, anchor["href"])
        parsed = urlparse(url)
        if parsed.netloc != BASE_HOST or "/medidas-em-vigor/medidas-em-vigor/" not in parsed.path or url.rstrip("/") == INDEX_URL.rstrip("/"):
            continue
        if url not in urls:
            urls.append(url)
    measures, failures = [], []
    for url in urls:
        try:
            response = session.get(url, timeout=60)
            response.raise_for_status()
            item = parse_page(url, response.text)
            if item:
                measures.append(item)
        except Exception as exc:
            failures.append({"url": url, "error": str(exc)})
        time.sleep(0.12)
    if len(measures) < 40:
        raise RuntimeError(f"Crawl incompleto: {len(measures)} medidas extraídas de {len(urls)} páginas.")
    measures.sort(key=lambda x: (x["ncm"], x["product"], x["sourceUrl"]))
    with open(OUTPUT, "w", encoding="utf-8") as fh:
        json.dump(measures, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    missing_options = [
        {"ncm": item["ncm"], "product": item["product"], "origins": [o for o, opts in item["exportersByOrigin"].items() if not opts], "sourceUrl": item["sourceUrl"]}
        for item in measures if any(not opts for opts in item["exportersByOrigin"].values())
    ]
    print(json.dumps({"indexPages": len(urls), "antidumpingMeasures": len(measures), "missingExporterOptions": missing_options[:50], "missingExporterOptionCount": len(missing_options), "failures": failures[:20]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
