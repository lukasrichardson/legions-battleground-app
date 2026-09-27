
import React, { useEffect, useRef, useState } from "react";
import { useParams } from 'next/navigation'
import { CardDocument } from "@/shared/interfaces/Card.mongo";
import Preview from "./Preview";
import DeckGrid from "./components/DeckGrid";
import SearchPane from "./components/SearchPane";
import DeckEditorHeader from "./components/DeckEditorHeader";
import { fetchDeckById, patchDeckById } from "@/client/utils/api.utils";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import { HydratedDeckCard } from "@/shared/interfaces/DeckResponse";
import { preloadDeckImages } from "@/client/utils/imagePreloader";
import FullPage from "@/app/components/FullPage";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { useDrop } from "react-dnd";
import useIsMobile from "@/client/hooks/useIsMobile";
import { getDeckCards, getMainDeckCards, isCardAllowedForDeckLegion, isSideDeckCardTypeAllowed, SIDE_DECK_MAX_SIZE } from "@/shared/deckComposition";
import { DeckPatchOperation } from "@/shared/interfaces/DeckPatch";
import { createDeckPatchQueue } from "@/client/utils/deckPatchQueue";

export default function DeckBuilder() {
  const params = useParams<{ deckId: string }>()
  const [hoveredCard, setHoveredCard] = useState<HydratedDeckCard | null>(null);
  const [deck, setDeck] = useState<DeckResponse | null>(null); // TODO: Fix type - should be properly typed but DeckResponse interface doesn't match actual usage
  const [saving, setSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [deckListRefreshTrigger, setDeckListRefreshTrigger] = useState(0);
  const [addTarget, setAddTarget] = useState<"main" | "side">("main");
  const [saveError, setSaveError] = useState("");
  const deckRef = useRef<DeckResponse | null>(null);

  const setCurrentDeck = (nextDeck: DeckResponse | null) => {
    deckRef.current = nextDeck;
    setDeck(nextDeck);
  };

  const patchQueueRef = useRef<ReturnType<typeof createDeckPatchQueue<DeckResponse, { deckId: string; operations: DeckPatchOperation[] }>> | null>(null);
  if (!patchQueueRef.current) {
    patchQueueRef.current = createDeckPatchQueue(
      ({ deckId, operations }) => patchDeckById(deckId, operations),
      async (error) => {
        const message = error instanceof Error ? error.message : "Unable to save deck.";
        setSaveError(message);
        const currentDeck = deckRef.current;
        if (!currentDeck) return;
        try {
          setCurrentDeck(await fetchDeckById(currentDeck._id.toString()));
        } catch {
          // Retain the optimistic deck when the recovery read also fails.
        }
      },
    );
  }

  useEffect(() => {
    const fetchDeck = async () => {
      if (!params.deckId) return;
      try {
        setCurrentDeck(await fetchDeckById(params.deckId));
      } catch {
        setSaveError("Unable to load deck.");
      }
    }
    fetchDeck();
    return () => { setCurrentDeck(null) };
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

  const saveDeckPatch = (operations: DeckPatchOperation[], nextDeck: DeckResponse, onSaved?: (savedDeck: DeckResponse) => void) => {
    const queue = patchQueueRef.current!;
    setCurrentDeck(nextDeck);
    setSaving(true);
    setSaveError("");
    queue.enqueue({ deckId: nextDeck._id.toString(), operations }, (savedDeck) => {
      if (!queue.hasPending()) setCurrentDeck(savedDeck);
      setSaveError("");
      onSaved?.(savedDeck);
    });
    void queue.whenIdle().then(() => setSaving(false));
  };

  const lastCardIndexById = (cards, cardId) => {
    return cards.findLastIndex((item) => item.toString() === cardId.toString());
  };

  const includeCardMetadata = (currentDeck: DeckResponse, card: CardDocument): HydratedDeckCard[] => {
    const existingCards = currentDeck.cards ?? [];
    return existingCards.some((existing) => existing._id.toString() === card._id.toString())
      ? existingCards
      : [...existingCards, card as unknown as HydratedDeckCard];
  };

  const handleRemoveCardFromDeck = (card) => {
    const currentDeck = deckRef.current;
    if (!currentDeck) return;
    const cardIndex = lastCardIndexById(currentDeck.cards_in_deck, card._id);
    if (cardIndex < 0) return;

    saveDeckPatch(
      [{ op: "remove", path: `/cards_in_deck/${cardIndex}` }],
      { ...currentDeck, cards_in_deck: currentDeck.cards_in_deck.filter((_, index) => index !== cardIndex) },
    );
  };

  const handleAddCardToDeck = (card) => {
    const currentDeck = deckRef.current;
    if (!currentDeck || !card) return;
    saveDeckPatch(
      [{ op: "add", path: "/cards_in_deck/-", value: card._id.toString() }],
      { ...currentDeck, cards_in_deck: [...currentDeck.cards_in_deck, card._id], cards: includeCardMetadata(currentDeck, card) },
    );
  };

  const handleRemoveCardFromSideDeck = (card) => {
    const currentDeck = deckRef.current;
    if (!currentDeck) return;
    const sideDeck = currentDeck.side_deck ?? [];
    const cardIndex = lastCardIndexById(sideDeck, card._id);
    if (cardIndex < 0) return;

    saveDeckPatch(
      [{ op: "remove", path: `/side_deck/${cardIndex}` }],
      { ...currentDeck, side_deck: sideDeck.filter((_, index) => index !== cardIndex) },
    );
  };

  const handleAddCardToSideDeck = (card) => {
    const currentDeck = deckRef.current;
    if (!currentDeck || !card) return;
    const sideDeck = currentDeck.side_deck ?? [];
    if (sideDeck.length >= SIDE_DECK_MAX_SIZE) {
      setSaveError(`A side deck can contain at most ${SIDE_DECK_MAX_SIZE} cards.`);
      return;
    }
    if (!isSideDeckCardTypeAllowed(card)) {
      setSaveError(`${card.title} cannot be placed in a side deck.`);
      return;
    }
    if (!isCardAllowedForDeckLegion(card, currentDeck.legion)) {
      setSaveError(`${card.title} is not valid for the ${currentDeck.legion} legion.`);
      return;
    }

    saveDeckPatch(
      [{ op: "add", path: "/side_deck/-", value: card._id.toString() }],
      { ...currentDeck, side_deck: [...sideDeck, card._id], cards: includeCardMetadata(currentDeck, card) },
    );
  };

  const handleSortClick = () => {
    const currentDeck = deckRef.current;
    if (!currentDeck) return;
    const cards = getMainDeckCards(currentDeck);
    const counts = {};
    cards.forEach(card => {
      const cardId = card._id.toString();
      counts[cardId] = (counts[cardId] || 0) + 1;
    });
    const warriors = cards.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.WARRIOR);
    const unifieds = cards.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.UNIFIED);
    const fortifieds = cards.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.FORTIFIED);
    const restOfDeck = cards.filter(item => ![CARD_TYPE.WARRIOR.toString(), CARD_TYPE.UNIFIED.toString(), CARD_TYPE.FORTIFIED.toString()].includes(item?.card_type?.names?.[0]));
    const sortedDeck = {
      ...currentDeck,
      cards_in_deck: [...warriors.sort((a, b) => {
        return counts[b._id.toString()] - counts[a._id.toString()];
      }), ...unifieds.sort((a, b) => {
        return counts[b._id.toString()] - counts[a._id.toString()];
      }), ...fortifieds.sort((a, b) => {
        return counts[b._id.toString()] - counts[a._id.toString()];
      }), ...restOfDeck.sort((a, b) => {
        return counts[b._id.toString()] - counts[a._id.toString()];
      })].map(card => card._id)

    };
    saveDeckPatch(
      [{ op: "replace", path: "/cards_in_deck", value: sortedDeck.cards_in_deck.map((id) => id.toString()) }],
      sortedDeck,
    );
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
    const currentDeck = deckRef.current;
    if (!currentDeck || !nextName || nextName === currentDeck.name) {
      handleCancelEditingName();
      return;
    }

    saveDeckPatch([{ op: "replace", path: "/name", value: nextName }], { ...currentDeck, name: nextName }, (savedDeck) => {
      setIsEditingName(false);
      setEditedName('');
      if (savedDeck.name !== currentDeck.name) {
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
