import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
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
import {
  getDeckCards,
  getOrdinaryMainDeckCards,
  isCardAllowedForDeckLegion,
  isSideDeckCardTypeAllowed,
  SIDE_DECK_MAX_SIZE,
  specialDeckFieldForCardType,
} from "@/shared/deckComposition";
import { DeckPatchOperation } from "@/shared/interfaces/DeckPatch";
import { createDeckPatchQueue } from "@/client/utils/deckPatchQueue";
import { InlineStatus } from "@/client/ui/inline-status";
import { Button } from "@/client/ui/button";
import { DeckCardListKey, DeckDragItem } from "./components/CardTile";
import Modal from "@/app/components/Modals/Modal";
import CardGalleryInspector, {
  InspectableCard,
} from "@/app/cards/CardGalleryInspector";
import { useToast } from "@/app/components/ToastProvider";
import { decodeHTMLEntities } from "@/client/utils/string.util";
import { useBanlist } from "@/client/hooks/useBanlist";
import { getCardStatus } from "@/app/components/Card/CardStatusBadge";

export default function DeckBuilder() {
  const params = useParams<{ deckId: string }>();
  const [hoveredCard, setHoveredCard] = useState<HydratedDeckCard | null>(null);
  const [deck, setDeck] = useState<DeckResponse | null>(null); // TODO: Fix type - should be properly typed but DeckResponse interface doesn't match actual usage
  const [saving, setSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [deckListRefreshTrigger, setDeckListRefreshTrigger] = useState(0);
  const [addTarget, setAddTarget] = useState<"main" | "side">("main");
  const [saveError, setSaveError] = useState("");
  const [mobileTab, setMobileTab] = useState<"deck" | "find" | "details">(
    "deck",
  );
  const [inspectedCard, setInspectedCard] = useState<InspectableCard | null>(
    null,
  );
  const deckRef = useRef<DeckResponse | null>(null);
  const { showToast, dismissToast } = useToast();
  const revision = useRef(0);
  const undoToast = useRef<number>();
  const recoveringDeck = useRef<string | null>(null);
  const activeDeckId = useRef<string | null>(params.deckId);
  activeDeckId.current = params.deckId;
  const banlist = useBanlist();

  const invalidateUndo = useCallback(() => {
    revision.current += 1;
    if (undoToast.current !== undefined) dismissToast(undoToast.current);
    undoToast.current = undefined;
  }, [dismissToast]);

  const setCurrentDeck = (nextDeck: DeckResponse | null) => {
    deckRef.current = nextDeck;
    setDeck(nextDeck);
  };

  const patchQueueRef = useRef<ReturnType<
    typeof createDeckPatchQueue<
      DeckResponse,
      { deckId: string; operations: DeckPatchOperation[] }
    >
  > | null>(null);
  const queueDeckId = useRef<string>();
  if (!patchQueueRef.current || queueDeckId.current !== params.deckId) {
    queueDeckId.current = params.deckId;
    const queue = createDeckPatchQueue<
      DeckResponse,
      { deckId: string; operations: DeckPatchOperation[] }
    >(
      ({ deckId, operations }) => patchDeckById(deckId, operations),
      async (error, request) => {
        if (
          activeDeckId.current !== request.deckId ||
          patchQueueRef.current !== queue
        )
          return;
        invalidateUndo();
        recoveringDeck.current = request.deckId;
        const failedRevision = revision.current;
        const message =
          error instanceof Error ? error.message : "Unable to save deck.";
        setSaveError(message);
        const currentDeck = deckRef.current;
        if (!currentDeck) return;
        try {
          const recovered = await fetchDeckById(request.deckId);
          if (
            activeDeckId.current === request.deckId &&
            revision.current === failedRevision
          ) {
            setCurrentDeck(recovered);
            recoveringDeck.current = null;
            setSaveError(message);
          }
        } catch {
          if (
            activeDeckId.current === request.deckId &&
            patchQueueRef.current === queue
          )
            setSaveError(
              "Unable to refresh the deck after a failed save. Reload before editing again.",
            );
        }
      },
    );
    patchQueueRef.current = queue;
  }

  useEffect(() => {
    let active = true;
    activeDeckId.current = params.deckId;
    recoveringDeck.current = null;
    setCurrentDeck(null);
    setSaving(false);
    setSaveError("");
    invalidateUndo();
    setInspectedCard(null);
    const fetchDeck = async () => {
      if (!params.deckId) return;
      try {
        const loaded = await fetchDeckById(params.deckId);
        if (active) setCurrentDeck(loaded);
      } catch {
        if (active) setSaveError("Unable to load deck.");
      }
    };
    fetchDeck();
    return () => {
      active = false;
      activeDeckId.current = null;
      invalidateUndo();
      deckRef.current = null;
    };
  }, [params?.deckId, invalidateUndo]);

  // Preload deck images when deck is loaded
  useEffect(() => {
    if (!deck) return;
    const cardsToPreload = getDeckCards(deck);
    if (cardsToPreload.length) {
      try {
        preloadDeckImages(cardsToPreload);
      } catch (error) {
        console.warn("[DeckBuilder] Preload failed:", error);
      }
    }
  }, [deck]);

  const saveDeckPatch = (
    operations: DeckPatchOperation[],
    nextDeck: DeckResponse,
    onSaved?: (savedDeck: DeckResponse, mutationRevision: number) => void,
  ) => {
    const deckId = nextDeck._id.toString();
    if (activeDeckId.current !== deckId) return;
    if (recoveringDeck.current === deckId) {
      setSaveError(
        "Refreshing the deck after a failed save. Reload if this message persists.",
      );
      return;
    }
    invalidateUndo();
    const mutationRevision = revision.current;
    const queue = patchQueueRef.current!;
    setCurrentDeck(nextDeck);
    setSaving(true);
    setSaveError("");
    queue.enqueue(
      { deckId: nextDeck._id.toString(), operations },
      (savedDeck) => {
        if (activeDeckId.current !== deckId || patchQueueRef.current !== queue)
          return;
        if (revision.current === mutationRevision) {
          if (!queue.hasPending()) setCurrentDeck(savedDeck);
          setSaveError("");
        }
        onSaved?.(savedDeck, mutationRevision);
      },
    );
    void queue.whenIdle().then(() => {
      if (activeDeckId.current === deckId && patchQueueRef.current === queue)
        setSaving(false);
    });
  };

  const restoreDeck = (previousDeck: DeckResponse) => {
    const currentDeck = deckRef.current;
    if (!currentDeck) return;
    const fields = [
      "cards_in_deck",
      "side_deck",
      "warlords",
      "synergies",
      "veilRealms",
      "guardians",
      "tokens",
    ] as const;
    saveDeckPatch(
      fields.map((field) => ({
        op: "replace" as const,
        path: `/${field}`,
        value: (previousDeck[field] ?? []).map((id) => id.toString()),
      })),
      previousDeck,
    );
  };

  const saveCompositionChange = (
    operations: DeckPatchOperation[],
    nextDeck: DeckResponse,
    label: string,
    previousDeck: DeckResponse,
  ) => {
    saveDeckPatch(operations, nextDeck, (_savedDeck, mutationRevision) => {
      if (revision.current !== mutationRevision) return;
      const savedRevision = revision.current;
      const deckId = nextDeck._id.toString();
      undoToast.current = showToast({
        label,
        actionLabel: "Undo",
        onAction: () => {
          if (
            activeDeckId.current !== deckId ||
            revision.current !== savedRevision
          )
            return;
          restoreDeck(previousDeck);
        },
      });
    });
  };

  const lastCardIndexById = (cards, cardId) => {
    return cards.findLastIndex((item) => item.toString() === cardId.toString());
  };

  const includeCardMetadata = (
    currentDeck: DeckResponse,
    card: CardDocument,
  ): HydratedDeckCard[] => {
    const existingCards = currentDeck.cards ?? [];
    return existingCards.some(
      (existing) => existing._id.toString() === card._id.toString(),
    )
      ? existingCards
      : [...existingCards, card];
  };

  const handleRemoveCardFromDeck = (card) => {
    const currentDeck = deckRef.current;
    if (!currentDeck) return;
    const field = specialDeckFieldForCardType(card.card_type?.names?.[0]);
    const cards = field ? currentDeck[field] : currentDeck.cards_in_deck;
    const cardIndex = lastCardIndexById(cards, card._id);
    if (cardIndex < 0) return;

    saveCompositionChange(
      [{ op: "remove", path: `/${field ?? "cards_in_deck"}/${cardIndex}` }],
      field
        ? {
            ...currentDeck,
            [field]: cards.filter((_, index) => index !== cardIndex),
          }
        : {
            ...currentDeck,
            cards_in_deck: cards.filter((_, index) => index !== cardIndex),
          },
      `Removed ${decodeHTMLEntities(card.title)}`,
      currentDeck,
    );
  };

  const handleAddCardToDeck = (card) => {
    const currentDeck = deckRef.current;
    if (!currentDeck || !card) return;
    if (!isCardAllowedForDeckLegion(card, currentDeck.legion)) {
      setSaveError(
        `${card.title} is not valid for the ${currentDeck.legion} legion.`,
      );
      return;
    }
    const field = specialDeckFieldForCardType(card.card_type?.names?.[0]);
    const cards = field ? currentDeck[field] : currentDeck.cards_in_deck;
    saveCompositionChange(
      [
        {
          op: "add",
          path: `/${field ?? "cards_in_deck"}/-`,
          value: card._id.toString(),
        },
      ],
      field
        ? {
            ...currentDeck,
            [field]: [...cards, card._id],
            cards: includeCardMetadata(currentDeck, card),
          }
        : {
            ...currentDeck,
            cards_in_deck: [...cards, card._id],
            cards: includeCardMetadata(currentDeck, card),
          },
      `Added ${decodeHTMLEntities(card.title)}`,
      currentDeck,
    );
  };

  const handleRemoveCardFromSideDeck = (card) => {
    const currentDeck = deckRef.current;
    if (!currentDeck) return;
    const sideDeck = currentDeck.side_deck ?? [];
    const cardIndex = lastCardIndexById(sideDeck, card._id);
    if (cardIndex < 0) return;

    saveCompositionChange(
      [{ op: "remove", path: `/side_deck/${cardIndex}` }],
      {
        ...currentDeck,
        side_deck: sideDeck.filter((_, index) => index !== cardIndex),
      },
      `Removed ${decodeHTMLEntities(card.title)}`,
      currentDeck,
    );
  };

  const handleRemoveAllCards = (
    card: HydratedDeckCard,
    source: DeckCardListKey,
  ) => {
    const currentDeck = deckRef.current;
    if (!currentDeck) return;
    const cards = currentDeck[source] ?? [];
    const indexes = cards
      .map((entry, index) =>
        entry.toString() === card._id.toString() ? index : -1,
      )
      .filter((index) => index >= 0);
    if (!indexes.length) return;
    saveCompositionChange(
      indexes.reverse().map((index) => ({
        op: "remove" as const,
        path: `/${source}/${index}`,
      })),
      {
        ...currentDeck,
        [source]: cards.filter(
          (entry) => entry.toString() !== card._id.toString(),
        ),
      },
      `Removed all ${decodeHTMLEntities(card.title)}`,
      currentDeck,
    );
  };

  const getSideDeckMoveError = (
    card: HydratedDeckCard,
    currentDeck = deckRef.current,
  ): string | null => {
    if (!currentDeck) return "Unable to update deck.";
    const sideDeck = currentDeck.side_deck ?? [];
    if (sideDeck.length >= SIDE_DECK_MAX_SIZE)
      return `A side deck can contain at most ${SIDE_DECK_MAX_SIZE} cards.`;
    if (!isSideDeckCardTypeAllowed(card))
      return `${card.title} cannot be placed in a side deck.`;
    if (!isCardAllowedForDeckLegion(card, currentDeck.legion))
      return `${card.title} is not valid for the ${currentDeck.legion} legion.`;
    return null;
  };

  const handleAddCardToSideDeck = (card) => {
    const currentDeck = deckRef.current;
    if (!currentDeck || !card) return;
    const error = getSideDeckMoveError(card, currentDeck);
    if (error) {
      setSaveError(error);
      return;
    }
    const sideDeck = currentDeck.side_deck ?? [];

    saveCompositionChange(
      [{ op: "add", path: "/side_deck/-", value: card._id.toString() }],
      {
        ...currentDeck,
        side_deck: [...sideDeck, card._id],
        cards: includeCardMetadata(currentDeck, card),
      },
      `Added ${decodeHTMLEntities(card.title)}`,
      currentDeck,
    );
  };

  const moveDeckCard = (item: DeckDragItem, destination: "main" | "side") => {
    const currentDeck = deckRef.current;
    if (!currentDeck) return;

    const { card, sourceList } = item;
    const destinationList: DeckCardListKey =
      destination === "side"
        ? "side_deck"
        : (specialDeckFieldForCardType(card.card_type?.names?.[0]) ??
          "cards_in_deck");
    if (sourceList === destinationList) return;

    if (destination === "side") {
      const error = getSideDeckMoveError(card, currentDeck);
      if (error) {
        setSaveError(error);
        return;
      }
    }

    const sourceCards = currentDeck[sourceList] ?? [];
    const sourceIndex = lastCardIndexById(sourceCards, card._id);
    if (sourceIndex < 0) return;
    const destinationCards = currentDeck[destinationList] ?? [];

    saveDeckPatch(
      [
        { op: "remove", path: `/${sourceList}/${sourceIndex}` },
        {
          op: "add",
          path: `/${destinationList}/-`,
          value: card._id.toString(),
        },
      ],
      {
        ...currentDeck,
        [sourceList]: sourceCards.filter((_, index) => index !== sourceIndex),
        [destinationList]: [...destinationCards, card._id],
      },
    );
  };

  const handleSortClick = () => {
    const currentDeck = deckRef.current;
    if (!currentDeck) return;
    const cards = getOrdinaryMainDeckCards(currentDeck);
    const counts = {};
    cards.forEach((card) => {
      const cardId = card._id.toString();
      counts[cardId] = (counts[cardId] || 0) + 1;
    });
    const warriors = cards.filter(
      (item) => item?.card_type?.names?.[0] === CARD_TYPE.WARRIOR,
    );
    const unifieds = cards.filter(
      (item) => item?.card_type?.names?.[0] === CARD_TYPE.UNIFIED,
    );
    const fortifieds = cards.filter(
      (item) => item?.card_type?.names?.[0] === CARD_TYPE.FORTIFIED,
    );
    const restOfDeck = cards.filter(
      (item) =>
        ![
          CARD_TYPE.WARRIOR.toString(),
          CARD_TYPE.UNIFIED.toString(),
          CARD_TYPE.FORTIFIED.toString(),
        ].includes(item?.card_type?.names?.[0]),
    );
    const sortedDeck = {
      ...currentDeck,
      cards_in_deck: [
        ...warriors.sort((a, b) => {
          return counts[b._id.toString()] - counts[a._id.toString()];
        }),
        ...unifieds.sort((a, b) => {
          return counts[b._id.toString()] - counts[a._id.toString()];
        }),
        ...fortifieds.sort((a, b) => {
          return counts[b._id.toString()] - counts[a._id.toString()];
        }),
        ...restOfDeck.sort((a, b) => {
          return counts[b._id.toString()] - counts[a._id.toString()];
        }),
      ].map((card) => card._id),
    };
    saveDeckPatch(
      [
        {
          op: "replace",
          path: "/cards_in_deck",
          value: sortedDeck.cards_in_deck.map((id) => id.toString()),
        },
      ],
      sortedDeck,
    );
  };

  const handleStartEditingName = () => {
    setEditedName(deck?.name || "");
    setIsEditingName(true);
  };

  const handleCancelEditingName = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const handleSaveDeckName = () => {
    const nextName = editedName.trim();
    const currentDeck = deckRef.current;
    if (!currentDeck || !nextName || nextName === currentDeck.name) {
      handleCancelEditingName();
      return;
    }

    saveDeckPatch(
      [{ op: "replace", path: "/name", value: nextName }],
      { ...currentDeck, name: nextName },
      (savedDeck) => {
        setIsEditingName(false);
        setEditedName("");
        if (savedDeck.name !== currentDeck.name) {
          setDeckListRefreshTrigger((previous) => previous + 1);
        }
      },
    );
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveDeckName();
    } else if (e.key === "Escape") {
      handleCancelEditingName();
    }
  };

  const [{ isOverDeck, canDropDeck }, deckDrop] = useDrop(
    () => ({
      accept: ["cardFromDeck", "cardFromSearch"],
      drop: (item: CardDocument, monitor) => {
        if (monitor.didDrop()) return;
        const itemType = monitor.getItemType();

        if (itemType === "cardFromDeck") {
          moveDeckCard(item as unknown as DeckDragItem, "main");
        } else if (itemType === "cardFromSearch") {
          if (addTarget === "side") handleAddCardToSideDeck(item);
          else handleAddCardToDeck(item);
        }
      },
      canDrop: (item, monitor) => {
        const itemType = monitor.getItemType();
        return (
          itemType === "cardFromSearch" ||
          (itemType === "cardFromDeck" &&
            (item as unknown as DeckDragItem).sourceList === "side_deck")
        );
      },
      collect: (monitor) => ({
        isOverDeck:
          monitor.isOver() &&
          (monitor.getItemType() === "cardFromSearch" ||
            monitor.getItemType() === "cardFromDeck"),
        canDropDeck: monitor.canDrop(),
      }),
    }),
    [addTarget, handleAddCardToDeck, handleAddCardToSideDeck, moveDeckCard],
  );

  const [{ isOverSearchPane, canDropSearch }, searchPaneDrop] = useDrop(
    () => ({
      accept: ["cardFromDeck", "cardFromSearch"],
      canDrop: (item, monitor) => {
        const itemType = monitor.getItemType();
        return itemType === "cardFromDeck";
      },
      drop: (item: CardDocument, monitor) => {
        const itemType = monitor.getItemType();

        if (itemType === "cardFromDeck") {
          const deckItem = item as unknown as DeckDragItem;
          if (deckItem.sourceList === "side_deck") {
            handleRemoveCardFromSideDeck(deckItem.card);
          } else {
            handleRemoveCardFromDeck(deckItem.card);
          }
        } else if (itemType === "cardFromSearch") {
          // Handle card dropped within search results (no action needed)
        }
      },
      collect: (monitor) => ({
        isOverSearchPane:
          monitor.isOver() && monitor.getItemType() === "cardFromDeck",
        canDropSearch: monitor.canDrop(),
      }),
    }),
    [handleRemoveCardFromDeck, handleRemoveCardFromSideDeck],
  );
  const attachDeckDropTarget = (node: HTMLDivElement | null) => {
    deckDrop(node);
  };
  const attachSearchPaneDropTarget = (node: HTMLDivElement | null) => {
    searchPaneDrop(node);
  };
  const isMobile = useIsMobile();
  return (
    <FullPage showBreadcrumbs={false}>
      <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-2">
        {isMobile && <div className="w-full h-6"></div>}
        <div className="h-auto">
          <DeckEditorHeader
            deck={deck}
            isEditingName={isEditingName}
            editedName={editedName}
            saving={saving}
            saveStatus={
              saving
                ? "Saving…"
                : saveError
                  ? "Save failed"
                  : deck
                    ? "Saved"
                    : ""
            }
            onStartEditingName={handleStartEditingName}
            onCancelEditingName={handleCancelEditingName}
            onSaveDeckName={handleSaveDeckName}
            onNameChange={setEditedName}
            onNameKeyPress={handleNameKeyPress}
            deckListRefreshTrigger={deckListRefreshTrigger}
          />
        </div>
        {saveError && (
          <InlineStatus variant="error" className="mb-2 text-center">
            {saveError}
          </InlineStatus>
        )}
        {isMobile && (
          <div
            className="grid grid-cols-3 gap-1 rounded border border-white/15 bg-slate-950/50 p-1"
            role="tablist"
            aria-label="Deck builder sections"
          >
            {(
              [
                ["deck", "Deck"],
                ["find", "Find cards"],
                ["details", "Details"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                role="tab"
                aria-selected={mobileTab === value}
                onClick={() => setMobileTab(value)}
                className={`min-h-11 px-1 text-xs ${mobileTab === value ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-transparent text-white/70 hover:bg-white/10"}`}
              >
                {label}
              </Button>
            ))}
          </div>
        )}

        {/* Main Content Area - Takes remaining space */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto gap-2 lg:flex-row lg:overflow-hidden">
          {/* Deck Grid Pane - Full width on mobile, left side on large screens */}
          <div
            ref={attachDeckDropTarget}
            className={`relative order-1 min-h-[320px] min-w-0 flex-[2] border border-white/15 bg-[rgba(4,9,14,.56)] p-1.5 shadow-[0_14px_32px_rgba(0,0,0,.2)] sm:p-2 lg:min-h-0 lg:flex-[3] ${isMobile && mobileTab !== "deck" ? "hidden lg:block" : ""}`}
          >
            {canDropDeck && (
              <div
                className={`pointer-events-none absolute z-10 size-full border-3 border-dashed border-white ${isOverDeck ? "bg-green-600/30" : "bg-green-800/30"}`}
              />
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
              getSideDeckMoveError={getSideDeckMoveError}
              onMoveCardToSideDeck={(item) => moveDeckCard(item, "side")}
              onInspectCard={setInspectedCard}
              onRemoveAll={(card, source) => handleRemoveAllCards(card, source)}
              banlist={banlist}
            />
          </div>

          {/* Right Sidebar - Search and Preview on large screens */}
          <div
            ref={attachSearchPaneDropTarget}
            className={`relative order-2 flex min-h-[320px] min-w-0 flex-none flex-col gap-2 border border-white/15 bg-[rgba(3,8,13,.72)] p-1.5 shadow-[0_14px_32px_rgba(0,0,0,.2)] sm:p-2 lg:min-h-0 lg:flex-1 lg:w-80 xl:w-96 ${isMobile && mobileTab !== "find" ? "hidden lg:flex" : ""}`}
          >
            {canDropSearch && (
              <div
                className={`pointer-events-none absolute z-10 size-full border-3 border-dashed border-white ${isOverSearchPane ? "bg-red-600/30" : "bg-red-800/30"}`}
              />
            )}
            {/* Preview Pane - Only show on large screens */}
            <div className="hidden lg:block h-1/3 max-h-1/3">
              <Preview hoveredCard={hoveredCard} />
            </div>

            {/* Search Pane - Responsive height to prevent overlap on small screens */}
            <div className="lg:h-2/3 lg:overflow-hidden">
              <SearchPane
                setHoveredCard={setHoveredCard}
                handleAddCardToDeck={
                  addTarget === "side"
                    ? handleAddCardToSideDeck
                    : handleAddCardToDeck
                }
                deckLegion={deck?.legion || null}
                addTarget={addTarget}
                onAddTargetChange={setAddTarget}
                onInspectCard={(card) => setInspectedCard(card)}
              />
            </div>
          </div>
          {isMobile && mobileTab === "details" && (
            <section className="order-1 min-h-[320px] rounded border border-white/15 bg-[rgba(4,9,14,.56)] p-4 text-sm text-white">
              <h2 className="text-lg font-semibold">Deck details</h2>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-white/60">Name</dt>
                  <dd className="break-words">{deck?.name ?? "Loading…"}</dd>
                </div>
                <div>
                  <dt className="text-white/60">Legion</dt>
                  <dd>{deck?.legion ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/60">Save status</dt>
                  <dd>
                    {saving ? "Saving…" : saveError ? "Save failed" : "Saved"}
                  </dd>
                </div>
              </dl>
            </section>
          )}
        </div>
        <Modal
          open={Boolean(inspectedCard)}
          closeModal={() => setInspectedCard(null)}
          variant="bottom-sheet"
          ariaLabel="Card details"
          modalHeader={
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-white">
                Card details
              </span>
              <button
                type="button"
                onClick={() => setInspectedCard(null)}
                className="size-11 text-xl text-white"
                aria-label="Close card details"
              >
                ×
              </button>
            </div>
          }
          modalContent={
            <CardGalleryInspector
              compact
              card={inspectedCard}
              banlistItem={
                inspectedCard
                  ? getCardStatus(banlist, inspectedCard.title)
                  : null
              }
            />
          }
          modalFooter={
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInspectedCard(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (inspectedCard) {
                    if (addTarget === "side")
                      handleAddCardToSideDeck(inspectedCard);
                    else handleAddCardToDeck(inspectedCard);
                  }
                }}
              >
                Add to {addTarget === "side" ? "side deck" : "deck"}
              </Button>
            </div>
          }
        />
      </div>
    </FullPage>
  );
}
