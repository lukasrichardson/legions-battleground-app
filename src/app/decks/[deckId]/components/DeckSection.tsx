import { CardDocument } from "@/client/interfaces/Card.mongo";
import { DeckCardTile } from "./CardTile";

export default function DeckSection({cards, removeCardFromDeck, setHoveredCard, useGroupedView, addCardToDeck}: {cards: CardDocument[], removeCardFromDeck: (e: React.MouseEvent, card: CardDocument) => void, setHoveredCard: (card: CardDocument) => void, useGroupedView: boolean, addCardToDeck: (card: CardDocument) => void}) {
  if (!cards || cards.length === 0) return null;

  // Group cards by name to apply grouping styling
  const groupedCards = cards.reduce((groups: Record<string, CardDocument[]>, card) => {
    const name = card.title;
    if (!groups[name]) {
      groups[name] = [];
    }
    groups[name].push(card);
    return groups;
  }, {});

  return useGroupedView ? (
    <>
      {Object.entries(groupedCards).map(([name, cardGroup]) => (
        <div key={name} className="inline-block w-1/4 xs:w-1/6 sm:w-1/8 lg:w-1/10 xl:w-1/14 max-w-40 py-1 box-border">
          {cardGroup.map((card, index) => (
            
              <DeckCardTile key={card.id.toString() + index} card={card} index={index} removeCardFromDeck={removeCardFromDeck} onMouseEnter={setHoveredCard} addCardToDeck={addCardToDeck} grouped />
          ))}
        </div>
      ))}
    </>
  ) : (
    <>
      {cards.map((card, index) => (
        

          <DeckCardTile key={card.id.toString() + index} card={card} index={index} removeCardFromDeck={removeCardFromDeck} onMouseEnter={setHoveredCard} addCardToDeck={addCardToDeck} grouped={false} />      ))}
    </>
  )
}