
import React, { useEffect, useState } from "react";
import { useParams } from 'next/navigation'
import { CardDocument } from "@/shared/interfaces/Card.mongo";
import Preview from "./Preview";
import DeckGrid from "./components/DeckGrid";
import SearchPane from "./components/SearchPane";
import DeckEditorHeader from "./components/DeckEditorHeader";
import { fetchDeckById, patchDeckById } from "@/client/utils/api.utils";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import { preloadDeckImages } from "@/client/utils/imagePreloader";
import FullPage from "@/app/components/FullPage";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { useDrop } from "react-dnd";
import useIsMobile from "@/client/hooks/useIsMobile";
import { getDeckCards, isCardAllowedForDeckLegion, isSideDeckCardTypeAllowed, SIDE_DECK_MAX_SIZE } from "@/shared/deckComposition";

export default function DeckBuilder() {
  const params = useParams<{ deckId: string }>()
  const [hoveredCard, setHoveredCard] = useState<CardDocument | null>(null);
  const [deck, setDeck] = useState<DeckResponse | null>(null); // TODO: Fix type - should be properly typed but DeckResponse interface doesn't match actual usage
  const [saving, setSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [deckListRefreshTrigger, setDeckListRefreshTrigger] = useState(0);
  const [addTarget, setAddTarget] = useState<"main" | "side">("main");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const fetchDeck = async () => {
      if (!params.deckId) return;
      fetchDeckById(params.deckId, (data) => setDeck(data as DeckResponse));
    }
    fetchDeck();
    return () => { setDeck(null) };
  }, [params?.deckId]);

  // Preload deck images when deck is loaded
  useEffect(() => {
    if (!deck) return;
    const cardsToPreload = getDeckCards(deck);
    if (cardsToPreload.length) {
      try {
        preloadDeckImages(cardsToPreload);
      } catch (error) {
        console.warn('[DeckBuilder] Preload failed:', error);
      }
    }
  }, [deck]);

  const saveDeck = (nextDeck: DeckResponse, onSaved?: (savedDeck: DeckResponse) => void) => {
    const { cards_in_deck, side_deck, name } = nextDeck;
    setSaving(true);
    patchDeckById(nextDeck._id.toString(), {cards_in_deck, side_deck, name}, (deckRes) => {
      const savedDeck = deckRes as DeckResponse;
      setDeck(savedDeck);
      setSaving(false);
      setSaveError("");
      onSaved?.(savedDeck);
    }, (message) => {
      setSaveError(message);
      setSaving(false);
    });
  };

  const removeLastCardById = (cards, cardId) => {
    const cardIndex = cards.findLastIndex((item) => item.id === cardId);
    return cardIndex < 0 ? cards : cards.filter((_, index) => index !== cardIndex);
  };

  const handleRemoveCardFromDeck = (card) => {
    if (!deck) return;
    const cardsInDeck = removeLastCardById(deck.cards_in_deck, card.id);
    if (cardsInDeck.length === deck.cards_in_deck.length) return;

    saveDeck({ ...deck, cards_in_deck: cardsInDeck });
  };

  const handleAddCardToDeck = (card) => {
    if (!deck || !card) return;
    saveDeck({ ...deck, cards_in_deck: [...deck.cards_in_deck, card] });
  };

  const handleRemoveCardFromSideDeck = (card) => {
    const sideDeck = deck?.side_deck ?? [];
    const nextSideDeck = removeLastCardById(sideDeck, card.id);
    if (nextSideDeck.length === sideDeck.length || !deck) return;

    saveDeck({ ...deck, side_deck: nextSideDeck });
  };

  const handleAddCardToSideDeck = (card) => {
    if (!deck || !card) return;
    const sideDeck = deck.side_deck ?? [];
    if (sideDeck.length >= SIDE_DECK_MAX_SIZE) {
      setSaveError(`A side deck can contain at most ${SIDE_DECK_MAX_SIZE} cards.`);
      return;
    }
    if (!isSideDeckCardTypeAllowed(card)) {
      setSaveError(`${card.title} cannot be placed in a side deck.`);
      return;
    }
    if (!isCardAllowedForDeckLegion(card, deck.legion)) {
      setSaveError(`${card.title} is not valid for the ${deck.legion} legion.`);
      return;
    }

    saveDeck({ ...deck, side_deck: [...sideDeck, card] });
  };

  const handleSortClick = () => {
    if (!deck) return;
    const counts = {};
    deck.cards_in_deck.forEach(card => {
      counts[card.id] = (counts[card.id] || 0) + 1;
    });
    const warriors = deck.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.WARRIOR);
    const unifieds = deck.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.UNIFIED);
    const fortifieds = deck.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.FORTIFIED);
    const restOfDeck = deck.cards_in_deck.filter(item => ![CARD_TYPE.WARRIOR.toString(), CARD_TYPE.UNIFIED.toString(), CARD_TYPE.FORTIFIED.toString()].includes(item?.card_type?.names?.[0]));
    const sortedDeck = {
      ...deck,
      cards_in_deck: [...warriors.sort((a, b) => {
        return counts[b.id] - counts[a.id];
      }), ...unifieds.sort((a, b) => {
        return counts[b.id] - counts[a.id];
      }), ...fortifieds.sort((a, b) => {
        return counts[b.id] - counts[a.id];
      }), ...restOfDeck.sort((a, b) => {
        return counts[b.id] - counts[a.id];
      })]

    };
    saveDeck(sortedDeck);
  };

  const handleStartEditingName = () => {
    setEditedName(deck?.name || '');
    setIsEditingName(true);
  }

  const handleCancelEditingName = () => {
    setIsEditingName(false);
    setEditedName('');
  }

  const handleSaveDeckName = () => {
    const nextName = editedName.trim();
    if (!deck || !nextName || nextName === deck.name) {
      handleCancelEditingName();
      return;
    }

    saveDeck({ ...deck, name: nextName }, (savedDeck) => {
      setIsEditingName(false);
      setEditedName('');
      if (savedDeck.name !== deck.name) {
        setDeckListRefreshTrigger((previous) => previous + 1);
      }
    });
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveDeckName();
    } else if (e.key === 'Escape') {
      handleCancelEditingName();
    }
  }

  const [{ isOverDeck, canDropDeck }, deckDrop] = useDrop(() => ({
    accept: ["cardFromDeck", "cardFromSearch"],
    drop: (item: CardDocument, monitor) => {
      if (monitor.didDrop()) return;
      const itemType = monitor.getItemType();
      
      if (itemType === 'cardFromDeck') {
        // Handle card dropped from deck (e.g., reordering within deck)
      } else if (itemType === 'cardFromSearch') {
        if (addTarget === "side") handleAddCardToSideDeck(item);
        else handleAddCardToDeck(item);
      }
    },
    canDrop: (item, monitor) => {
      const itemType = monitor.getItemType();
      return itemType === 'cardFromSearch';
    },
    collect: (monitor) => ({
      isOverDeck: monitor.isOver() && monitor.getItemType() === 'cardFromSearch',
      canDropDeck: monitor.canDrop()
    })
  }), [addTarget, handleAddCardToDeck, handleAddCardToSideDeck]);

  const [{ isOverSearchPane, canDropSearch }, searchPaneDrop] = useDrop(() => ({
    accept: ["cardFromDeck", "cardFromSearch"],
    canDrop: (item, monitor) => {
      const itemType = monitor.getItemType();
      return itemType === 'cardFromDeck';
    },
    drop: (item: CardDocument, monitor) => {
      const itemType = monitor.getItemType();
      
      if (itemType === 'cardFromDeck') {
        handleRemoveCardFromDeck(item);
      } else if (itemType === 'cardFromSearch') {
        // Handle card dropped within search results (no action needed)
      }
    },
    collect: (monitor) => ({
      isOverSearchPane: monitor.isOver() && monitor.getItemType() === 'cardFromDeck',
      canDropSearch: monitor.canDrop()
    })
  }), [handleRemoveCardFromDeck]);
  const attachDeckDropTarget = (node: HTMLDivElement | null) => {
    deckDrop(node);
  };
  const attachSearchPaneDropTarget = (node: HTMLDivElement | null) => {
    searchPaneDrop(node);
  };
  const isMobile = useIsMobile();
  return (
    <FullPage showBreadcrumbs={true}>
      {isMobile && (
        <div className="w-full h-6"></div>
      )}
      <div className="h-auto mb-1">
        <DeckEditorHeader
          deck={deck}
          isEditingName={isEditingName}
          editedName={editedName}
          saving={saving}
          onStartEditingName={handleStartEditingName}
          onCancelEditingName={handleCancelEditingName}
          onSaveDeckName={handleSaveDeckName}
          onNameChange={setEditedName}
          onNameKeyPress={handleNameKeyPress}
          deckListRefreshTrigger={deckListRefreshTrigger}
        />
      </div>
      {saveError && <p role="alert" className="mb-2 rounded border border-red-300/50 bg-red-950/40 px-3 py-2 text-center text-sm text-red-100">{saveError}</p>}

      {/* Main Content Area - Takes remaining space */}
      <div className="flex-1 min-h-0 flex flex-col-reverse lg:flex-row gap-2">
        {/* Deck Grid Pane - Full width on mobile, left side on large screens */}
        <div ref={attachDeckDropTarget} className={["flex-2 lg:flex-3 min-h-0 order-1 lg:order-1 relative"].join(" ")}>
            {canDropDeck && (
            <div className={["pointer-events-none absolute w-full h-full z-10 border-3 border-white border-dashed", isOverDeck ? "bg-green-600/30" : "bg-green-800/30"].join(" ")}></div>
          )}
            <DeckGrid
              deck={deck}
              setHoveredCard={setHoveredCard}
              handleRemoveCardFromDeck={handleRemoveCardFromDeck}
              handleSortClick={handleSortClick}
              saving={saving}
              handleAddCardToDeck={handleAddCardToDeck}
              handleRemoveCardFromSideDeck={handleRemoveCardFromSideDeck}
              handleAddCardToSideDeck={handleAddCardToSideDeck}
            />
        </div>

        {/* Right Sidebar - Search and Preview on large screens */}
        <div ref={attachSearchPaneDropTarget} className={["flex flex-1 lg:flex-1 flex-col gap-2 order-2 lg:order-2 lg:w-80 xl:w-96 relative"].join(" ")}>
          {canDropSearch && (
            <div className={["pointer-events-none absolute w-full h-full z-10 border-3 border-white border-dashed", isOverSearchPane ? "bg-red-600/30" : "bg-red-800/30"].join(" ")}></div>
          )}
          {/* Preview Pane - Only show on large screens */}
          <div className="hidden lg:block h-1/3 max-h-1/3">
            <Preview hoveredCard={hoveredCard} />
          </div>

          {/* Search Pane - Responsive height to prevent overlap on small screens */}
          <div className="h-full lg:h-2/3 overflow-hidden">
            <SearchPane
              setHoveredCard={setHoveredCard}
              handleAddCardToDeck={addTarget === "side" ? handleAddCardToSideDeck : handleAddCardToDeck}
              deckLegion={deck?.legion || null}
              addTarget={addTarget}
              onAddTargetChange={setAddTarget}
            />
          </div>
        </div>
      </div>
    </FullPage>
  );
}
