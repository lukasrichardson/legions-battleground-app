import { CardDocument } from "@/shared/interfaces/Card.mongo";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import { Button } from "@/client/ui/button";
import { DeckResponse, HydratedDeckCard } from "@/shared/interfaces/DeckResponse";
import { CARD_TYPE } from "@/shared/enums/CardType";
import useClientSettings from "@/client/hooks/useClientSettings";
import DeckSection from "./DeckSection";
import useIsMobile from "@/client/hooks/useIsMobile";
import { useDrop } from "react-dnd";
import { getMainDeckCards, getOrdinaryMainDeckCards, getSideDeckCards, getSpecialDeckCards, specialDeckFieldForCardType } from "@/shared/deckComposition";
import LoadingState from "@/app/components/LoadingState";
import AppIcon from "@/app/components/AppIcon";
import { EmptyState } from "@/client/ui/empty-state";
import { DeckCardListKey, DeckDragItem } from "./CardTile";
import { decodeHTMLEntities } from "@/client/utils/string.util";
import BanlistItem from "@/shared/interfaces/BanlistItem.mongo";
import CardStatusBadge, { getCardStatus } from "@/app/components/Card/CardStatusBadge";

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
  getSideDeckMoveError = () => null,
  onMoveCardToSideDeck = () => null,
  onInspectCard = () => null,
  onRemoveAll = () => null,
  readOnly = false,
  banlist = [],
}: {
  deck: DeckResponse | null,
  handleRemoveCardFromDeck: (card: HydratedDeckCard) => void,
  setHoveredCard: (card: HydratedDeckCard | null) => void,
  handleSortClick: () => void,
  saving: boolean,
  handleAddCardToDeck: (card: HydratedDeckCard) => void,
  handleRemoveCardFromSideDeck?: (card: HydratedDeckCard) => void,
  handleAddCardToSideDeck?: (card: HydratedDeckCard) => void,
  getSideDeckMoveError?: (card: HydratedDeckCard) => string | null,
  onMoveCardToSideDeck?: (item: DeckDragItem) => void,
  onInspectCard?: (card: HydratedDeckCard) => void,
  onRemoveAll?: (card: HydratedDeckCard, source: DeckCardListKey) => void,
  readOnly?: boolean,
  banlist?: BanlistItem[],
}) {

  const deckCards = deck ? getOrdinaryMainDeckCards(deck) : [];
  const allMainDeckCards = deck ? getMainDeckCards(deck) : [];
  const mainDeck = deckCards.filter(item => [CARD_TYPE.WARRIOR.toString(), CARD_TYPE.UNIFIED.toString(), CARD_TYPE.FORTIFIED.toString()].includes(item?.card_type?.names?.[0]));
  const warriors = deckCards.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.WARRIOR);
  const unifieds = deckCards.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.UNIFIED);
  const fortifieds = deckCards.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.FORTIFIED);
  const warlords = deck ? getSpecialDeckCards(deck, "warlords") : [];
  const veilRealms = deck ? getSpecialDeckCards(deck, "veilRealms") : [];
  const synergies = deck ? getSpecialDeckCards(deck, "synergies") : [];
  const guardians = deck ? getSpecialDeckCards(deck, "guardians") : [];
  const tokens = deck ? getSpecialDeckCards(deck, "tokens") : [];
  const noLeftSide = warlords.length === 0 && veilRealms.length === 0 && synergies.length === 0 && guardians.length === 0 && tokens.length === 0;

  const { deckbuild_groupedView, setDeckbuildGroupedView } = useClientSettings();

  const handleDeckCardClick = (e, card) => {
    e.preventDefault();
    handleRemoveCardFromDeck(card);
  }

  const mainSourceListForCard = (card: HydratedDeckCard): DeckCardListKey =>
    specialDeckFieldForCardType(card.card_type?.names?.[0]) ?? "cards_in_deck";

  const renderSection = (cards, removeCard = handleDeckCardClick, addCard = handleAddCardToDeck, sourceListForCard = mainSourceListForCard) => (
    <DeckSection
      cards={cards}
      removeCardFromDeck={removeCard}
      setHoveredCard={setHoveredCard}
      useGroupedView={deckbuild_groupedView}
      addCardToDeck={addCard}
      readOnly={readOnly}
      sourceListForCard={sourceListForCard}
      banlist={banlist}
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
    accept: ["cardFromSearch", "cardFromDeck"],
    canDrop: (item, monitor) => {
      if (readOnly) return false;
      if (monitor.getItemType() === "cardFromSearch") return getSideDeckMoveError(item as CardDocument) === null;
      const deckItem = item as DeckDragItem;
      return deckItem.sourceList !== "side_deck" && getSideDeckMoveError(deckItem.card) === null;
    },
    drop: (item, monitor) => {
      if (monitor.getItemType() === "cardFromSearch") {
        handleAddCardToSideDeck(item as CardDocument);
      } else {
        onMoveCardToSideDeck(item as DeckDragItem);
      }
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
  const mobileRows = (label: string, cards: HydratedDeckCard[], remove: (card: HydratedDeckCard) => void, add: (card: HydratedDeckCard) => void, source: DeckCardListKey | ((card: HydratedDeckCard) => DeckCardListKey)) => {
    const groups = new Map<string, HydratedDeckCard[]>();
    cards.forEach((card) => {
      const key = card._id.toString();
      groups.set(key, [...(groups.get(key) ?? []), card]);
    });
    return (
      <section className="space-y-1" aria-label={label}>
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-white/75">{label} <span className="text-white/50">({cards.length})</span></h3>
        {[...groups.values()].map((group) => {
          const card = group[0];
          return <div key={card._id.toString()} className="flex min-h-11 items-center gap-2 rounded border border-white/10 bg-white/5 p-1.5">
            <button type="button" onClick={() => onInspectCard(card)} className="min-h-11 min-w-11 flex-1 break-words px-1 py-2 text-left text-sm text-white touch-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" aria-label={`Inspect ${decodeHTMLEntities(card.title)}`}><span className="block">{decodeHTMLEntities(card.title)}</span><CardStatusBadge item={getCardStatus(banlist, card.title)} /></button>
            {!readOnly && <div className="flex shrink-0 items-center gap-1" aria-label={`${decodeHTMLEntities(card.title)} quantity`}>
              <Button type="button" size="icon" variant="outline" onClick={() => remove(card)} className="size-11 border-white/20 bg-white/5 text-white" aria-label={`Remove one ${decodeHTMLEntities(card.title)}`}>−</Button>
              <span className="grid size-11 place-items-center text-sm font-semibold" aria-label={`${group.length} copies`}>{group.length}</span>
              <Button type="button" size="icon" variant="outline" onClick={() => add(card)} className="size-11 border-white/20 bg-white/5 text-white" aria-label={`Add one ${decodeHTMLEntities(card.title)}`}>+</Button>
              <Button type="button" variant="ghost" onClick={() => onRemoveAll(card, typeof source === "function" ? source(card) : source)} className="min-h-11 px-2 text-xs text-rose-200 hover:bg-rose-500/10 hover:text-rose-100" aria-label={`Remove all ${decodeHTMLEntities(card.title)}`}>All</Button>
            </div>}
          </div>;
        })}
      </section>
    );
  };
  if (isMobile) {
    return <div className="space-y-3">
      {!deck ? <LoadingState label="Loading deck…" /> : <>
        {mobileRows("Special cards", [...warlords, ...veilRealms, ...synergies, ...guardians, ...tokens], handleRemoveCardFromDeck, handleAddCardToDeck, mainSourceListForCard)}
        {mobileRows("Main deck", allMainDeckCards, handleRemoveCardFromDeck, handleAddCardToDeck, "cards_in_deck")}
        {mobileRows("Side deck", sideDeck, handleRemoveCardFromSideDeck, handleAddCardToSideDeck, "side_deck")}
        {allMainDeckCards.length + sideDeck.length + warlords.length + veilRealms.length + synergies.length + guardians.length + tokens.length === 0 && <EmptyState icon={<AppIcon name="create" size={20} />} title="No cards in deck" description="Use Find cards to inspect a card, then add it to your deck." />}
      </>}
    </div>;
  }
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
            <span>| Tokens: {tokens.length}</span>
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

              {allMainDeckCards.length === 0 && (
                <EmptyState
                  icon={<AppIcon name="create" size={20} />}
                  title="No cards in deck"
                  description="Use the search pane to add cards."
                />
              )}
            </div>
          ) : (
            (noLeftSide && allMainDeckCards.length === 0) ? (
              <EmptyState
                icon={<AppIcon name="create" size={20} />}
                title="No cards in deck"
                description="Use the search pane to add cards."
                className="h-full"
              />
            ) : (
              <>
                <div className="rounded bg-white/20 relative min-h-1/12">
                  <span className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 italic z-50 pointer-events-none bg-black/20">SPECIAL DECK CARDS</span>
                  {renderSection([...warlords, ...veilRealms, ...synergies, ...guardians, ...tokens])}
                </div>
                <div className="rounded bg-white/20 relative mt-2 min-h-1/2">
                  <span className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 italic z-50 pointer-events-none bg-black/20">MAIN DECK</span>
                  {renderSection(mainDeck)}
                </div>
              </>
            )
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
              {renderSection(sideDeck, handleSideDeckCardClick, handleAddCardToSideDeck, () => "side_deck")}
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
