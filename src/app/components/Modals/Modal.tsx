import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

let openModalCount = 0;
let bodyOverflowBeforeModal = "";
const modalStack: symbol[] = [];

function visibleFocusTargets(dialog: HTMLElement | null) {
  return Array.from(dialog?.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])") ?? [])
    .filter((element) => !element.hasAttribute("disabled") && element.tabIndex >= 0 && !element.closest('[aria-hidden="true"], [inert]') && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden");
}

function boundedOffset(value: number, origin: number, extent: number, viewportStart: number, viewportExtent: number, scale: number) {
  const minimum = (viewportStart - origin) / scale;
  const maximum = (viewportStart + viewportExtent - extent - origin) / scale;
  return Math.max(minimum, Math.min(value, Math.max(minimum, maximum)));
}

export default function Modal({
  open,
  closeModal,
  modalHeader,
  modalContent,
  modalFooter,
  transparentOnBlur = false,
  variant = "dialog",
  ariaLabel = "Dialog",
  closeOnBackdrop = true,
  closeOnEscape = true,
  dragThroughBackdrop = false,
  blurBackdrop = true,
  overlayClassName = "",
  showCloseButton = false,
}: {
  open: boolean,
  closeModal: () => void,
  modalHeader: JSX.Element,
  modalContent: JSX.Element,
  /** Persistent primary action area that never scrolls off a phone viewport. */
  modalFooter?: JSX.Element,
  transparentOnBlur?: boolean,
  variant?: "dialog" | "bottom-sheet" | "constrained-dialog",
  ariaLabel?: string,
  closeOnBackdrop?: boolean,
  closeOnEscape?: boolean,
  dragThroughBackdrop?: boolean,
  blurBackdrop?: boolean,
  overlayClassName?: string,
  showCloseButton?: boolean,
}) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    left: number;
    top: number;
    width: number;
    height: number;
    viewport: { left: number; top: number; width: number; height: number };
  } | null>(null);
  const isDraggable = isDesktop && variant === "dialog";
  const ref = useRef<HTMLDivElement>(null);
  const closeModalRef = useRef(closeModal);
  closeModalRef.current = closeModal;
  const requestClose = useCallback(() => closeModalRef.current(), []);

  useEffect(() => {
    // Only precision pointers drag headers; landscape phones still use sheets.
    const desktop = window.matchMedia("(min-width: 640px) and (hover: hover) and (pointer: fine)");
    const updateDesktop = () => {
      setIsDesktop(desktop.matches);
      if (!desktop.matches) {
        dragStart.current = null;
        setOffset({ x: 0, y: 0 });
      }
    };
    updateDesktop();
    desktop.addEventListener("change", updateDesktop);
    return () => desktop.removeEventListener("change", updateDesktop);
  }, []);

  useEffect(() => {
    dragStart.current = null;
    setOffset({ x: 0, y: 0 });
  }, [open, variant]);

  const handleHeaderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggable || event.button !== 0 || !event.isPrimary || !ref.current) return;
    if (event.target instanceof Element && event.target.closest("button, a, input, select, textarea, label, [role='button'], [contenteditable]:not([contenteditable='false']), [draggable='true']")) return;

    const dialog = ref.current;
    const rect = dialog.getBoundingClientRect();
    // Game dialogs live inside a scaled, clipped board. Its backdrop is the
    // drag boundary, not the entire browser window outside that board.
    const backdrop = dialog.parentElement!.getBoundingClientRect();
    const visible = window.visualViewport;
    const left = Math.max(backdrop.left, visible?.offsetLeft ?? 0);
    const top = Math.max(backdrop.top, visible?.offsetTop ?? 0);
    // /play scales its board; pointer distances must be converted to local units.
    dragStart.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: offset.x,
      y: offset.y,
      scaleX: rect.width / dialog.offsetWidth || 1,
      scaleY: rect.height / dialog.offsetHeight || 1,
      left: rect.left - offset.x * (rect.width / dialog.offsetWidth || 1),
      top: rect.top - offset.y * (rect.height / dialog.offsetHeight || 1),
      width: rect.width,
      height: rect.height,
      viewport: {
        left, top,
        width: Math.max(0, Math.min(backdrop.right, (visible?.offsetLeft ?? 0) + (visible?.width ?? innerWidth)) - left),
        height: Math.max(0, Math.min(backdrop.bottom, (visible?.offsetTop ?? 0) + (visible?.height ?? innerHeight)) - top),
      },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handleHeaderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    setOffset({
      x: boundedOffset(start.x + (event.clientX - start.clientX) / start.scaleX, start.left, start.width, start.viewport.left, start.viewport.width, start.scaleX),
      y: boundedOffset(start.y + (event.clientY - start.clientY) / start.scaleY, start.top, start.height, start.viewport.top, start.viewport.height, start.scaleY),
    });
  };

  useEffect(() => {
    if (!open || !isDraggable || !ref.current) return;
    const dialog = ref.current;
    const keepOnScreen = () => {
      dragStart.current = null;
      // Re-center after layout changes rather than carrying coordinates from a
      // different viewport (or a differently scaled game board).
      setOffset({ x: 0, y: 0 });
    };
    const observer = new ResizeObserver(keepOnScreen);
    observer.observe(dialog);
    window.addEventListener("resize", keepOnScreen);
    window.visualViewport?.addEventListener("resize", keepOnScreen);
    window.visualViewport?.addEventListener("scroll", keepOnScreen);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", keepOnScreen);
      window.visualViewport?.removeEventListener("resize", keepOnScreen);
      window.visualViewport?.removeEventListener("scroll", keepOnScreen);
    };
  }, [open, isDraggable]);

  const handleHeaderPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStart.current?.pointerId !== event.pointerId) return;
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const identity = Symbol("modal");
    modalStack.push(identity);
    if (openModalCount === 0) {
      bodyOverflowBeforeModal = document.body.style.overflow;
    }
    openModalCount += 1;
    document.body.style.overflow = "hidden";

    const focusModal = requestAnimationFrame(() => {
      if (modalStack.at(-1) === identity) (visibleFocusTargets(ref.current)[0] ?? ref.current)?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || modalStack.at(-1) !== identity) return;
      // External popup menus own their keys. Inline menus remain part of this
      // dialog; their unhandled Escape/Tab must retain its keyboard safeguards.
      if (e.target instanceof Element && !ref.current?.contains(e.target) && e.target.closest('[role="listbox"], [role="menu"]')) return;
      if (e.key === "Escape" && closeOnEscape) {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;

      const focusable = visibleFocusTargets(ref.current);
      if (focusable.length === 0) {
        e.preventDefault();
        ref.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      // Arrow-key menus focus items with tabindex=-1. Resume sequential focus
      // relative to that item instead of allowing Tab to escape the dialog.
      if (active && ref.current.contains(active) && !focusable.includes(active as HTMLElement)) {
        const next = e.shiftKey
          ? focusable.filter((element) => active.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING).at(-1)
          : focusable.find((element) => active.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
        e.preventDefault();
        (next ?? (e.shiftKey ? last : first)).focus();
        return;
      }
      if (e.shiftKey && (document.activeElement === first || !ref.current.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !ref.current.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusModal);
      const wasTopmost = modalStack.at(-1) === identity;
      modalStack.splice(modalStack.indexOf(identity), 1);
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        document.body.style.overflow = bodyOverflowBeforeModal;
      }
      document.removeEventListener("keydown", handleKeyDown);
      if (wasTopmost && previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [closeOnEscape, open, requestClose]);

  if (!open) return null;

  const dialog = (
      <div className={["fixed inset-0 z-50 flex items-end bg-[radial-gradient(circle_at_top,rgba(52,136,205,.22),transparent_42%),rgba(1,5,10,.78)] px-0 pt-[env(safe-area-inset-top)] sm:items-center sm:justify-center sm:p-4", blurBackdrop ? "backdrop-blur-sm" : "", overlayClassName].join(" ")} style={{ pointerEvents: dragThroughBackdrop ? "none" : undefined }} onPointerDown={(event) => { if (closeOnBackdrop && event.target === event.currentTarget) requestClose(); }}>
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            style={isDraggable ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
            className={["flex max-h-[calc(100dvh-env(safe-area-inset-top))] w-full flex-col overflow-hidden rounded-t-sm border border-sky-200/35 border-b-0 bg-[linear-gradient(145deg,rgba(15,31,48,.99),rgba(3,10,18,.99))] shadow-[0_-18px_45px_rgba(0,0,0,.5),0_0_28px_rgba(79,169,255,.16)] sm:max-h-[85dvh] sm:max-w-2xl sm:rounded-sm sm:border-b sm:shadow-[0_18px_45px_rgba(0,0,0,.55),0_0_28px_rgba(79,169,255,.16)]",
              "pointer-events-auto",
              transparentOnBlur ? "bg-white/25" : ""
            ].join(" ")}
          >
            <>
              <div
                className={["max-h-[50dvh] shrink-0 overflow-y-auto border-b border-sky-200/20 bg-[linear-gradient(90deg,rgba(79,169,255,.13),transparent_60%)] px-4 sm:px-6", showCloseButton ? "flex items-center gap-3" : "", isDraggable ? "cursor-grab active:cursor-grabbing" : ""].join(" ")}
                style={{ touchAction: isDraggable ? "none" : undefined }}
                onPointerDown={handleHeaderPointerDown}
                onPointerMove={handleHeaderPointerMove}
                onPointerUp={handleHeaderPointerEnd}
                onPointerCancel={handleHeaderPointerEnd}
                onLostPointerCapture={handleHeaderPointerEnd}
              >
                {showCloseButton ? <><div className="min-w-0 flex-1 break-words">{modalHeader}</div><button type="button" aria-label={`Close ${ariaLabel}`} onClick={requestClose} className="grid size-11 shrink-0 place-items-center text-slate-200 hover:bg-blue-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"><X size={20} /></button></> : modalHeader}
              </div>

              <div className={["flex-1 min-h-0 overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,rgba(8,21,33,.96),rgba(3,10,18,.98))]", transparentOnBlur ? "opacity-5 hover:opacity-100" : ""].join(" ")}>
                <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
                  {modalContent}
                </div>
              </div>
              {modalFooter && <div className="max-h-[40dvh] shrink-0 overflow-y-auto border-t border-sky-200/20 bg-slate-950/90 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:px-6">{modalFooter}</div>}
            </>
          </div>
      </div>
  );
  // Sheets must be viewport-relative, not trapped inside a blurred/scrolled
  // gallery panel. Game dialogs intentionally retain their local drag surface.
  return variant === "dialog" ? dialog : createPortal(dialog, document.body);
}
