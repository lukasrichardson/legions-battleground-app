import { useClickOutside } from "@/client/hooks/useClickOutside";
import { useRef, useEffect, useState } from "react";
import { useDrag, useDrop } from "react-dnd";

export default function Modal({
  open,
  closeModal,
  modalHeader,
  modalContent,
  transparentOnBlur = false
}: {
  open: boolean,
  closeModal: () => void,
  modalHeader: JSX.Element,
  modalContent: JSX.Element,
  transparentOnBlur?: boolean

}) {
  interface ModalState {
    top: number;
    left: number;
  }
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [{ }, drop] = useDrop(() => ({
    accept: "modal",
    canDrop: () => true,
    drop: (_, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      const left = Math.round((modalState?.left || 0) + (delta?.x || 0));
      const top = Math.round((modalState?.top || 0) + (delta?.y || 0));
      setModalState({ top, left });
    },
  }), [modalState]);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "modal",
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), []);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, closeModal as () => void);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        closeModal();
      }
    };

    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, closeModal]);

  if (!open) return null;

  return (
    drop(
      <div className={"absolute left-0 top-0 w-full h-full z-50 flex items-center justify-center p-4 bg-black/20" + (!isDragging ? " pointer-events-none" : "")}>
        {drag(
          <div
            ref={ref}
            className={["relative max-w-[75%] max-h-[85%] border border-white/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto",
              transparentOnBlur ? "bg-white/25" : ""
            ].join(" ")}
            style={{ transform: modalState ? `translate(${modalState.left}px, ${modalState.top}px)` : undefined }}
          >
            {!isDragging && <>
              {/* Header */}
              <div className="border-b border-white/10 px-6 hover:cursor-grab active:cursor-grabbing bg-slate-900">
                {modalHeader}
              </div>

              {/* Content */}
              <div className={["flex-1 overflow-y-auto min-h-0 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-900/95", transparentOnBlur ? "opacity-5 hover:opacity-100" : ""].join(" ")}>
                <div className="p-6">
                  {modalContent}
                </div>
              </div>
            </>}
          </div>
        )}
      </div>
    )
  );
}