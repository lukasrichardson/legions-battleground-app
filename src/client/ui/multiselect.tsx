"use client";

import React, {
  CSSProperties,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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

  useLayoutEffect(() => {
    if (!open || menuPlacement === "inline") return;

    const updateMenuPosition = () => {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;

      const rect = button.getBoundingClientRect();
      const viewportPadding = 12;
      const gap = 8;
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
      if (rect.bottom <= viewportTop || rect.top >= viewportBottom || rect.right <= viewportLeft || rect.left >= viewportLeft + viewportWidth) {
        setOpen(false);
        return;
      }
      const header = menu.firstElementChild as HTMLElement | null;
      const list = menu.lastElementChild as HTMLElement | null;
      // Measure the actual content, not a guessed menu height. Short option
      // lists must stay next to the trigger even when they open upwards.
      const preferredMenuHeight = Math.min(280, (header?.offsetHeight ?? 0) + Math.min(224, list?.scrollHeight ?? 0) + 2);
      const spaceBelow = Math.max(0, viewportBottom - rect.bottom - viewportPadding - gap);
      const spaceAbove = Math.max(0, rect.top - viewportTop - viewportPadding - gap);
      const openAbove = spaceBelow < preferredMenuHeight && spaceAbove > spaceBelow;
      const availableHeight = Math.min(preferredMenuHeight, openAbove ? spaceAbove : spaceBelow);
      const width = Math.min(Math.max(rect.width, 200), viewportWidth - viewportPadding * 2);

      setMenuStyle({
        width,
        maxHeight: availableHeight,
        left: Math.max(
          viewportLeft + viewportPadding,
          Math.min(rect.left, viewportLeft + viewportWidth - width - viewportPadding),
        ),
        top: openAbove
          ? rect.top - availableHeight - gap
          : rect.bottom + gap,
      });
    };

    updateMenuPosition();
    // The trigger can move without a scroll or resize when surrounding content
    // reflows. ResizeObserver reports size changes, not position changes.
    let lastRect = buttonRef.current?.getBoundingClientRect();
    let frame = 0;
    const trackTriggerPosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect && lastRect && (rect.x !== lastRect.x || rect.y !== lastRect.y || rect.width !== lastRect.width || rect.height !== lastRect.height)) {
        updateMenuPosition();
      }
      lastRect = rect;
      frame = requestAnimationFrame(trackTriggerPosition);
    };
    frame = requestAnimationFrame(trackTriggerPosition);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    window.visualViewport?.addEventListener("resize", updateMenuPosition);
    window.visualViewport?.addEventListener("scroll", updateMenuPosition);
    const observer = new ResizeObserver(updateMenuPosition);
    if (buttonRef.current) observer.observe(buttonRef.current);
    if (menuRef.current) observer.observe(menuRef.current);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.visualViewport?.removeEventListener("resize", updateMenuPosition);
      window.visualViewport?.removeEventListener("scroll", updateMenuPosition);
      observer.disconnect();
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
    const onDocClick = (e: PointerEvent) => {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Tab" && menuPlacement !== "inline") {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDocClick);
    document.addEventListener("keydown", onEsc, true);
    return () => {
      document.removeEventListener("pointerdown", onDocClick);
      document.removeEventListener("keydown", onEsc, true);
    };
  }, [menuPlacement, open]);

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

  const allSelected = options.length > 0 && options.every((option) => value.includes(option.value));

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
        <span className="min-w-0 truncate">{summary}</span>
        <AppIcon
          name="chevron-down"
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && renderMenu()}
    </div>
  );

  function renderMenu() {
    // In a keyboard-shortened viewport, let the whole menu scroll. A sticky
    // action row must not consume the space needed to see a complete option.
    const scrollWholeMenu = menuPlacement !== "inline" && Number(menuStyle?.maxHeight) < 120;
    const menu = (
        <div
          ref={menuRef}
          style={menuPlacement !== "inline" ? { ...menuStyle, visibility: menuStyle ? "visible" : "hidden" } : undefined}
          className={
            menuPlacement !== "inline"
              ? `fixed z-[60] flex flex-col rounded-md border border-border bg-popover text-popover-foreground shadow-lg ${scrollWholeMenu ? "overflow-y-auto overscroll-contain" : "overflow-hidden"}`
              : "relative z-50 mt-2 flex w-full flex-col overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
          }
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-2 py-1">
            <button
              type="button"
              className="min-h-11 min-w-11 w-full cursor-pointer rounded-sm px-2 py-1 text-xs hover:bg-accent"
              onClick={() => (allSelected ? clearAll() : selectAll())}
              disabled={options.length === 0}
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
            className={scrollWholeMenu ? "shrink-0 py-1" : "max-h-56 min-h-0 flex-1 overflow-auto overscroll-contain py-1"}
          >
            {options.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No options available</li>}
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
                  <div className="flex min-w-0 items-center gap-2 [overflow-wrap:anywhere]">
                    <div
                      className={`w-4 h-4 shrink-0 border rounded flex items-center justify-center ${
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
    );
    // Keep a dialog's options inside its focus boundary. These filter sheets
    // are not transformed, so fixed coordinates still use the viewport.
    const portalTarget = buttonRef.current?.closest('[role="dialog"]') ?? document.body;
    return menuPlacement === "inline" ? menu : createPortal(menu, portalTarget);
  }
}
