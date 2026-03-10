"use client";
import FullPage from "@/app/components/FullPage";
import DeckGrid from "../../[deckId]/components/DeckGrid";
import { useEffect, useState } from "react";
import PublishedDeck from "@/shared/interfaces/PublishedDeck";
import { fetchPublishedDeckById, copyPublishedDeck } from "@/client/utils/api.utils";
import { useParams, useRouter } from "next/navigation";
import Preview from "../../[deckId]/Preview";
import { CardDocument } from "@/shared/interfaces/Card.mongo";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";

export default function PublishedDeckViewer() {
  const router = useRouter();
  const params = useParams<{ published_deck_id: string }>()
  const [hoveredCard, setHoveredCard] = useState<CardDocument | null>(null);
  const [deck, setDeck] = useState<PublishedDeck | null>(null); // TODO: Fix type - should be properly typed but DeckResponse interface doesn't match actual usage

  useEffect(() => {
    const fetchDeck = async () => {
      if (!params.published_deck_id) return;
      fetchPublishedDeckById(params.published_deck_id, (data) => setDeck(data as PublishedDeck));
    }
    fetchDeck();
    return () => { setDeck(null) };
  }, [params?.published_deck_id]);

  const handleCopyDeck = () => {
    if (!deck?._id) return;
    copyPublishedDeck(deck._id.toString(), (data: {deck: DeckResponse}) => {
      if (data?.deck?._id) {
        router.push(`/decks/${data?.deck?._id}`);
      }
    });
  }
  return (
    <FullPage showBreadcrumbs={true}>
      {deck && <div className="pt-10">
        <div className="w-full flex justify-center flex-wrap">
          <span className="text-white mx-1">{deck?.name}</span>
          <span className="text-white/50 mx-1">By:{deck?.author}</span>
          <span className="text-white/50 mx-1">Published:{new Date(deck?.published_date).toLocaleDateString()}</span>
          <button
            onClick={handleCopyDeck}
            className="group text-white/90 hover:text-white transition-colors cursor-pointer border-white border-1 rounded p-0.5 text-sm"
          >
            <span className="opacity-75 group-hover:opacity-100 transition-opacity">
              Copy To My Decks
            </span>
          </button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col-reverse lg:flex-row gap-2">
          <div className="flex-2 lg:flex-3 min-h-0 order-1 lg:order-1">
            <DeckGrid deck={deck} setHoveredCard={setHoveredCard} handleRemoveCardFromDeck={() => null} handleSortClick={() => null} saving={false} handleAddCardToDeck={() => null} readOnly={true} />
          </div>
          <div className="flex flex-1 lg:flex-1 flex-col gap-2 order-2 lg:order-2 lg:w-80 xl:w-96">
            {/* Preview Pane - Only show on large screens */}
            <div className="hidden lg:block h-1/2">
              <Preview hoveredCard={hoveredCard} />
            </div>
          </div>
        </div>
      </div>}
    </FullPage>
  )
}