"use client";

import { useMemo, useState } from "react";

type Props = {
  value: string;
  hint?: string;
  onChange: (value: string) => void;
};

const COUNTRY_CODES = [
  "AF","ZA","AL","DE","AD","AO","AG","SA","DZ","AR","AM","AU","AT","AZ","BS","BD","BB","BH","BE","BZ","BJ","BY",
  "BO","BA","BW","BR","BN","BG","BF","BI","BT","CV","CM","KH","CA","QA","KZ","TD","CL","CN","CY","CO","KM","CG",
  "CD","KP","KR","CI","CR","HR","CU","DK","DJ","DM","EG","SV","AE","EC","ER","SK","SI","ES","US","EE","SZ","ET",
  "FJ","PH","FI","FR","GA","GM","GH","GE","GD","GR","GT","GY","GN","GQ","GW","HT","HN","HU","YE","MH","SB","IN",
  "ID","IR","IQ","IE","IS","IL","IT","JM","JP","JO","KI","KW","LA","LS","LV","LB","LR","LY","LI","LT","LU","MK",
  "MG","MY","MW","MV","ML","MT","MA","MU","MR","MX","MM","FM","MZ","MD","MC","MN","ME","NA","NR","NP","NI","NE",
  "NG","NO","NZ","OM","NL","PK","PW","PA","PG","PY","PE","PL","PT","KE","KG","GB","CF","CZ","DO","RO","RW","RU",
  "WS","SM","LC","KN","ST","VC","SC","SN","SL","RS","SG","SY","SO","LK","SD","SS","SE","CH","SR","TJ","TZ","TH",
  "TL","TG","TO","TT","TN","TM","TR","TV","UA","UG","UY","UZ","VU","VA","VE","VN","ZM","ZW"
] as const;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const displayNames =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined"
    ? new Intl.DisplayNames(["pt-BR"], { type: "region" })
    : null;

const COUNTRIES = COUNTRY_CODES
  .map((code) => displayNames?.of(code) || code)
  .filter((name): name is string => Boolean(name))
  .sort((a, b) => a.localeCompare(b, "pt-BR"));

export default function CountryAutocomplete({ value, hint, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const options = useMemo(() => {
    const query = normalize(value);
    if (!query) return COUNTRIES.slice(0, 12);
    return COUNTRIES
      .filter((country) => normalize(country).includes(query))
      .sort((a, b) => {
        const aStarts = normalize(a).startsWith(query) ? 0 : 1;
        const bStarts = normalize(b).startsWith(query) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b, "pt-BR");
      })
      .slice(0, 12);
  }, [value]);

  function select(country: string) {
    onChange(country);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !options.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current <= 0 ? options.length - 1 : current - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      select(options[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <label className="countryAutocomplete">
      País de origem
      <input
        value={value}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="country-options"
        aria-activedescendant={active >= 0 ? "country-option-" + active : undefined}
        placeholder="Ex.: China"
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      {hint && <small className="fieldHint">{hint}</small>}
      {open && options.length > 0 && (
        <div id="country-options" className="countryOptions" role="listbox">
          {options.map((country, index) => (
            <button
              id={"country-option-" + index}
              key={country}
              type="button"
              role="option"
              aria-selected={index === active}
              className={index === active ? "countryOption active" : "countryOption"}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => select(country)}
            >
              {country}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}
