import { useClickOutside } from "@/client/hooks/useClickOutside";
import { useCallback, useRef, useEffect, useState } from "react";
import { useDrag, useDrop } from "react-dnd";

interface ModalState {
  top: number;
  left: number;
}

let openModalCount = 0;
let bodyOverflowBeforeModal = "";

export default function Modal({
  open,
  closeModal,
  modalHeader,
  modalContent,
  transparentOnBlur = false,
  variant = "dialog",
  ariaLabel = "Dialog",
}: {
  open: boolean,
  closeModal: () => void,
  modalHeader: JSX.Element,
  modalContent: JSX.Element,
  transparentOnBlur?: boolean,
  variant?: "dialog" | "bottom-sheet" | "constrained-dialog",
  ariaLabel?: string,
}) {
  const isBottomSheet = variant === "bottom-sheet";
  const isConstrainedDialog = variant === "constrained-dialog";
  const isDraggable = variant === "dialog";
  const [modalState, setModalState] = useState<ModalState | null>();
  const [{ }, drop] = useDrop(() => ({
    accept: "modal",
    canDrop: () => isDraggable,
    drop: (_, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      const left = Math.round((modalState?.left || 0) + (delta?.x || 0));
      const top = Math.round((modalState?.top || 0) + (delta?.y || 0));
      setModalState({ top, left });
    },
  }), [isDraggable, modalState]);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "modal",
    canDrag: () => isDraggable,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [isDraggable]);
  const ref = useRef<HTMLDivElement>(null);
  const closeModalRef = useRef(closeModal);
  closeModalRef.current = closeModal;
  const setDropRef = useCallback((node: HTMLDivElement | null) => {
    drop(node);
  }, [drop]);
  const setDragRef = useCallback((node: HTMLDivElement | null) => {
    ref.current = node;
    drag(node);
  }, [drag]);
  const handleClickOutside = useCallback(() => {
    if (open) {
      closeModalRef.current();
    }
  }, [open]);
  useClickOutside(ref, handleClickOutside);

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
      if (e.key === "Escape") {
        closeModalRef.current();
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
      setModalState(null);
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        document.body.style.overflow = bodyOverflowBeforeModal;
      }
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
      <div ref={setDropRef} className={isBottomSheet ? "fixed inset-0 z-50 flex items-end bg-black/50" : isConstrainedDialog ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" : "absolute left-0 top-0 z-50 h-full w-full bg-black/20 p-4" + (!isDragging ? " pointer-events-none" : "")}>
          <div
            ref={setDragRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            className={[isBottomSheet
              ? "relative max-h-[95vh] w-full overflow-hidden rounded-t-2xl border border-white/15 border-b-0 shadow-2xl"
              : isConstrainedDialog
                ? "relative flex max-h-[85dvh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 shadow-2xl"
              : "relative max-h-[85%] w-fit max-w-[75%] transform overflow-hidden rounded-2xl border border-white/50 shadow-2xl top-1/4 left-1/2",
              "flex flex-col pointer-events-auto",
              transparentOnBlur ? "bg-white/25" : ""
            ].join(" ")}
            style={!isDraggable ? undefined : {
              transform: modalState ? `translate(calc(-50% + ${modalState.left}px), calc(-25% + ${modalState.top}px))` : "translate(-50%, -25%)"
            }}
          >
            {!isDragging && <>
              <div className={`border-b border-white/10 bg-slate-900 ${isDraggable ? "px-6 hover:cursor-grab active:cursor-grabbing" : "px-4 sm:px-6"}`}>
                {modalHeader}
              </div>

              <div className={["flex-1 min-h-0 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-900/95", transparentOnBlur ? "opacity-5 hover:opacity-100" : ""].join(" ")}>
                <div className={isDraggable ? "p-6" : "p-4 sm:p-6"}>
                  {modalContent}
                </div>
              </div>
            </>}
          </div>
      </div>
  );
}
