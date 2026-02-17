import { CardDocument } from "@/client/interfaces/Card.mongo";
import { DeckCardTile } from "./CardTile";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import { Button } from "@/client/ui/button";
import { CardInDeck, DeckResponse } from "@/shared/interfaces/DeckResponse";
import { CARD_TYPE } from "@/shared/enums/CardType";
import useClientSettings from "@/client/hooks/useClientSettings";

const renderLeftSideSection = (cards: CardDocument[], removeCardFromDeck, setHoveredCard, addCardToDeck) => {
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
              className={"[&:not(:first-child)]:-mt-[115%] relative"}
            >
              <div className="absolute w-full h-full opacity-0 hover:opacity-100 bg-white/20 z-50 flex items-center justify-around">
                <div className="bg-red-800 hover:bg-red-500 px-1 cursor-pointer rounded w-3/12 text-center" onClick={(e) => removeCardFromDeck(e, card)}>-</div>
                <div className="bg-green-800 hover:bg-green-500 px-1 cursor-pointer rounded w-3/12 text-center" onClick={() => addCardToDeck(card)}>+</div>
              </div>
              <DeckCardTile card={card} index={index} onContextMenu={removeCardFromDeck} onMouseEnter={setHoveredCard} />
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

const renderDeckSection = (cards: CardDocument[], removeCardFromDeck, setHoveredCard, useGroupedView, addCardToDeck) => {
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
            <div
              key={card.id.toString() + index}
              className={"[&:not(:first-child)]:-mt-[115%] relative"}
            >
              <div className="absolute w-full h-full opacity-0 hover:opacity-100 bg-white/20 z-50 flex items-center justify-around">
                <div className="bg-red-800 hover:bg-red-500 px-1 cursor-pointer rounded w-3/12 text-center" onClick={(e) => removeCardFromDeck(e, card)}>-</div>
                <div className="bg-green-800 hover:bg-green-500 px-1 cursor-pointer rounded w-3/12 text-center" onClick={() => addCardToDeck(card)}>+</div>
              </div>
              <DeckCardTile card={card} index={index} onContextMenu={removeCardFromDeck} onMouseEnter={setHoveredCard} />
            </div>
          ))}
        </div>
      ))}
    </>
  ) : (
    <>
      {cards.map((card, index) => (
        <div key={card.id.toString() + index} className="inline-block w-1/4 xs:w-1/6 sm:w-1/8 lg:w-1/10 xl:w-1/14 max-w-40 py-1 box-border relative">
          <div className="absolute w-full h-full opacity-0 hover:opacity-100 bg-white/20 z-50 flex items-center justify-around">
            <div className="bg-red-800 hover:bg-red-500 px-1 cursor-pointer rounded w-3/12 text-center" onClick={(e) => removeCardFromDeck(e, card)}>-</div>
            <div className="bg-green-800 hover:bg-green-500 px-1 cursor-pointer rounded w-3/12 text-center" onClick={() => addCardToDeck(card)}>+</div>
          </div>
          <DeckCardTile card={card} index={index} onContextMenu={removeCardFromDeck} onMouseEnter={setHoveredCard} />
        </div>
      ))}
    </>
  )
}

const renderSectionStructure = (name: string, cards: CardInDeck[], renderSubSection: (cards: CardInDeck[]) => JSX.Element) => (
  cards && cards.length > 0 && (
    <div>
      <span className="text-xs font-semibold text-white">
        {name}
      </span>
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
  saving,
  handleAddCardToDeck
}: {
  deck: DeckResponse | null,
  handleRemoveCardFromDeck: (card: CardDocument) => void,
  setHoveredCard: (card: CardDocument | null) => void,
  handleSortClick: () => void,
  saving: boolean,
  handleAddCardToDeck: (card: CardDocument) => void
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

  const { deckbuild_groupedView, setDeckbuildGroupedView } = useClientSettings();

  const handleDeckCardClick = async (e, card) => {
    e.preventDefault();
    handleRemoveCardFromDeck(card);
  }

  const renderSection = (cards) => renderDeckSection(cards, handleDeckCardClick, setHoveredCard, deckbuild_groupedView, handleAddCardToDeck);
  const renderLeftSection = (cards) => renderLeftSideSection(cards, handleDeckCardClick, setHoveredCard, handleAddCardToDeck);

  const handleGroupedViewToggle = () => {
    setDeckbuildGroupedView(!deckbuild_groupedView);
  }
  return (
    <Card className="bg-white/10 border-white/20 text-white h-full flex flex-col">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            Main: {mainDeck?.length}
            <span>|  Warriors: {warriors?.length}</span>
            <span>|  Unified: {unifieds?.length}</span>
            <span>|  Fortified: {fortifieds?.length}</span>
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
            <input type="checkbox" id="groupedView" checked={deckbuild_groupedView} onChange={handleGroupedViewToggle} />
            <label htmlFor="groupedView" className="text-xs cursor-pointer">
              Grouped View
            </label>
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
          ) : deckbuild_groupedView ? (
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
          ) : (
            <>
            <div className="rounded bg-white/20 relative min-h-1/12">
              <span className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 italic z-50 pointer-events-none bg-black/20">LEFT SIDE and tokens</span>
              {renderSection([...warlords, ...veilRealms, ...synergies, ...guardians, ...tokens])}
            </div>
            <div className="rounded bg-white/20 relative mt-2 min-h-1/2">
              <span className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 italic z-50 pointer-events-none bg-black/20">MAIN DECK</span>
              {renderSection(mainDeck)}
            </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}