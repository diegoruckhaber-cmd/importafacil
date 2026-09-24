"use client";

import { useEffect, useRef, useState } from "react";

type NcmOption = {
  code: string;
  description: string;
};

type Props = {
  value: string;
  hint?: string;
  onChange: (value: string) => void;
};

function digits(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export default function NcmAutocomplete({ value, hint, onChange }: Props) {
  const [items, setItems] = useState<NcmOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    const query = digits(value);
    if (query.length < 2 || query.length === 8) {
      setItems([]);
      setOpen(false);
      setActive(-1);
      return;
    }

    const controller = new AbortController();
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/ncm-search?q=" + encodeURIComponent(query), {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Falha ao buscar NCMs.");
        const next = Array.isArray(data.items) ? data.items : [];
        setItems(next);
        setOpen(next.length > 0);
        setActive(next.length ? 0 : -1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setItems([]);
        setOpen(false);
        setActive(-1);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value]);

  function select(option: NcmOption) {
    onChange(digits(option.code));
    setItems([]);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !items.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current <= 0 ? items.length - 1 : current - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      select(items[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <label style={{ position: "relative" }}>
      NCM (8 dígitos)
      <input
        value={value}
        inputMode="numeric"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="ncm-options"
        aria-activedescendant={active >= 0 ? "ncm-option-" + active : undefined}
        placeholder="Digite ao menos 2 números"
        onChange={(event) => onChange(digits(event.target.value))}
        onFocus={() => items.length && setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {hint && <small className="fieldHint">{hint}</small>}
      {loading && (
        <small style={{ display: "block", marginTop: 5, color: "#667085" }}>
          Buscando NCMs...
        </small>
      )}
      {open && items.length > 0 && (
        <div
          id="ncm-options"
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 40,
            top: 72,
            left: 0,
            right: 0,
            maxHeight: 320,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: 12,
            boxShadow: "0 14px 34px rgba(16,24,40,.14)",
          }}
        >
          {items.map((option, index) => (
            <button
              id={"ncm-option-" + index}
              type="button"
              role="option"
              aria-selected={index === active}
              key={option.code}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(option)}
              onMouseEnter={() => setActive(index)}
              style={{
                width: "100%",
                border: 0,
                borderBottom: index === items.length - 1 ? 0 : "1px solid #eef0f3",
                background: index === active ? "#eef4ff" : "#fff",
                padding: "11px 12px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <strong style={{ display: "block", color: "#1d2939", fontSize: 13 }}>
                {option.code}
              </strong>
              <span style={{ display: "block", marginTop: 3, color: "#667085", fontSize: 12, lineHeight: 1.35 }}>
                {option.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </label>
  );
}
