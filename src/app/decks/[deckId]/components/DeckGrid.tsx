import { CardDocument } from "@/shared/interfaces/Card.mongo";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import { Button } from "@/client/ui/button";
import { DeckResponse, HydratedDeckCard } from "@/shared/interfaces/DeckResponse";
import { CARD_TYPE } from "@/shared/enums/CardType";
import useClientSettings from "@/client/hooks/useClientSettings";
import DeckSection from "./DeckSection";
import useIsMobile from "@/client/hooks/useIsMobile";
import { useDrop } from "react-dnd";
import { getMainDeckCards, getOrdinaryMainDeckCards, getSideDeckCards, getSpecialMainDeckCards } from "@/shared/deckComposition";
import LoadingState from "@/app/components/LoadingState";
import AppIcon from "@/app/components/AppIcon";

const renderSectionStructure = (name: string, cards: HydratedDeckCard[], renderSubSection: (cards: HydratedDeckCard[]) => JSX.Element) => (
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
  handleAddCardToDeck,
  handleRemoveCardFromSideDeck = () => null,
  handleAddCardToSideDeck = () => null,
  readOnly = false
}: {
  deck: DeckResponse | null,
  handleRemoveCardFromDeck: (card: HydratedDeckCard) => void,
  setHoveredCard: (card: HydratedDeckCard | null) => void,
  handleSortClick: () => void,
  saving: boolean,
  handleAddCardToDeck: (card: HydratedDeckCard) => void,
  handleRemoveCardFromSideDeck?: (card: HydratedDeckCard) => void,
  handleAddCardToSideDeck?: (card: HydratedDeckCard) => void,
  readOnly?: boolean
}) {

  const deckCards = deck ? getOrdinaryMainDeckCards(deck) : [];
  const allMainDeckCards = deck ? getMainDeckCards(deck) : [];
  const mainDeck = deckCards.filter(item => [CARD_TYPE.WARRIOR.toString(), CARD_TYPE.UNIFIED.toString(), CARD_TYPE.FORTIFIED.toString()].includes(item?.card_type?.names?.[0]));
  const warriors = deckCards.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.WARRIOR);
  const unifieds = deckCards.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.UNIFIED);
  const fortifieds = deckCards.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.FORTIFIED);
  const warlords = deck ? getSpecialMainDeckCards(deck, "warlords") : [];
  const veilRealms = deck ? getSpecialMainDeckCards(deck, "veilRealms") : [];
  const synergies = deck ? getSpecialMainDeckCards(deck, "synergies") : [];
  const guardians = deck ? getSpecialMainDeckCards(deck, "guardians") : [];
  const tokens = deckCards.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.TOKEN);

  const { deckbuild_groupedView, setDeckbuildGroupedView } = useClientSettings();

  const handleDeckCardClick = (e, card) => {
    e.preventDefault();
    handleRemoveCardFromDeck(card);
  }

  const renderSection = (cards, removeCard = handleDeckCardClick, addCard = handleAddCardToDeck) => (
    <DeckSection
      cards={cards}
      removeCardFromDeck={removeCard}
      setHoveredCard={setHoveredCard}
      useGroupedView={deckbuild_groupedView}
      addCardToDeck={addCard}
      readOnly={readOnly}
    />
  )

  const handleGroupedViewToggle = () => {
    setDeckbuildGroupedView(!deckbuild_groupedView);
  }
  const isMobile = useIsMobile();
  const sideDeck = deck ? getSideDeckCards(deck) : [];
  const handleSideDeckCardClick = (e, card) => {
    e.preventDefault();
    handleRemoveCardFromSideDeck(card);
  }
  const [{ isOverSideDeck, canDropSideDeck }, sideDeckDrop] = useDrop(() => ({
    accept: "cardFromSearch",
    canDrop: () => !readOnly,
    drop: (card: CardDocument) => {
      handleAddCardToSideDeck(card);
      return { target: "side-deck" };
    },
    collect: (monitor) => ({
      isOverSideDeck: monitor.isOver({ shallow: true }),
      canDropSideDeck: monitor.canDrop(),
    }),
  }), [handleAddCardToSideDeck, readOnly]);
  const attachSideDeckDropTarget = (node: HTMLDivElement | null) => {
    sideDeckDrop(node);
  };
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
    <Card className="min-h-0 flex-1 bg-white/10 border-white/20 text-white flex flex-col">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            Main: {allMainDeckCards.length}
            {!isMobile &&(<><span>|  Warriors: {warriors?.length}</span>
            <span>|  Unified: {unifieds?.length}</span>
            <span>|  Fortified: {fortifieds?.length}</span>
            <span>|  Side: {sideDeck?.length}</span></>)}
          </span>
          <div className="flex items-center gap-2">
            {!readOnly && <Button
              onClick={handleSortClick}
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-6 px-2 text-xs"
              disabled={saving}
            >
              {saving ? "Saving..." : "Sort"}
            </Button>}
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
            <LoadingState label="Loading deck…" className="h-full" />
          ) : deckbuild_groupedView ? (
            <div className="space-y-2">
              <div className="flex">
                {renderSection([...warlords, ...veilRealms, ...synergies, ...guardians, ...tokens])}
              </div>

              {renderSectionStructure(CARD_TYPE.WARRIOR, warriors, renderSection)}
              {renderSectionStructure(CARD_TYPE.UNIFIED, unifieds, renderSection)}
              {renderSectionStructure(CARD_TYPE.FORTIFIED, fortifieds, renderSection)}

              {/* Empty State */}
              {allMainDeckCards.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 bg-gray-700/50 rounded-full flex items-center justify-center mb-2">
                    <AppIcon name="create" className="text-gray-400" size={16} />
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
    <div ref={attachSideDeckDropTarget} className="shrink-0">
      <Card className={`relative border-white/20 bg-slate-950/35 text-white ${isOverSideDeck ? "border-purple-300 bg-purple-900/40" : ""}`}>
        {canDropSideDeck && <div className="pointer-events-none absolute inset-0 z-10 rounded-lg border-2 border-dashed border-purple-200" />}
        <CardHeader className="p-2 pb-1">
          <CardTitle className="flex items-center justify-between text-xs sm:text-sm">
            <span>Side Deck <span className="text-purple-200">{sideDeck.length}/15</span></span>
            <span className="text-[10px] font-normal text-white/60">Deck-building only</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-40 overflow-y-auto p-2 pt-0">
          {sideDeck.length ? (
            <div className="flex flex-wrap">
              {renderSection(sideDeck, handleSideDeckCardClick, handleAddCardToSideDeck)}
            </div>
          ) : (
            <p className="py-2 text-center text-xs text-white/55">Add up to 15 eligible cards for match preparation.</p>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
