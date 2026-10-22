import React, {
  CSSProperties,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import AppIcon from "@/app/components/AppIcon";

type Option = { value: string; label: string };

type MultiSelectProps = {
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  menuPlacement?: "popover" | "viewport" | "inline";
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
  menuPlacement = "popover",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();

  useEffect(() => {
    if (!open || menuPlacement !== "viewport") return;

    const updateMenuPosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const viewportPadding = 12;
      const gap = 8;
      const preferredMenuHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const openAbove = spaceBelow < preferredMenuHeight && spaceAbove > 0;
      const availableHeight = Math.max(
        120,
        Math.min(preferredMenuHeight, openAbove ? spaceAbove : spaceBelow),
      );
      const width = Math.min(
        rect.width,
        window.innerWidth - viewportPadding * 2,
      );

      setMenuStyle({
        width,
        maxHeight: availableHeight,
        left: Math.max(
          viewportPadding,
          Math.min(rect.left, window.innerWidth - width - viewportPadding),
        ),
        top: openAbove
          ? Math.max(viewportPadding, rect.top - availableHeight - gap)
          : rect.bottom + gap,
      });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [menuPlacement, open]);

  useEffect(() => {
    if (open && menuPlacement === "inline") {
      buttonRef.current?.scrollIntoView({ block: "start" });
    }
  }, [menuPlacement, open]);

  // Close on outside click / Escape
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
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc, true);
    };
  }, [open]);

  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);
  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(", ")
        : `${selectedLabels.length} selected`;

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const allSelected = value.length === options.length && options.length > 0;

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => {
              const choices =
                menuRef.current?.querySelectorAll<HTMLElement>("[role=option]");
              choices?.[
                event.key === "ArrowUp" ? choices.length - 1 : 0
              ]?.focus();
            });
          }
        }}
        onClick={() => setOpen((o) => !o)}
        className={`
          w-auto max-w-full inline-flex min-h-11 min-w-11 items-center justify-between gap-2 rounded-md border border-input
          bg-secondary px-3 py-2 text-sm text-secondary-foreground shadow-sm
          hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
        `}
      >
        <span>{summary}</span>
        <AppIcon
          name="chevron-down"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={menuPlacement === "viewport" ? menuStyle : undefined}
          className={
            menuPlacement === "viewport"
              ? "fixed z-[60] flex flex-col overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
              : menuPlacement === "inline"
                ? "relative z-50 mt-2 flex w-full flex-col overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
                : "absolute z-50 mt-2 overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
          }
        >
          <div className="flex items-center justify-between border-b border-border px-2 py-1">
            <button
              type="button"
              className="min-h-11 min-w-11 w-full cursor-pointer rounded-sm px-2 py-1 text-xs hover:bg-accent"
              onClick={() => (allSelected ? clearAll() : selectAll())}
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
            {value.length > 0 && (
              <button
                type="button"
                className="min-h-11 min-w-11 cursor-pointer rounded-sm px-2 py-1 text-xs hover:bg-accent"
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
            aria-label={placeholder}
            onKeyDown={(event) => {
              const choices = Array.from(
                event.currentTarget.querySelectorAll<HTMLElement>(
                  "[role=option]",
                ),
              );
              const index = choices.indexOf(
                document.activeElement as HTMLElement,
              );
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? choices.length - 1
                    : event.key === "ArrowDown"
                      ? (index + 1) % choices.length
                      : event.key === "ArrowUp"
                        ? (index - 1 + choices.length) % choices.length
                        : -1;
              if (next >= 0) {
                event.preventDefault();
                choices[next]?.focus();
              }
            }}
            className={
              menuPlacement === "viewport" || menuPlacement === "inline"
                ? "max-h-56 min-h-0 flex-1 overflow-auto py-1"
                : "max-h-56 overflow-auto py-1"
            }
          >
            {options.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      toggle(opt.value);
                    }
                  }}
                  className={`min-h-11 min-w-11 flex items-center cursor-pointer select-none px-4 py-2 text-sm hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
                    isSelected
                      ? "bg-primary/20 text-primary"
                      : "text-popover-foreground"
                  }`}
                  onClick={() => toggle(opt.value)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 border rounded flex items-center justify-center ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      }`}
                    >
                      {isSelected && (
                        <AppIcon
                          name="check"
                          className="text-white"
                          size={12}
                        />
                      )}
                    </div>
                    {opt.label}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
