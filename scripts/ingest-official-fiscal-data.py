#!/usr/bin/env python3
"""Ingest official MDIC tariff and RFB TIPI workbooks into a candidate snapshot."""
from __future__ import annotations
import argparse, json, re
from pathlib import Path
from typing import Any
from openpyxl import load_workbook

NCM_RE = re.compile(r"^\d{8}$")

def text(v: Any) -> str: return "" if v is None else str(v).strip()
def norm_key(v: Any) -> str: return re.sub(r"[^a-z0-9]+", "", text(v).lower())

def normalize_ncm(v: Any) -> str | None:
    raw = text(v).replace(".", "").replace("-", "").replace(" ", "")
    if raw.endswith(".0"): raw = raw[:-2]
    if raw.isdigit() and len(raw) == 7: raw = "0" + raw
    return raw if NCM_RE.fullmatch(raw) else None

def parse_rate(v: Any) -> float | None:
    if v is None or v == "": return None
    if isinstance(v, (int, float)):
        rate = float(v); return rate if 0 <= rate <= 100 else None
    raw = text(v).replace("%", "").replace(" ", "")
    if not raw: return None
    if raw.count(",") == 1: raw = raw.replace(".", "").replace(",", ".")
    try: rate = float(raw)
    except ValueError: return None
    return rate if 0 <= rate <= 100 else None

def find_col(headers: list[Any], exact: set[str], contains: tuple[str, ...]) -> int | None:
    keys = [norm_key(x) for x in headers]
    for candidate in exact:
        if candidate in keys: return keys.index(candidate)
    for i, k in enumerate(keys):
        if any(part in k for part in contains): return i
    return None

def find_header(rows: list[tuple[Any, ...]], rate_exact: set[str], rate_contains: tuple[str, ...]):
    for idx, row in enumerate(rows[:60]):
        headers = list(row)
        ncm_col = find_col(headers, {"ncm", "codigo", "codigoncm", "codigoncmsh", "codigoncm2022"}, ("ncm", "codigo"))
        rate_col = find_col(headers, rate_exact, rate_contains)
        if ncm_col is not None and rate_col is not None and ncm_col != rate_col:
            return idx, ncm_col, rate_col
    return None

def extract(path: Path, source_type: str):
    wb = load_workbook(path, read_only=True, data_only=True)
    if source_type == "mdic":
        exact, contains = {"aliquota", "aliquotaii", "ii", "tarifa", "tec", "aliquotatec"}, ("aliquota", "tarifa", "tec")
    else:
        exact, contains = {"ipi", "aliquotaipi", "aliquotai", "aliquota"}, ("ipi", "aliquota")
    records, rejected, sheets = [], 0, []
    for sheet in wb.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        sheets.append({"name": sheet.title, "rows": len(rows), "cols": max((len(r) for r in rows), default=0)})
        header = find_header(rows, exact, contains)
        if header is None: continue
        hidx, ncm_col, rate_col = header
        for row_number, row in enumerate(rows[hidx + 1:], start=hidx + 2):
            if not any(v not in (None, "") for v in row): continue
            ncm = normalize_ncm(row[ncm_col] if ncm_col < len(row) else None)
            rate = parse_rate(row[rate_col] if rate_col < len(row) else None)
            if ncm is None or rate is None:
                rejected += 1; continue
            records.append({"sourceType": source_type, "ncm": ncm, "rate": rate, "sheet": sheet.title, "row": row_number, "workbook": path.name})
    return records, rejected, sheets

def main():
    p = argparse.ArgumentParser(); p.add_argument("--mdic", required=True, type=Path); p.add_argument("--tipi", required=True, type=Path); p.add_argument("--output", required=True, type=Path); a = p.parse_args()
    mdic, mdic_rej, mdic_sheets = extract(a.mdic, "mdic-ii")
    tipi, tipi_rej, tipi_sheets = extract(a.tipi, "rfb-ipi")
    print(f"MDIC sheets={len(mdic_sheets)} records={len(mdic)} rejected={mdic_rej}")
    print(f"TIPI sheets={len(tipi_sheets)} records={len(tipi)} rejected={tipi_rej}")
    if not mdic: raise SystemExit("MDIC ingestion produced zero records; refusing publication.")
    if not tipi: raise SystemExit("TIPI ingestion produced zero records; refusing publication.")
    out = {"schemaVersion": 3, "publicationStatus": "candidate", "sources": {"mdic": {"file": a.mdic.name, "published": "2026-07-24", "recordCount": len(mdic), "rejectedRows": mdic_rej, "sheets": mdic_sheets}, "rfbTipi": {"file": a.tipi.name, "updated": "2026-02-13", "recordCount": len(tipi), "rejectedRows": tipi_rej, "sheets": tipi_sheets}}, "records": mdic + tipi, "notes": ["All unambiguous source rows are preserved; duplicate NCMs are intentional across tariff treatments.", "MDIC annex precedence is resolved by the fiscal engine.", "Snapshot remains candidate until acceptance tests pass."]}
    a.output.parent.mkdir(parents=True, exist_ok=True); a.output.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {len(out['records'])} total records")
if __name__ == "__main__": main()
