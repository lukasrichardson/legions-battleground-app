import React, { useEffect, useId, useMemo, useRef, useState } from "react";

type Option = { value: string; label: string };

type MultiSelectProps = {
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const selectedLabels = useMemo(
    () => options.filter(o => value.includes(o.value)).map(o => o.label),
    [options, value]
  );

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter(x => x !== v));
    else onChange([...value, v]);
  };

  const allSelected = value.length === options.length && options.length > 0;

  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(", ")
        : `${selectedLabels.length} selected`;

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen(o => !o)}
        className={`
          w-full inline-flex items-center justify-between gap-2 rounded-xl border
          bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-black/5
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <span className={selectedLabels.length ? "text-gray-900" : "text-gray-400"}>
          {summary}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute z-50 mt-2 w-72 rounded-xl border bg-white p-2 shadow-lg ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between px-2 pb-2">
            <button
              type="button"
              className="text-xs rounded-md px-2 py-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => onChange(allSelected ? [] : options.map(o => o.value))}
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
            <button
              type="button"
              className="text-xs rounded-md px-2 py-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
            >
              Reset
            </button>
          </div>

          <div
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            className="max-h-56 overflow-auto pr-1"
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No options</div>
            ) : (
              options.map(opt => {
                const checked = value.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`
                      flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm
                      hover:bg-gray-50
                    `}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={checked}
                      onChange={() => toggle(opt.value)}
                    />
                    <span className="text-gray-900">{opt.label}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}