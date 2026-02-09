import { CardDocument } from "@/client/interfaces/Card.mongo";
import { DeckCardTile } from "./CardTile";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import { Button } from "@/client/ui/button";
import { CardInDeck, DeckResponse } from "@/shared/interfaces/DeckResponse";
import { CARD_TYPE } from "@/shared/enums/CardType";

const renderLeftSideSection = (cards: CardDocument[], handleDeckCardClick, setHoveredCard) => {
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

  return (
    <>
      {Object.entries(groupedCards).map(([name, cardGroup]) => (
        <div key={name} className="inline-block w-full max-w-20 box-border">
          {cardGroup.map((card, index) => (
            <div
              key={card.id.toString() + index}
              className={"[&:not(:first-child)]:-mt-[115%]"}
            >
              <DeckCardTile card={card} index={index} onContextMenu={handleDeckCardClick} onMouseEnter={setHoveredCard} />
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

const renderDeckSection = (cards: CardDocument[], handleDeckCardClick, setHoveredCard) => {
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

  return (
    <>
      {Object.entries(groupedCards).map(([name, cardGroup]) => (
        <div key={name} className="inline-block w-1/4 xs:w-1/6 sm:w-1/8 lg:w-1/10 xl:w-1/14 max-w-40 py-1 box-border">
          {cardGroup.map((card, index) => (
            <div
              key={card.id.toString() + index}
              className={"[&:not(:first-child)]:-mt-[115%]"}
            >
              <DeckCardTile card={card} index={index} onContextMenu={handleDeckCardClick} onMouseEnter={setHoveredCard} />
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

const renderSectionStructure = (name: string, cards: CardInDeck[], renderSubSection: (cards: CardInDeck[]) => JSX.Element) => (
  cards && cards.length > 0 && (
    <div>
      <h3 className="text-sm font-semibold text-white">
        {name} ({cards.length})
      </h3>
      <div className="flex flex-wrap">
        {renderSubSection(cards)}
      </div>
    </div>
  )
)


export default function DeckGrid({
  deck,
  handleRemoveCardFromDeck,
  setHoveredCard,
  handleSortClick,
  saving
}: {
  deck: DeckResponse | null,
  handleRemoveCardFromDeck: (card: CardDocument) => void,
  setHoveredCard: (card: CardDocument | null) => void,
  handleSortClick: () => void,
  saving: boolean
}) {

  const mainDeck = deck?.cards_in_deck.filter(item => [CARD_TYPE.WARRIOR.toString(), CARD_TYPE.UNIFIED.toString(), CARD_TYPE.FORTIFIED.toString()].includes(item?.card_type?.names?.[0]));
  const warriors = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.WARRIOR);
  const unifieds = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.UNIFIED);
  const fortifieds = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.FORTIFIED);
  const warlords = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.WARLORD);
  const veilRealms = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.VEIL_REALM);
  const synergies = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.SYNERGY);
  const guardians = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.GUARDIAN);
  const tokens = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.TOKEN);

  const handleDeckCardClick = async (e, card) => {
    e.preventDefault();
    handleRemoveCardFromDeck(card);
  }

  const renderSection = (cards) => renderDeckSection(cards, handleDeckCardClick, setHoveredCard);
  const renderLeftSection = (cards) => renderLeftSideSection(cards, handleDeckCardClick, setHoveredCard);
  return (
    <Card className="bg-white/10 border-white/20 text-white h-full flex flex-col">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded flex items-center justify-center">
              <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Main Deck: {mainDeck?.length} Cards
          </span>
          <span></span>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSortClick}
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-6 px-2 text-xs"
              disabled={saving}
            >
              {saving ? "Saving..." : "Sort"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0 flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          {!deck ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 bg-gray-700/50 rounded-full flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">Loading deck...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap">
                {renderSectionStructure(CARD_TYPE.WARLORD, warlords, renderLeftSection)}
                {renderSectionStructure(CARD_TYPE.VEIL_REALM, veilRealms, renderLeftSection)}
                {renderSectionStructure(CARD_TYPE.SYNERGY, synergies, renderLeftSection)}
                {renderSectionStructure(CARD_TYPE.GUARDIAN, guardians, renderLeftSection)}
              </div>


              {renderSectionStructure(CARD_TYPE.WARRIOR, warriors, renderSection)}
              {renderSectionStructure(CARD_TYPE.UNIFIED, unifieds, renderSection)}
              {renderSectionStructure(CARD_TYPE.FORTIFIED, fortifieds, renderSection)}
              {renderSectionStructure(CARD_TYPE.TOKEN, tokens, renderSection)}

              {/* Empty State */}
              {(!deck.cards_in_deck || deck.cards_in_deck.length === 0) && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 bg-gray-700/50 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">No cards in deck</p>
                  <p className="text-gray-500 text-xs mt-1">Use the search pane to add cards</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}