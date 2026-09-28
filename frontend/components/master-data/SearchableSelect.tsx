"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FieldWrap, controlClassName } from "./FormControls";

export type SearchableOption = {
  value: string;
  label: string;
  hint?: string;
};

type SearchableSelectProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  value: string;
  options: SearchableOption[];
  onChange: (value: string) => void;
};

export function SearchableSelect({
  id,
  label,
  required,
  error,
  disabled,
  placeholder = "Search and select",
  value,
  options,
  onChange,
}: SearchableSelectProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return options;
    }
    return options.filter((option) =>
      `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(term),
    );
  }, [options, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function selectOption(option: SearchableOption) {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
  }

  return (
    <FieldWrap id={id} label={label} required={required} error={error}>
      <div ref={rootRef} className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          disabled={disabled}
          placeholder={placeholder}
          value={open ? query : (selected?.label ?? "")}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
            if (value) {
              onChange("");
            }
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) =>
                Math.min(index + 1, Math.max(filtered.length - 1, 0)),
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open) {
              event.preventDefault();
              const option = filtered[activeIndex];
              if (option) {
                selectOption(option);
              }
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          className={[
            controlClassName,
            error ? "border-utilization-critical" : "border-border",
          ].join(" ")}
        />
        {open && !disabled ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-[0_12px_30px_rgba(88,70,180,0.12)]"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">No matches</li>
            ) : (
              filtered.map((option, index) => (
                <li key={option.value} role="option" aria-selected={option.value === value}>
                  <button
                    type="button"
                    className={[
                      "flex w-full flex-col items-start px-3 py-2 text-left text-sm",
                      index === activeIndex ? "bg-accent-soft text-accent" : "text-foreground",
                    ].join(" ")}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOption(option)}
                  >
                    <span>{option.label}</span>
                    {option.hint ? (
                      <span className="text-xs text-muted">{option.hint}</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </FieldWrap>
  );
}
