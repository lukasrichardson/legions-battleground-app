"use client";
import FullPage from "@/app/components/FullPage";
import DeckGrid from "../../[deckId]/components/DeckGrid";
import { useEffect, useState } from "react";
import PublishedDeck from "@/shared/interfaces/PublishedDeck";
import { fetchPublishedDeckById, copyPublishedDeck } from "@/client/utils/api.utils";
import { useParams, usePathname, useRouter } from "next/navigation";
import Preview from "../../[deckId]/Preview";
import { CardDocument } from "@/shared/interfaces/Card.mongo";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/client/ui/button";

export default function PublishedDeckViewer() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ published_deck_id: string }>()
  const { data: session, status } = useSession();
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
    if (!session) {
      signIn(undefined, { callbackUrl: pathname });
      return;
    }
    copyPublishedDeck(deck._id.toString(), (data: {deck: DeckResponse}) => {
      if (data?.deck?._id) {
        router.push(`/decks/${data?.deck?._id}`);
      }
    });
  }
  return (
    <FullPage showBreadcrumbs={true}>
      {deck && <div>
        <div className="w-full flex justify-center items-center gap-x-3 gap-y-1 flex-wrap text-sm sm:text-lg">
          <span className="text-white font-medium">{deck.name}</span>
          <span className="text-white/70">{deck.legion}</span>
          <span className="text-white/50">By {deck.author}</span>
          <span className="text-white/50">Published {new Date(deck.published_date).toLocaleDateString()}</span>
          <span className="text-white/50">{deck.cards_in_deck.length} main cards</span>
          <span className="text-white/50">{(deck.side_deck ?? []).length}/15 side cards</span>
          <Button
            onClick={handleCopyDeck}
            disabled={status === "loading"}
            variant="outline"
            size="sm"
            className="border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            {status === "loading" ? "Checking sign-in…" : session ? "Copy to My Decks" : "Sign in to copy this deck"}
          </Button>
          {!session && status !== "loading" && (
            <span className="w-full text-center text-xs text-white/60">
              You can browse public decks without an account. Sign in only to save a copy.
            </span>
          )}
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
