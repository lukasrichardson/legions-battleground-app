import { CardDocument } from "@/shared/interfaces/Card.mongo";
import BanlistItem from "@/shared/interfaces/BanlistItem.mongo";
import { useCallback, useEffect, useState } from "react";
import SearchPane from "../decks/[deckId]/components/SearchPane";
import FullPage from "../components/FullPage";
import Modal from "../components/Modals/Modal";
import CardGalleryInspector from "./CardGalleryInspector";

type SelectedCard = { card: CardDocument; banlistItem: BanlistItem | null };

export const CardGallery = () => {
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);
  const [hoveredCard, setHoveredCard] = useState<SelectedCard | null>(null);
  const [detailModalVariant, setDetailModalVariant] = useState<"bottom-sheet" | "constrained-dialog" | null>(null);
  const preview = selectedCard ?? hoveredCard;
  const clearSelectedCard = useCallback(() => setSelectedCard(null), []);
  const handleSelectCard = useCallback((card: CardDocument, banlistItem: BanlistItem | null) => {
    // A gallery-card tap always inspects. It never toggles closed or mutates a deck.
    setSelectedCard({ card, banlistItem });
  }, []);
  const handleHoveredCard = useCallback(
    (card: CardDocument | null, banlistItem?: BanlistItem | null) => setHoveredCard(card ? { card, banlistItem: banlistItem ?? null } : null),
    [],
  );

  useEffect(() => {
    const updateDetailModalVariant = () => {
      if (window.innerWidth < 1024) {
        setDetailModalVariant("bottom-sheet");
      } else if (window.innerWidth < 1280) {
        setDetailModalVariant("constrained-dialog");
      } else {
        setDetailModalVariant(null);
      }
    };

    updateDetailModalVariant();
    window.addEventListener("resize", updateDetailModalVariant);
    return () => window.removeEventListener("resize", updateDetailModalVariant);
  }, []);

  return (
    <FullPage showBreadcrumbs={false} scrollOnShortViewport>
      <div className="short-viewport-flow mx-auto flex min-h-0 w-full flex-1 gap-4 overflow-hidden bg-[rgba(4,9,14,.5)] p-2 backdrop-blur-[8px] sm:p-4">
        <div className="short-viewport-flow min-h-0 min-w-0 flex-1">
          <SearchPane
            setHoveredCard={handleHoveredCard}
            onSelectCard={handleSelectCard}
            onClearSelectedCard={clearSelectedCard}
            selectedCardId={selectedCard?.card._id ?? null}
            handleAddCardToDeck={() => null}
            deckLegion={null}
            gallery
          />
        </div>
        <aside className="hidden w-80 shrink-0 xl:block">
          <div className="sticky top-0 h-full overflow-y-auto rounded-[2px] border border-white/20 bg-[rgba(4,9,14,.78)] p-4 shadow-xl shadow-black/20">
            <CardGalleryInspector
              card={preview?.card ?? null}
              banlistItem={preview?.banlistItem ?? null}
              isPinned={selectedCard !== null}
              onClearPinned={selectedCard ? clearSelectedCard : undefined}
            />
          </div>
        </aside>
      </div>
      {detailModalVariant && (
        <Modal
          open={selectedCard !== null}
          closeModal={clearSelectedCard}
          variant={detailModalVariant}
          ariaLabel="Card details"
          modalHeader={<div className="h-1" />}
          modalContent={<div className="relative"><CardGalleryInspector compact card={selectedCard?.card ?? null} banlistItem={selectedCard?.banlistItem ?? null} onClose={clearSelectedCard} /></div>}
        />
      )}
    </FullPage>
  );
};
