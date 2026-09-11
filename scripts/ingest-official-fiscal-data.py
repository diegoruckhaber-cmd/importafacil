#!/usr/bin/env python3
"""Build a fail-closed federal fiscal snapshot from official MDIC and RFB XLSX files.

Unlike the legacy importer, this loader preserves the legal selectors that decide
whether a tariff row is applicable: annex, Ex, description, quota and validity.
It also keeps TIPI Ex rows and the NT treatment. No precedence decision is made
by row order; precedence belongs to the runtime resolver.
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from datetime import date, datetime
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

NCM_RE = re.compile(r"^\d{8}$")
PREFIX_RE = re.compile(r"^\d{4,8}$")


def text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def norm(value: Any) -> str:
    raw = unicodedata.normalize("NFKD", text(value))
    raw = "".join(ch for ch in raw if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", "", raw.lower())


def digits(value: Any) -> str:
    return re.sub(r"\D", "", text(value))


def normalize_ncm(value: Any) -> str | None:
    raw = digits(value)
    return raw if NCM_RE.fullmatch(raw) else None


def normalize_prefix(value: Any) -> str | None:
    raw = digits(value)
    return raw if PREFIX_RE.fullmatch(raw) and len(raw) < 8 else None


def parse_rate(value: Any) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        rate = float(value)
        return rate if 0 <= rate <= 100 else None
    raw = text(value).replace("%", "").replace(" ", "")
    if not raw or norm(raw) in {"nt", "naotributado"}:
        return None
    if raw.count(",") == 1:
        raw = raw.replace(".", "").replace(",", ".")
    try:
        rate = float(raw)
    except ValueError:
        return None
    return rate if 0 <= rate <= 100 else None


def parse_date(value: Any) -> str | None:
    if value in (None, "", "-"):
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    raw = text(value).split(" ")[0]
    for pattern in (r"^(\d{4})-(\d{2})-(\d{2})$", r"^(\d{2})/(\d{2})/(\d{4})$"):
        match = re.match(pattern, raw)
        if match:
            if pattern.startswith("^(\\d{4})"):
                return raw
            return f"{match.group(3)}-{match.group(2)}-{match.group(1)}"
    return None


def clean_optional(value: Any) -> str | None:
    raw = text(value)
    return None if raw in {"", "-", "–", "—"} else raw


def clean_ex(value: Any) -> str | None:
    raw = clean_optional(value)
    if raw is None:
        return None
    if isinstance(value, (int, float)) and float(value).is_integer():
        return str(int(value)).zfill(3)
    return raw.zfill(3) if raw.isdigit() and len(raw) < 3 else raw


def quota_value(value: Any) -> float | str | None:
    if value in (None, "", "-"):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return text(value)


def find_header(rows: list[tuple[Any, ...]]) -> tuple[int, list[Any]] | None:
    for index, row in enumerate(rows[:120]):
        keys = [norm(value) for value in row]
        if any(key == "ncm" or key.startswith("ncm") for key in keys):
            return index, list(row)
    return None


def col(header: list[Any], *names: str, contains: tuple[str, ...] = ()) -> int | None:
    keys = [norm(value) for value in header]
    wanted = {norm(name) for name in names}
    for index, key in enumerate(keys):
        if key in wanted:
            return index
    for index, key in enumerate(keys):
        if any(fragment in key for fragment in contains):
            return index
    return None


def value(row: tuple[Any, ...], index: int | None) -> Any:
    return row[index] if index is not None and index < len(row) else None


def mdic_kind(sheet: str) -> str:
    if sheet.startswith("Anexo I "):
        return "TEC"
    if sheet.startswith("Anexo II "):
        return "BRAZIL_APPLIED"
    if sheet.startswith("Anexo III "):
        return "AERONAUTICAL_SCOPE"
    if sheet.startswith("Anexo IV "):
        return "SUPPLY_SHORTAGE"
    if sheet.startswith("Anexo V "):
        return "LETEC"
    if sheet.startswith("Anexo VI "):
        return "LEBIT_BK"
    if sheet.startswith("Anexo VIII "):
        return "WTO_CONCESSION"
    if sheet.startswith("Anexo IX "):
        return "DCC"
    if sheet.startswith("Anexo X "):
        return "ACE14_AUTOMOTIVE"
    return "UNKNOWN"


def parse_mdic(path: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    workbook = load_workbook(path, read_only=True, data_only=True)
    records: list[dict[str, Any]] = []
    sheets_meta: list[dict[str, Any]] = []

    for sheet in workbook.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        kind = mdic_kind(sheet.title)
        header_info = find_header(rows)
        sheets_meta.append({"name": sheet.title, "kind": kind, "rows": len(rows), "columns": sheet.max_column})
        if header_info is None:
            raise SystemExit(f"MDIC sheet {sheet.title!r}: business header not found")
        header_index, header = header_info

        if kind == "AERONAUTICAL_SCOPE":
            prefixes: set[str] = set()
            for row in rows[header_index + 1 :]:
                for cell in row:
                    prefix = normalize_prefix(cell)
                    ncm = normalize_ncm(cell)
                    if prefix:
                        prefixes.add(prefix)
                    elif ncm:
                        prefixes.add(ncm)
            for prefix in sorted(prefixes):
                records.append({
                    "tax": "II", "kind": kind, "ncmPrefix": prefix,
                    "rate": None, "requiresInput": True,
                    "sheet": sheet.title,
                    "legalBasis": "Resolução Gecex nº 272/2021 — Anexo III",
                    "scopeCondition": "Regra setorial aeronáutica: confirmar que o produto e a operação atendem às condições próprias do Anexo III.",
                })
            continue

        ncm_idx = col(header, "NCM")
        desc_idx = col(header, "Descrição", contains=("descricao",))
        ex_idx = col(header, "Nº Ex", "Nº EX", "EX", contains=("nex",))

        # Quota exists only in the special-treatment annexes. Never discover it
        # by a loose substring in TEC/Anexo II because "alíquota" contains
        # the sequence "quota" after normalization and would corrupt metadata.
        if kind in {"TEC", "BRAZIL_APPLIED"}:
            quota_idx = None
            quota_unit_idx = None
        else:
            quota_idx = col(header, "Quota")
            quota_unit_idx = col(header, "Unidade da quota", "Unidade quota", "Unidade da Quota", contains=("unidadedaquota", "unidadequota"))

        start_idx = col(header, "Início de vigência", "Início da Vigência", contains=("iniciodevigencia", "iniciodavigencia"))
        end_idx = col(header, "Término de vigência", contains=("terminodevigencia",))
        legal_idx = col(header, "Ato de inclusão", "Ato de Inclusão", "Atos de inclusão", contains=("atodeinclusao", "atosdeinclusao"))
        obs_idx = col(header, "Observações", "Observação", contains=("observacao",))

        if kind == "TEC":
            rate_idx = col(header, "TEC (%)", contains=("tec",))
        elif kind == "BRAZIL_APPLIED":
            rate_idx = col(header, "Alíquota aplicada (%)", contains=("aliquotaaplicada",))
        else:
            rate_idx = col(header, "Alíquota (%)", contains=("aliquota",))

        tec_idx = col(header, "TEC (%)", contains=("tec",)) if kind == "BRAZIL_APPLIED" else None
        applied_found = 0
        for row_number, row in enumerate(rows[header_index + 1 :], start=header_index + 2):
            ncm = normalize_ncm(value(row, ncm_idx))
            if not ncm:
                continue
            rate = parse_rate(value(row, rate_idx))
            if rate is None:
                continue
            ex_code = clean_ex(value(row, ex_idx))
            quota = quota_value(value(row, quota_idx))
            record = {
                "tax": "II",
                "kind": kind,
                "ncm": ncm,
                "rate": rate,
                "description": clean_optional(value(row, desc_idx)),
                "exCode": ex_code,
                "quota": quota,
                "quotaUnit": clean_optional(value(row, quota_unit_idx)),
                "validFrom": parse_date(value(row, start_idx)),
                "validTo": parse_date(value(row, end_idx)),
                "legalBasis": clean_optional(value(row, legal_idx)),
                "observation": clean_optional(value(row, obs_idx)),
                "requiresInput": bool(ex_code or quota is not None),
                "sheet": sheet.title,
                "row": row_number,
            }
            if kind == "BRAZIL_APPLIED":
                record["tecRate"] = parse_rate(value(row, tec_idx))
                record["legalBasis"] = clean_optional(value(row, col(header, "Fundamentação da alíquota aplicada", contains=("fundamentacaodaaliquotaaplicada",)))) or record["legalBasis"]
            records.append(record)
            applied_found += 1
        if applied_found == 0 and kind != "UNKNOWN":
            raise SystemExit(f"MDIC sheet {sheet.title!r}: no usable tariff rows")

    return records, sheets_meta


def parse_tipi(path: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    workbook = load_workbook(path, read_only=True, data_only=True)
    records: list[dict[str, Any]] = []
    sheets_meta: list[dict[str, Any]] = []
    for sheet in workbook.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        header_info = find_header(rows)
        sheets_meta.append({"name": sheet.title, "rows": len(rows), "columns": sheet.max_column})
        if header_info is None:
            raise SystemExit(f"TIPI sheet {sheet.title!r}: business header not found")
        header_index, header = header_info
        ncm_idx = col(header, "NCM")
        ex_idx = col(header, "EX")
        desc_idx = col(header, "Descrição", contains=("descricao",))
        rate_idx = col(header, "Alíquota (%)", contains=("aliquota",))
        current_ncm: str | None = None
        for row_number, row in enumerate(rows[header_index + 1 :], start=header_index + 2):
            explicit_ncm = normalize_ncm(value(row, ncm_idx))
            if explicit_ncm:
                current_ncm = explicit_ncm
            ex_code = clean_ex(value(row, ex_idx))
            if not current_ncm:
                continue
            raw_rate = value(row, rate_idx)
            rate = parse_rate(raw_rate)
            treatment = "NT" if norm(raw_rate) in {"nt", "naotributado"} else "RATE"
            if treatment == "NT":
                rate = 0.0
            if rate is None:
                continue
            # A row without a full NCM is only a usable tax row when it is an Ex
            # belonging to the latest full NCM. Hierarchical headings are ignored.
            if not explicit_ncm and not ex_code:
                continue
            records.append({
                "tax": "IPI",
                "kind": "TIPI",
                "ncm": current_ncm,
                "rate": rate,
                "taxTreatment": treatment,
                "exCode": ex_code,
                "description": clean_optional(value(row, desc_idx)),
                "requiresInput": bool(ex_code),
                "sheet": sheet.title,
                "row": row_number,
                "legalBasis": "Decreto nº 11.158/2022 — TIPI, atualizada pelo ADE RFB nº 1/2026",
            })
    if not records:
        raise SystemExit("TIPI ingestion produced zero records")
    return records, sheets_meta


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mdic", required=True, type=Path)
    parser.add_argument("--tipi", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--mdic-published", default="2026-09-08")
    parser.add_argument("--tipi-updated", default="2026-02-13")
    args = parser.parse_args()

    mdic_records, mdic_sheets = parse_mdic(args.mdic)
    tipi_records, tipi_sheets = parse_tipi(args.tipi)
    records = sorted(mdic_records + tipi_records, key=lambda item: (item["tax"], item.get("ncm", item.get("ncmPrefix", "")), item["kind"], item.get("exCode") or "", item.get("validFrom") or ""))

    base_ii = [record for record in mdic_records if record["kind"] == "BRAZIL_APPLIED"]
    tec = [record for record in mdic_records if record["kind"] == "TEC"]
    special_ii = [record for record in mdic_records if record["kind"] not in {"TEC", "BRAZIL_APPLIED"}]
    output = {
        "schemaVersion": 4,
        "publicationStatus": "candidate",
        "snapshotDate": args.mdic_published,
        "sources": {
            "mdic": {
                "file": args.mdic.name,
                "published": args.mdic_published,
                "sourceUrl": "https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes",
                "recordCount": len(mdic_records),
                "baseAppliedCount": len(base_ii),
                "tecCount": len(tec),
                "specialTreatmentCount": len(special_ii),
                "sheets": mdic_sheets,
            },
            "rfbTipi": {
                "file": args.tipi.name,
                "updated": args.tipi_updated,
                "sourceUrl": "https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/legislacao/tipi-tabela-de-incidencia-do-imposto-sobre-produtos-industrializados",
                "recordCount": len(tipi_records),
                "sheets": tipi_sheets,
            },
        },
        "precedence": {
            "iiBase": ["BRAZIL_APPLIED", "TEC"],
            "iiTemporaryOverrides": ["SUPPLY_SHORTAGE", "LETEC", "LEBIT_BK", "WTO_CONCESSION", "DCC", "ACE14_AUTOMOTIVE"],
            "rule": "Active Annexes IV, V, VI, VIII, IX and X prevail over Annexes I and II while their temporary tariff treatment is in force. Conditions such as Ex and quota must be satisfied before automatic application.",
        },
        "records": records,
        "notes": [
            "No tariff is selected by workbook row order.",
            "The resolver must block automatic calculation when competing applicable treatments remain unresolved.",
            "Anexo III is stored as a scope warning and never converted into an automatic tariff benefit.",
            "TIPI NT is stored as zero computational rate plus explicit NT semantic treatment.",
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"MDIC records={len(mdic_records)} base_applied={len(base_ii)} tec={len(tec)} special={len(special_ii)}")
    print(f"TIPI records={len(tipi_records)}")
    print(f"Generated schemaVersion=4 records={len(records)} bytes={args.output.stat().st_size}")


if __name__ == "__main__":
    main()
