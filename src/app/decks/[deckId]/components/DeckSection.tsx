import { HydratedDeckCard } from "@/shared/interfaces/DeckResponse";
import { DeckCardListKey, DeckCardTile } from "./CardTile";
import BanlistItem from "@/shared/interfaces/BanlistItem.mongo";
import { decodeHTMLEntities } from "@/client/utils/string.util";

export default function DeckSection({ cards, removeCardFromDeck, setHoveredCard, useGroupedView, addCardToDeck, readOnly = false, sourceListForCard, banlist, onInspectCard }: { cards: HydratedDeckCard[], removeCardFromDeck: (e: React.MouseEvent, card: HydratedDeckCard) => void, setHoveredCard: (card: HydratedDeckCard) => void, useGroupedView: boolean, addCardToDeck: (card: HydratedDeckCard) => void, readOnly?: boolean, sourceListForCard: (card: HydratedDeckCard) => DeckCardListKey, banlist: BanlistItem[], onInspectCard?: (card: HydratedDeckCard) => void }) {

  // A printing has its own ID, image and mutation target even when titles match.
  const groupedCards = cards.reduce((groups: Record<string, HydratedDeckCard[]>, card) => {
    const id = card._id.toString();
    if (!groups[id]) {
      groups[id] = [];
    }
    groups[id].push(card);
    return groups;
  }, {});
  const printingsByTitle = new Map<string, number>();
  Object.values(groupedCards).forEach(([card]) => {
    const title = decodeHTMLEntities(card.title);
    printingsByTitle.set(title, (printingsByTitle.get(title) ?? 0) + 1);
  });

  if (!cards || cards.length === 0) return null;
  return useGroupedView ? (
    <>
      {Object.entries(groupedCards).map(([id, cardGroup]) => (
        <div key={id} role="group" aria-label={`${decodeHTMLEntities(cardGroup[0].title)}${cardGroup[0].card_code ? ` (${cardGroup[0].card_code})` : ""}, ${cardGroup.length} ${cardGroup.length === 1 ? "copy" : "copies"}`} data-deck-card-id={id} data-deck-card-list={sourceListForCard(cardGroup[0])} className="inline-block w-1/4 xs:w-1/6 sm:w-1/8 lg:w-1/10 xl:w-1/14 max-w-40 py-1 box-border">
          <DeckCardTile onInspectCard={onInspectCard} readOnly={readOnly} card={cardGroup[0]} index={0} removeCardFromDeck={removeCardFromDeck} onMouseEnter={setHoveredCard} addCardToDeck={addCardToDeck} grouped banlist={banlist} countInDeck={cardGroup.length} sourceList={sourceListForCard(cardGroup[0])} />
          {(printingsByTitle.get(decodeHTMLEntities(cardGroup[0].title)) ?? 0) > 1 && <span className="block truncate text-xs text-white" title={cardGroup[0].card_code || id}>{cardGroup[0].card_code || id}</span>}
        </div>
      ))}
    </>
  ) : (
    <>
      {cards.map((card, index) => {
        const countInDeck = groupedCards[card._id.toString()]?.length || 1;
        return (
          <DeckCardTile onInspectCard={onInspectCard} readOnly={readOnly} key={card._id.toString() + index} card={card} index={index} removeCardFromDeck={removeCardFromDeck} onMouseEnter={setHoveredCard} addCardToDeck={addCardToDeck} grouped={false} banlist={banlist} countInDeck={countInDeck} sourceList={sourceListForCard(card)} />
        )
      })}
    </>
  )
}
