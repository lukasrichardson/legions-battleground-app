import { CardDocument } from "@/client/interfaces/Card.mongo";
import { useEffect, useState } from "react";

export const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 840'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#e5e7eb'/>
        <stop offset='100%' stop-color='#cbd5e1'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
  </svg>`);

export const renderCardTile = (card: { id: string | number; title: string; featured_image: string }, index: number, onMouseEnter: (card: { id: string | number; title: string; featured_image: string }) => void) => {
  return (<div
    key={card?.id.toString() + index}
    onMouseEnter={() => onMouseEnter(card)}
    onClick={() => onMouseEnter(card)}
    className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md h-fit cursor-pointer"
  >
    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card?.featured_image}
        alt={card?.title || "DECK IMAGE"}
        onError={(e) => ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
      />
    </div>
  </div>)
}

export const DeckCardTile = ({ card, index, onContextMenu, onMouseEnter }: { card: { id: string | number; title: string; featured_image: string }, index: number, onContextMenu: (e: React.MouseEvent, card: { id: string | number; title: string; featured_image: string }) => void, onMouseEnter: (card: { id: string | number; title: string; featured_image: string }) => void }) => {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const handleOnMouseEnter = () => {
    const timeoutId = setTimeout(() => {
      // if mouse is still over hovered card after 100ms, set it as hovered card to prevent flickering when quickly moving mouse across cards
      onMouseEnter(card);
    }, 80);
    setTimeoutId(timeoutId);
  }
  const handleOnMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }, [timeoutId]);
  return (
    <div onContextMenu={(e) => onContextMenu(e, card)} key={card.id.toString() + index} onMouseLeave={handleOnMouseLeave}>
      {renderCardTile(card, index, handleOnMouseEnter)}
    </div>
  )
}

export const SearchCardTile = ({ card, index, onContextMenu, onMouseEnter }: { card: CardDocument, index: number, onContextMenu: (e: React.MouseEvent, card: CardDocument) => void, onMouseEnter: (card: CardDocument) => void }) => {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const handleOnMouseEnter = () => {
    const timeoutId = setTimeout(() => {
      // if mouse is still over hovered card after 100ms, set it as hovered card to prevent flickering when quickly moving mouse across cards
      onMouseEnter(card);
    }, 80);
    setTimeoutId(timeoutId);
  }
  const handleOnMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }, [timeoutId]);
  return (
    <div onContextMenu={(e) => onContextMenu(e, card)} key={card.id.toString() + index} onMouseLeave={handleOnMouseLeave}>
      {renderCardTile(card, index, handleOnMouseEnter)}
    </div>
  )
}