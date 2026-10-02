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
    if (selectedCard?.card._id === card._id) {
      setSelectedCard(null);
    } else {
      setSelectedCard({ card, banlistItem });
    }
  }, [selectedCard]);
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
    <FullPage showBreadcrumbs={true}>
      <div className="mx-auto flex h-full min-h-0 w-full gap-4">
        <div className="min-w-0 flex-1">
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
          <div className="sticky top-0 h-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-xl shadow-black/20">
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
