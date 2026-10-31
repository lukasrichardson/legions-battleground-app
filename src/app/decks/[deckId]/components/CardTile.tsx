import CardImage from "@/app/components/Card/CardImage";
import BanlistItem from "@/shared/interfaces/BanlistItem.mongo";
import CardStatusBadge, { getCardStatus } from "@/app/components/Card/CardStatusBadge";
import { CardDocument } from "@/shared/interfaces/Card.mongo";
import { HydratedDeckCard } from "@/shared/interfaces/DeckResponse";
import { useEffect, useState } from "react";
import { useDrag } from "react-dnd";
import { decodeHTMLEntities } from "@/client/utils/string.util";

export type DeckCardListKey =
  | "cards_in_deck"
  | "side_deck"
  | "warlords"
  | "synergies"
  | "veilRealms"
  | "guardians"
  | "tokens";

export type DeckDragItem = {
  card: HydratedDeckCard;
  sourceList: DeckCardListKey;
};

const renderHoverContent = (card: HydratedDeckCard, removeCardFromDeck: (e: React.MouseEvent, card: HydratedDeckCard) => void, addCardToDeck: (card: HydratedDeckCard) => void, countInDeck: number, sourceList: DeckCardListKey) => (
  <div className="absolute w-full h-full opacity-0 hover:opacity-100 focus-within:opacity-100 bg-white/20 z-50 flex items-center justify-around">
    <button type="button" aria-label={`Remove one ${decodeHTMLEntities(card.title)} from ${sourceList === "side_deck" ? "side deck" : "main deck"}`} className="bg-red-800 hover:bg-red-500 px-1 cursor-pointer rounded w-3/12 min-h-11 text-center focus-visible:outline-2 focus-visible:outline-sky-200" onClick={(e) => { e.stopPropagation(); removeCardFromDeck(e, card); }}>−</button>
    <span className="bg-gray-600 rounded font-bold" aria-label={`${countInDeck} copies`}>{countInDeck}</span>
    <button type="button" aria-label={`Add one ${decodeHTMLEntities(card.title)} to ${sourceList === "side_deck" ? "side deck" : "main deck"}`} className="bg-green-800 hover:bg-green-500 px-1 cursor-pointer rounded w-3/12 min-h-11 text-center focus-visible:outline-2 focus-visible:outline-sky-200" onClick={(e) => { e.stopPropagation(); addCardToDeck(card); }}>+</button>
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

type DeckTileCard = Pick<HydratedDeckCard, "_id" | "title" | "featured_image">;

export const renderCardTile = (card: DeckTileCard, index: number, onMouseEnter: (card: DeckTileCard) => void, lazyImage = false, onInspect?: () => void) => {
  const image = <div className="aspect-[3/4] w-full h-full overflow-hidden rounded-lg relative">
    <CardImage src={card?.featured_image} alt={card?.title || "DECK IMAGE"} className="object-contain transition-transform duration-200 group-hover:scale-[1.03]" loading={lazyImage ? "lazy" : "eager"} priority={!lazyImage} />
  </div>;
  if (onInspect) return <button type="button" key={card?._id.toString() + index} aria-label={`Inspect ${decodeHTMLEntities(card.title)}`} onClick={(event) => { event.stopPropagation(); onInspect(); }} className="block h-full w-full cursor-pointer overflow-hidden rounded-sm text-left shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-200">{image}</button>;
  return (<div
    key={card?._id.toString() + index}
    onMouseEnter={() => onMouseEnter(card)}
    onClick={() => onMouseEnter(card)}
    className="overflow-hidden rounded-sm text-left shadow-sm transition hover:shadow-md h-full w-full cursor-pointer"
  >
    {image}
  </div>)
}

export const DeckCardTile = ({ card, index, removeCardFromDeck, onMouseEnter, addCardToDeck, grouped, readOnly = false, banlist, countInDeck, sourceList, onInspectCard }: { card: HydratedDeckCard, index: number, removeCardFromDeck: (e: React.MouseEvent, card: HydratedDeckCard) => void, onMouseEnter: (card: HydratedDeckCard) => void, addCardToDeck: (card: HydratedDeckCard) => void, grouped: boolean, readOnly?: boolean, banlist: BanlistItem[], countInDeck: number, sourceList: DeckCardListKey, onInspectCard?: (card: HydratedDeckCard) => void }) => {
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
  const status = getCardStatus(banlist, card.title);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "cardFromDeck",
    item: { card, sourceList } satisfies DeckDragItem,
    canDrag: !readOnly,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [card, readOnly, sourceList]);
  return (
    grouped ? (
      <div
        className={"[&:not(:first-child)]:-mt-[115%] relative"}
        onContextMenu={readOnly ? undefined : e => removeCardFromDeck(e, card)}
        onMouseEnter={handleOnMouseEnter}
        onMouseLeave={handleOnMouseLeave}
      >
        <div ref={(node) => { drag(node); }} className={readOnly ? undefined : "cursor-grab active:cursor-grabbing"}>
          {!readOnly && renderHoverContent(card, removeCardFromDeck, addCardToDeck, countInDeck, sourceList)}
          <div key={card._id.toString() + index}>
            <div className="absolute top-1 right-2 z-50"><CardStatusBadge item={status} numeric /></div>
            {renderCardTile(card, index, () => null, false, readOnly && onInspectCard ? () => onInspectCard(card) : undefined)}
            <span aria-hidden="true" className="pointer-events-none absolute bottom-1 right-1 z-10 rounded bg-slate-950/90 px-1.5 text-xs font-bold text-white">×{countInDeck}</span>
          </div>
        </div>
      </div>
    ) : (!isDragging ?
      <div
        className="inline-block w-1/4 xs:w-1/6 sm:w-1/8 lg:w-1/10 xl:w-1/14 max-w-40 py-1 box-border relative"
        onContextMenu={readOnly ? undefined : e => removeCardFromDeck(e, card)}
        onMouseEnter={handleOnMouseEnter}
        onMouseLeave={handleOnMouseLeave}
      >
        <div ref={(node) => { drag(node); }} className={readOnly ? undefined : "cursor-grab active:cursor-grabbing"}>
          {!readOnly && renderHoverContent(card, removeCardFromDeck, addCardToDeck, countInDeck, sourceList)}
          <div key={card._id.toString() + index} onMouseLeave={handleOnMouseLeave}>
            <div className="absolute top-1 right-1 z-50"><CardStatusBadge item={status} numeric /></div>
          {renderCardTile(card, index, () => null, false, readOnly && onInspectCard ? () => onInspectCard(card) : undefined)}
          </div>
        </div>
      </div>
      : null
    )
  )
}

export const SearchCardTile = ({ card, index, onContextMenu, onMouseEnter, eagerImage = false }: { card: CardDocument, index: number, onContextMenu: (e: React.MouseEvent, card: CardDocument) => void, onMouseEnter: (card: CardDocument) => void, eagerImage?: boolean }) => {
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

  const [{isDragging}, drag] = useDrag(() => ({
    type: "cardFromSearch",
    item: card,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [card]);
  return (
    <div ref={(node) => { drag(node); }} className="cursor-grab active:cursor-grabbing" onContextMenu={(e) => onContextMenu(e, card)} onMouseLeave={handleOnMouseLeave}>
      {!isDragging && renderCardTile(card, index, handleOnMouseEnter, !eagerImage)}
    </div>
  )
}
