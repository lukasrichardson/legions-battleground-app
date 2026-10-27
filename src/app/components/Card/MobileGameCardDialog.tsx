import { createPortal } from "react-dom";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { CardState } from "@/shared/interfaces/CardState";
import { decodeHTMLEntities } from "@/client/utils/string.util";
import Modal from "../Modals/Modal";
import CardPreview from "./CardPreview";

export default function MobileGameCardDialog({
  card, title, onClose, children,
}: {
  card: CardState;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const closeInPortrait = () => {
      if (window.matchMedia("(max-width: 767px) and (orientation: portrait)").matches) onClose();
    };
    closeInPortrait();
    window.addEventListener("resize", closeInPortrait);
    return () => window.removeEventListener("resize", closeInPortrait);
  }, [onClose]);
  return createPortal(
    <div className="game-card-dialog relative z-[1400]" onClick={(event) => event.stopPropagation()}>
      <Modal
        open
        variant="constrained-dialog"
        overlayClassName="game-card-dialog !z-[1400]"
        ariaLabel="Card details and actions"
        closeModal={onClose}
        modalHeader={
          <div className="flex min-h-11 items-center justify-between gap-3">
            <h2 className="min-w-0 truncate text-sm font-semibold text-white">
              {decodeHTMLEntities(title)}
            </h2>
            <button type="button" aria-label="Close card details and actions" onClick={onClose} className="grid size-11 shrink-0 place-items-center text-white touch-feedback">
              <X size={20} />
            </button>
          </div>
        }
        modalContent={
          <div className="grid h-[calc(85dvh-7rem)] min-h-32 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3">
            <CardPreview card={card} />
            <section aria-label="Card actions" className="min-h-0 min-w-0 overflow-y-auto overscroll-contain text-white">
              {children}
            </section>
          </div>
        }
      />
    </div>,
    document.body,
  );
}
