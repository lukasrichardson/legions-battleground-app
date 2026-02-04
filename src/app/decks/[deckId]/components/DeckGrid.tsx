import { CardDocument } from "@/client/interfaces/Card.mongo";
import { renderDeckCardTile } from "./CardTile";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import { Button } from "@/client/ui/button";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";

const legionColorMap = {
  "angels": "text-yellow-400",
  "demons": "text-red-800",
  "bounty": "text-slate-500",
  "dwarfs": "text-neutral-950",
  "heroes": "text-blue-600",
  "mythical-beasts": "text-pink-500",
  "orcs": "text-green-700",
  "titans": "text-orange-500",
  "undead": "text-purple-800",
}

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
        <div key={name} className="inline-block w-full max-w-40 py-1 box-border">
          {cardGroup.map((card, index) => (
            <div 
              key={card.id.toString()+index}
              className={"[&:not(:first-child)]:-mt-[115%]"}
              // className="w-1/2 sm:w-1/3 lg:w-1/4 xl:w-1/5 max-w-40 py-1 box-border"
            >
              {renderDeckCardTile(card, index, handleDeckCardClick, setHoveredCard)}
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
        <div key={name} className="inline-block w-1/2 sm:w-1/3 lg:w-1/4 xl:w-1/5 max-w-40 py-1 box-border">
          {cardGroup.map((card, index) => (
            <div 
              key={card.id.toString()+index}
              className={"[&:not(:first-child)]:-mt-[115%]"}
              // className="w-1/2 sm:w-1/3 lg:w-1/4 xl:w-1/5 max-w-40 py-1 box-border"
            >
              {renderDeckCardTile(card, index, handleDeckCardClick, setHoveredCard)}
            </div>
          ))}
        </div>
      ))}
    </>
  )
}


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

  const mainDeck = deck?.cards_in_deck.filter(item => ["Warrior", "Unified", "Fortified"].includes(item?.card_type?.names?.[0]));
  const warlords = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === "Warlord");
  const veilRealms = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === "Veil / Realm");
  const synergies = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === "Synergy");
  const guardians = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === "Guardian");
  const tokens = deck?.cards_in_deck.filter(item => item?.card_type?.names?.[0] === "Token");
  
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
            Your Deck
          </span>
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
            <div className="space-y-4">
              <div className="flex">
              {/* Warlords */}
              {warlords && warlords.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${legionColorMap[deck.legion] || "text-white"}`}>
                    Warlords ({warlords.length})
                  </h3>
                  <div className="flex flex-wrap">
                    {renderLeftSection(warlords)}
                  </div>
                </div>
              )}
              {/* Veil/Realms */}
              {veilRealms && veilRealms.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${legionColorMap[deck.legion] || "text-white"}`}>
                    Veil / Realms ({veilRealms.length})
                  </h3>
                  <div className="flex flex-wrap">
                    {renderLeftSection(veilRealms)}
                  </div>
                </div>
              )}

              {/* Synergies */}
              {synergies && synergies.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${legionColorMap[deck.legion] || "text-white"}`}>
                    Synergies ({synergies.length})
                  </h3>
                  <div className="flex flex-wrap">
                    {renderLeftSection(synergies)}
                  </div>
                </div>
              )}

              {/* Guardians */}
              {guardians && guardians.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${legionColorMap[deck.legion] || "text-white"}`}>
                    Guardians ({guardians.length})
                  </h3>
                  <div className="flex flex-wrap">
                    {renderLeftSection(guardians)}
                  </div>
                </div>
              )}
              </div>

              {/* Main Deck */}
              {mainDeck && mainDeck.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${legionColorMap[deck.legion] || "text-white"}`}>
                    Main Deck ({mainDeck.length})
                  </h3>
                  <div className="flex flex-wrap">
                    {renderSection(mainDeck)}
                  </div>
                </div>
              )}

              {/* Tokens */}
              {tokens && tokens.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${legionColorMap[deck.legion] || "text-white"}`}>
                    Tokens ({tokens.length})
                  </h3>
                  <div className="flex flex-wrap">
                    {renderSection(tokens)}
                  </div>
                </div>
              )}

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