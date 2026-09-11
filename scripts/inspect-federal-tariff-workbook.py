#!/usr/bin/env python3
"""Inspect an official federal tariff workbook without mutating application data."""
from __future__ import annotations
import json, re, sys, unicodedata
from pathlib import Path
from openpyxl import load_workbook

def norm(value) -> str:
    raw = unicodedata.normalize("NFKD", "" if value is None else str(value))
    raw = "".join(ch for ch in raw if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", "", raw.lower())

def detect_header(rows):
    for index, row in enumerate(rows[:120]):
        keys = [norm(value) for value in row]
        if any(key in {"ncm", "codigo", "codigoncm", "ncmsh"} or key.startswith("ncm") for key in keys):
            return index
    return None

def find_index(header, fragments):
    if not header: return None
    keys=[norm(v) for v in header]
    for i,key in enumerate(keys):
        if any(fragment in key for fragment in fragments): return i
    return None

def main() -> None:
    if len(sys.argv) != 2: raise SystemExit("Usage: python scripts/inspect-federal-tariff-workbook.py <xlsx>")
    path=Path(sys.argv[1]); wb=load_workbook(path, read_only=True, data_only=True)
    report={"file":str(path),"sheets":[]}
    for sheet in wb.worksheets:
        rows=list(sheet.iter_rows(values_only=True)); hidx=detect_header(rows)
        header=list(rows[hidx]) if hidx is not None else None
        data_sample=[]; conditioned_sample=[]
        ex_idx=find_index(header,("nex","ex")); quota_idx=find_index(header,("quota",))
        if hidx is not None:
            for row in rows[hidx+1:]:
                if not any(v not in (None,"") for v in row): continue
                if len(data_sample)<3: data_sample.append(list(row))
                ex=row[ex_idx] if ex_idx is not None and ex_idx<len(row) else None
                quota=row[quota_idx] if quota_idx is not None and quota_idx<len(row) else None
                if len(conditioned_sample)<5 and ((ex not in (None,"","-")) or (quota not in (None,"","-"))): conditioned_sample.append(list(row))
        report["sheets"].append({"name":sheet.title,"max_columns":sheet.max_column,"non_empty_rows":sum(1 for r in rows if any(v not in (None,"") for v in r)),"header_row_number":hidx+1 if hidx is not None else None,"header":header,"data_sample":data_sample,"conditioned_sample":conditioned_sample})
    print(json.dumps(report,ensure_ascii=False,indent=2,default=str))
if __name__=="__main__": main()
