import React, { useEffect, useId, useRef, useState } from "react"

type Option = { value: string; label: string }

type MultiSelectProps = {
  options: Option[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onEsc)
    }
  }, [open])

  const selectedLabels = options.filter(o => value.includes(o.value)).map(o => o.label)
  const summary = selectedLabels.length === 0 
    ? placeholder 
    : selectedLabels.length <= 2 
      ? selectedLabels.join(", ") 
      : `${selectedLabels.length} selected`

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const clearAll = () => {
    onChange([])
  }

  const selectAll = () => {
    onChange(options.map(o => o.value))
  }

  const allSelected = value.length === options.length && options.length > 0

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
          w-auto inline-flex items-center justify-between gap-2 rounded-xl border
          bg-gray-400 text-black p-1 text-sm shadow-sm ring-1 ring-black/5
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
        `}
      >
        <span className={"text-black"}>
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
          className="fixed z-50 mt-2 rounded-xl border bg-gray-400 shadow-lg ring-1 ring-black/5 overflow-auto"
        >
          <div className="flex items-center justify-between px-2 py-1 border-b">
            <button
              type="button"
              className="text-xs rounded-md px-2 py-1 hover:bg-gray-500 cursor-pointer text-black w-full"
              onClick={() => allSelected ? clearAll() : selectAll()}
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
            {value.length > 0 && (
              <button
                type="button"
                className="text-xs rounded-md px-2 py-1 hover:bg-gray-100 cursor-pointer text-black"
                onClick={clearAll}
              >
                Clear
              </button>
            )}
          </div>
          <ul
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            className="max-h-56 overflow-auto py-1"
          >
            {options.map(opt => {
              const isSelected = value.includes(opt.value)
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`cursor-pointer select-none px-4 py-2 text-sm hover:bg-gray-100 ${
                    isSelected ? "bg-indigo-50 text-indigo-600" : "text-gray-900"
                  }`}
                  onClick={() => toggle(opt.value)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                      isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {opt.label}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
