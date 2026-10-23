
"use client";
import { useAppSelector } from "@/client/redux/hooks";
import CardImage from "./CardImage";
import AppIcon from "../AppIcon";
import { decodeHTMLEntities } from "@/client/utils/string.util";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CardState } from "@/shared/interfaces/CardState";

//preview for toolbar in game. deck builder and gallery have their own versions of preview
export default function CardPreview({ detailsCollapsed = false, onToggleDetails, card }: { detailsCollapsed?: boolean; onToggleDetails?: () => void; card?: CardState | null }) {
  const [imageExpanded, setImageExpanded] = useState(false);
  const closeImageButtonRef = useRef<HTMLButtonElement>(null);
  const focusedCard = useAppSelector((state) => {
    const { cardInFocus, previousCardInFocus, side } = state.clientGameState;
    const selectedCards = side === "p1" ? state.gameState.p1SelectedCards : state.gameState.p2SelectedCards;
    const lastSelectedCard = selectedCards[selectedCards.length - 1];
    return lastSelectedCard || cardInFocus || previousCardInFocus;
  });
  const cardToShow = card === undefined ? focusedCard : card;

  useEffect(() => {
    if (!imageExpanded) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const ownsScrollLock = previousOverflow !== "hidden";
    if (ownsScrollLock) document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeImageButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      setImageExpanded(false);
    };

    document.addEventListener("keydown", handleKeyDown, true);
    closeImageButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (ownsScrollLock) document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [imageExpanded]);

  useEffect(() => {
    setImageExpanded(false);
  }, [cardToShow?.img]);

  if (!cardToShow) return <div className="grid h-full min-h-[180px] place-items-center border border-dashed border-sky-200/15 bg-slate-950/20 p-5 text-center text-xs leading-relaxed text-slate-500">Hover or select a card to inspect it here.</div>;
  const cardName = cardToShow.name ? decodeHTMLEntities(cardToShow.name) : "Card";

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-950/30">
        <button
          type="button"
          onClick={() => setImageExpanded(true)}
          aria-label={`View ${cardName} image full screen`}
          className="relative block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300"
        >
          <CardImage src={cardToShow.img} alt={cardName} className="object-contain" />
        </button>
      </div>
      <div className={`mt-2 flex shrink-0 flex-col overflow-hidden border border-sky-200/15 bg-slate-950/55 text-xs shadow-inner ${detailsCollapsed ? "" : "h-[30%]"}`}>
        {onToggleDetails && <button type="button" onClick={onToggleDetails} className="flex min-h-8 w-full items-center justify-between gap-2 border-b border-sky-200/15 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[.12em] text-sky-100/70 hover:bg-blue-400/10 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-sky-200"><span className="min-w-0 break-words">{cardToShow?.name ? decodeHTMLEntities(cardToShow.name) : "Card details"}</span><span className="shrink-0">{detailsCollapsed ? "+" : "−"}</span></button>}
        {!detailsCollapsed && <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-2 sidebar-scrollbar">
          <div className="break-words whitespace-pre-wrap text-slate-200">{cardToShow?.text ? decodeHTMLEntities(cardToShow.text) : ''}</div>
        </div>}
      </div>
      {imageExpanded && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex cursor-zoom-out items-center justify-center bg-[radial-gradient(circle_at_top,rgba(52,136,205,.2),transparent_42%),rgba(1,5,10,.88)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${cardName} full screen image`}
          onClick={() => setImageExpanded(false)}
        >
          <div className="relative h-full w-full max-w-5xl cursor-default" onClick={(event) => event.stopPropagation()}>
            <button
              ref={closeImageButtonRef}
              type="button"
              onClick={() => setImageExpanded(false)}
              aria-label="Close full screen image"
              className="absolute right-2 top-2 z-10 inline-flex h-11 w-11 cursor-pointer items-center justify-center border border-sky-200/40 bg-slate-950/85 text-white shadow-[0_0_16px_rgba(79,169,255,.2)] transition hover:border-sky-200/70 hover:bg-blue-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <AppIcon name="close" size={24} />
            </button>
            <div className="relative h-full w-full">
              <CardImage src={cardToShow.img} alt={cardName} className="object-contain" priority />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
