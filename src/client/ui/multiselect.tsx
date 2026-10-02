import React, { CSSProperties, useEffect, useId, useRef, useState } from "react"
import AppIcon from "@/app/components/AppIcon"

type Option = { value: string; label: string }

type MultiSelectProps = {
  options: Option[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  menuPlacement?: "popover" | "viewport" | "inline"
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
  menuPlacement = "popover",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()
  const [menuStyle, setMenuStyle] = useState<CSSProperties>()

  useEffect(() => {
    if (!open || menuPlacement !== "viewport") return

    const updateMenuPosition = () => {
      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const viewportPadding = 12
      const gap = 8
      const preferredMenuHeight = 280
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
      const spaceAbove = rect.top - viewportPadding
      const openAbove = spaceBelow < preferredMenuHeight && spaceAbove > 0
      const availableHeight = Math.max(120, Math.min(preferredMenuHeight, openAbove ? spaceAbove : spaceBelow))
      const width = Math.min(rect.width, window.innerWidth - viewportPadding * 2)

      setMenuStyle({
        width,
        maxHeight: availableHeight,
        left: Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - width - viewportPadding)),
        top: openAbove ? Math.max(viewportPadding, rect.top - availableHeight - gap) : rect.bottom + gap,
      })
    }

    updateMenuPosition()
    window.addEventListener("resize", updateMenuPosition)
    window.addEventListener("scroll", updateMenuPosition, true)
    return () => {
      window.removeEventListener("resize", updateMenuPosition)
      window.removeEventListener("scroll", updateMenuPosition, true)
    }
  }, [menuPlacement, open])

  useEffect(() => {
    if (open && menuPlacement === "inline") {
      buttonRef.current?.scrollIntoView({ block: "start" })
    }
  }, [menuPlacement, open])

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
        <AppIcon name="chevron-down" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={menuPlacement === "viewport" ? menuStyle : undefined}
          className={menuPlacement === "viewport"
            ? "fixed z-[60] flex flex-col overflow-hidden rounded-xl border bg-gray-400 shadow-lg ring-1 ring-black/5"
            : menuPlacement === "inline"
            ? "relative z-50 mt-2 flex w-full flex-col overflow-hidden rounded-xl border bg-gray-400 shadow-lg ring-1 ring-black/5"
            : "absolute z-50 mt-2 rounded-xl border bg-gray-400 shadow-lg ring-1 ring-black/5 overflow-auto"}
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
            className={menuPlacement === "viewport" || menuPlacement === "inline" ? "max-h-56 min-h-0 flex-1 overflow-auto py-1" : "max-h-56 overflow-auto py-1"}
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
                      {isSelected && <AppIcon name="check" className="text-white" size={12} />}
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
