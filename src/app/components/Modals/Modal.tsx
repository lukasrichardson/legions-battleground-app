import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

let openModalCount = 0;
let bodyOverflowBeforeModal = "";

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
  } | null>(null);
  const isDraggable = isDesktop && variant === "dialog";
  const ref = useRef<HTMLDivElement>(null);
  const closeModalRef = useRef(closeModal);
  closeModalRef.current = closeModal;
  const requestClose = useCallback(() => closeModalRef.current(), []);

  useEffect(() => {
    // Match the sm breakpoint used by the dialog's centered desktop layout.
    const desktop = window.matchMedia("(min-width: 640px)");
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
    // /play scales its board; pointer distances must be converted to local units.
    dragStart.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: offset.x,
      y: offset.y,
      scaleX: rect.width / dialog.offsetWidth || 1,
      scaleY: rect.height / dialog.offsetHeight || 1,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handleHeaderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    setOffset({
      x: start.x + (event.clientX - start.clientX) / start.scaleX,
      y: start.y + (event.clientY - start.clientY) / start.scaleY,
    });
  };

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
    if (openModalCount === 0) {
      bodyOverflowBeforeModal = document.body.style.overflow;
    }
    openModalCount += 1;
    document.body.style.overflow = "hidden";

    const focusModal = requestAnimationFrame(() => {
      const focusable = ref.current?.querySelector<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      (focusable ?? ref.current)?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;

      const focusable = Array.from(ref.current.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
        .filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) {
        e.preventDefault();
        ref.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusModal);
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        document.body.style.overflow = bodyOverflowBeforeModal;
      }
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [closeOnEscape, open, requestClose]);

  if (!open) return null;

  return (
      <div className={["fixed inset-0 z-50 flex items-end bg-[radial-gradient(circle_at_top,rgba(52,136,205,.22),transparent_42%),rgba(1,5,10,.78)] px-0 pt-[env(safe-area-inset-top)] sm:items-center sm:justify-center sm:p-4", blurBackdrop ? "backdrop-blur-sm" : ""].join(" ")} style={{ pointerEvents: dragThroughBackdrop ? "none" : undefined }} onPointerDown={(event) => { if (closeOnBackdrop && event.target === event.currentTarget) requestClose(); }}>
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
                className={["shrink-0 border-b border-sky-200/20 bg-[linear-gradient(90deg,rgba(79,169,255,.13),transparent_60%)] px-4 sm:px-6", isDraggable ? "cursor-grab active:cursor-grabbing" : ""].join(" ")}
                style={{ touchAction: isDraggable ? "none" : undefined }}
                onPointerDown={handleHeaderPointerDown}
                onPointerMove={handleHeaderPointerMove}
                onPointerUp={handleHeaderPointerEnd}
                onPointerCancel={handleHeaderPointerEnd}
                onLostPointerCapture={handleHeaderPointerEnd}
              >
                {modalHeader}
              </div>

              <div className={["flex-1 min-h-0 overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,rgba(8,21,33,.96),rgba(3,10,18,.98))]", transparentOnBlur ? "opacity-5 hover:opacity-100" : ""].join(" ")}>
                <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
                  {modalContent}
                </div>
              </div>
              {modalFooter && <div className="shrink-0 border-t border-sky-200/20 bg-slate-950/90 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:px-6">{modalFooter}</div>}
            </>
          </div>
      </div>
  );
}
