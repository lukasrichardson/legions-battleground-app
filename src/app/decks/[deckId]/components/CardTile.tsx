import CardImage from "@/app/components/Card/CardImage";
import { CardDocument } from "@/client/interfaces/Card.mongo";
import { useEffect, useState } from "react";

const renderHoverContent = (card, removeCardFromDeck, addCardToDeck) => (
  <div className="absolute w-full h-full opacity-0 hover:opacity-100 bg-white/20 z-50 flex items-center justify-around">
    <div className="bg-red-800 hover:bg-red-500 px-1 cursor-pointer rounded w-3/12 text-center" onClick={(e) => removeCardFromDeck(e, card)}>-</div>
    <div className="bg-green-800 hover:bg-green-500 px-1 cursor-pointer rounded w-3/12 text-center" onClick={() => addCardToDeck(card)}>+</div>
  </div>
)

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
    className="overflow-hidden rounded-sm text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md h-full w-full cursor-pointer"
  >
    <div className="aspect-[3/4] w-full h-full overflow-hidden rounded-lg relative">
      <CardImage
        src={card?.featured_image}
        alt={card?.title || "DECK IMAGE"}
        className="object-contain transition-transform duration-200 group-hover:scale-[1.03]"
      />
    </div>
  </div>)
}

export const DeckCardTile = ({ card, index, removeCardFromDeck, onMouseEnter, addCardToDeck, grouped }: { card: CardDocument, index: number, removeCardFromDeck: (e: React.MouseEvent, card: CardDocument) => void, onMouseEnter: (card: CardDocument) => void, addCardToDeck: (card: CardDocument) => void, grouped: boolean }) => {
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
    grouped ? (
      <div
        className={"[&:not(:first-child)]:-mt-[115%] relative"}
        onContextMenu={e => removeCardFromDeck(e, card)}
        onMouseEnter={handleOnMouseEnter}
        onMouseLeave={handleOnMouseLeave}
      >
        {renderHoverContent(card, removeCardFromDeck, addCardToDeck)}
        <div key={card.id.toString() + index}>
          {renderCardTile(card, index, () => null)}
        </div>
      </div>
    ) : (
      <div
        className="inline-block w-1/4 xs:w-1/6 sm:w-1/8 lg:w-1/10 xl:w-1/14 max-w-40 py-1 box-border relative"
        onContextMenu={e => removeCardFromDeck(e, card)}
        onMouseEnter={handleOnMouseEnter}
        onMouseLeave={handleOnMouseLeave}
      >
        {renderHoverContent(card, removeCardFromDeck, addCardToDeck)}
        <div onContextMenu={(e) => removeCardFromDeck(e, card)} key={card.id.toString() + index} onMouseLeave={handleOnMouseLeave}>
        {renderCardTile(card, index, () => null)}
        </div>
      </div>
    )
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