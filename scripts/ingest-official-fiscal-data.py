#!/usr/bin/env python3
"""Download-time ingestion parser for the official MDIC tariff and RFB TIPI workbooks.

The source workbooks are authoritative snapshots, but the generated JSON remains a
candidate catalog until the application's legal-precedence resolver consumes it.
This script deliberately preserves every unambiguous source row instead of
collapsing conflicting NCMs: the same NCM may legitimately appear in multiple
annexes/treatments and precedence must be resolved by the fiscal engine.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

NCM_RE = re.compile(r"^\d{8}$")


def text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def norm_key(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", text(value).lower())


def normalize_ncm(value: Any) -> str | None:
    raw = text(value).replace(".", "").replace("-", "").replace(" ", "")
    if raw.endswith(".0"):
        raw = raw[:-2]
    if raw.isdigit() and len(raw) == 7:
        raw = "0" + raw
    return raw if NCM_RE.fullmatch(raw) else None


def parse_rate(value: Any) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    raw = text(value).replace("%", "").replace(" ", "")
    if not raw:
        return None
    if raw.count(",") == 1:
        raw = raw.replace(".", "").replace(",", ".")
    try:
        rate = float(raw)
    except ValueError:
        return None
    return rate if 0 <= rate <= 100 else None


def find_col(headers: list[Any], names: set[str]) -> int | None:
    normalized = [norm_key(x) for x in headers]
    for name in names:
        if name in normalized:
            return normalized.index(name)
    return None


def find_header(rows: list[tuple[Any, ...]], ncm_names: set[str], rate_names: set[str]) -> tuple[int, list[Any], int, int] | None:
    for idx, row in enumerate(rows[:40]):
        headers = list(row)
        ncm_col = find_col(headers, ncm_names)
        rate_col = find_col(headers, rate_names)
        if ncm_col is not None and rate_col is not None:
            return idx, headers, ncm_col, rate_col
    return None


def extract(workbook_path: Path, source_type: str) -> tuple[list[dict[str, Any]], int]:
    wb = load_workbook(workbook_path, read_only=True, data_only=True)
    if source_type == "mdic":
        ncm_names = {"ncm", "codigo", "codigoncm", "codigoncmsh", "codigoncm2022"}
        rate_names = {"aliquota", "aliquotaii", "ii", "tarifa", "tec", "aliquotatec"}
    else:
        ncm_names = {"ncm", "codigo", "codigoncm", "codigoncmsh", "codigoncm2022"}
        rate_names = {"ipi", "aliquotaipi", "aliquotai", "aliquota"}

    records: list[dict[str, Any]] = []
    rejected = 0
    for sheet in wb.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        header = find_header(rows, ncm_names, rate_names)
        if header is None:
            continue
        header_idx, _, ncm_col, rate_col = header
        for row_number, row in enumerate(rows[header_idx + 1 :], start=header_idx + 2):
            if not any(v not in (None, "") for v in row):
                continue
            ncm = normalize_ncm(row[ncm_col] if ncm_col < len(row) else None)
            rate = parse_rate(row[rate_col] if rate_col < len(row) else None)
            if ncm is None or rate is None:
                rejected += 1
                continue
            records.append({
                "sourceType": source_type,
                "ncm": ncm,
                "rate": rate,
                "sheet": sheet.title,
                "row": row_number,
                "workbook": workbook_path.name,
            })
    return records, rejected


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mdic", required=True, type=Path)
    parser.add_argument("--tipi", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    mdic_records, mdic_rejected = extract(args.mdic, "mdic-ii")
    tipi_records, tipi_rejected = extract(args.tipi, "rfb-ipi")
    if not mdic_records:
        raise SystemExit("MDIC ingestion produced zero records; refusing publication.")
    if not tipi_records:
        raise SystemExit("TIPI ingestion produced zero records; refusing publication.")

    output = {
        "schemaVersion": 3,
        "publicationStatus": "candidate",
        "sources": {
            "mdic": {
                "file": args.mdic.name,
                "published": "2026-07-24",
                "url": "https://www.gov.br/mdic/pt-br/assuntos/camex/estrategia-comercial/arquivos-listas/24-07-2026-anexos-i-a-x-resolucao-gecex-272-21.xlsx/view",
                "recordCount": len(mdic_records),
                "rejectedRows": mdic_rejected,
            },
            "rfbTipi": {
                "file": args.tipi.name,
                "updated": "2026-02-13",
                "url": "https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/legislacao/documentos-e-arquivos/tipi.xlsx/view",
                "recordCount": len(tipi_records),
                "rejectedRows": tipi_rejected,
            },
        },
        "records": mdic_records + tipi_records,
        "notes": [
            "All source rows are preserved; duplicate NCMs are not collapsed.",
            "MDIC annex precedence is resolved by the fiscal engine, not by ingestion.",
            "This snapshot must not be treated as production-ready until resolver acceptance tests pass.",
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"MDIC records: {len(mdic_records)}; TIPI records: {len(tipi_records)}")


if __name__ == "__main__":
    main()
