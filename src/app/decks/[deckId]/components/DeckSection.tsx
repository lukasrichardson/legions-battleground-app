import { HydratedDeckCard } from "@/shared/interfaces/DeckResponse";
import { DeckCardListKey, DeckCardTile } from "./CardTile";
import BanlistItem from "@/shared/interfaces/BanlistItem.mongo";
import { decodeHTMLEntities } from "@/client/utils/string.util";

export default function DeckSection({ cards, removeCardFromDeck, setHoveredCard, useGroupedView, addCardToDeck, readOnly = false, sourceListForCard, banlist }: { cards: HydratedDeckCard[], removeCardFromDeck: (e: React.MouseEvent, card: HydratedDeckCard) => void, setHoveredCard: (card: HydratedDeckCard) => void, useGroupedView: boolean, addCardToDeck: (card: HydratedDeckCard) => void, readOnly?: boolean, sourceListForCard: (card: HydratedDeckCard) => DeckCardListKey, banlist: BanlistItem[] }) {

  // Group cards by name to apply grouping styling
  const groupedCards = cards.reduce((groups: Record<string, HydratedDeckCard[]>, card) => {
    const name = decodeHTMLEntities(card.title);
    if (!groups[name]) {
      groups[name] = [];
    }
    groups[name].push(card);
    return groups;
  }, {});

  if (!cards || cards.length === 0) return null;
  return useGroupedView ? (
    <>
      {Object.entries(groupedCards).map(([name, cardGroup]) => (
        <div key={name} className="inline-block w-1/4 xs:w-1/6 sm:w-1/8 lg:w-1/10 xl:w-1/14 max-w-40 py-1 box-border">
          {cardGroup.map((card, index) => {
            const countInDeck = cardGroup.length;
            return (
              <DeckCardTile key={card._id.toString() + index} readOnly={readOnly} card={card} index={index} removeCardFromDeck={removeCardFromDeck} onMouseEnter={setHoveredCard} addCardToDeck={addCardToDeck} grouped banlist={banlist} countInDeck={countInDeck} sourceList={sourceListForCard(card)} />
            )
          })}
        </div>
      ))}
    </>
  ) : (
    <>
      {cards.map((card, index) => {
        const countInDeck = groupedCards[decodeHTMLEntities(card.title)]?.length || 1;
        return (
          <DeckCardTile readOnly={readOnly} key={card._id.toString() + index} card={card} index={index} removeCardFromDeck={removeCardFromDeck} onMouseEnter={setHoveredCard} addCardToDeck={addCardToDeck} grouped={false} banlist={banlist} countInDeck={countInDeck} sourceList={sourceListForCard(card)} />
        )
      })}
    </>
  )
}
