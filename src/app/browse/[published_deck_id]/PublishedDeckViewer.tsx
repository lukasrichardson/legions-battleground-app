"use client";
import FullPage from "@/app/components/FullPage";
import DeckGrid from "../../decks/[deckId]/components/DeckGrid";
import { useEffect, useState } from "react";
import PublishedDeck from "@/shared/interfaces/PublishedDeck";
import { fetchPublishedDeckById, copyPublishedDeck } from "@/client/utils/api.utils";
import { useParams, usePathname, useRouter } from "next/navigation";
import Preview from "../../decks/[deckId]/Preview";
import { HydratedDeckCard } from "@/shared/interfaces/DeckResponse";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/client/ui/button";
import { getMainDeckCards } from "@/shared/deckComposition";

export default function PublishedDeckViewer() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ published_deck_id: string }>()
  const { data: session, status } = useSession();
  const [hoveredCard, setHoveredCard] = useState<HydratedDeckCard | null>(null);
  const [deck, setDeck] = useState<PublishedDeck | null>(null); // TODO: Fix type - should be properly typed but DeckResponse interface doesn't match actual usage

  useEffect(() => {
    const fetchDeck = async () => {
      if (!params.published_deck_id) return;
      setDeck(await fetchPublishedDeckById(params.published_deck_id));
    }
    fetchDeck();
    return () => { setDeck(null) };
  }, [params?.published_deck_id]);

  const handleCopyDeck = async () => {
    if (!deck?._id) return;
    if (!session) {
      signIn(undefined, { callbackUrl: pathname });
      return;
    }
    const copiedDeck = await copyPublishedDeck(deck._id.toString());
    if (copiedDeck._id) router.push(`/decks/${copiedDeck._id}`);
  }
  return (
    <FullPage showBreadcrumbs={true}>
      {deck && <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-2.5">
        <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm sm:text-lg">
          <span className="text-white font-medium">{deck.name}</span>
          <span className="text-white/70">{deck.legion}</span>
          <span className="text-white/50">By {deck.author}</span>
          <span className="text-white/50">Published {new Date(deck.published_date).toLocaleDateString()}</span>
          <span className="text-white/50">{getMainDeckCards(deck).length} main cards</span>
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
        <div className="flex min-h-0 flex-1 flex-col-reverse gap-2 overflow-y-auto border-t border-white/20 pt-2 lg:flex-row lg:overflow-hidden">
          <div className="order-1 min-h-[320px] min-w-0 flex-[2] lg:min-h-0 lg:flex-[3]">
            <DeckGrid deck={deck} setHoveredCard={setHoveredCard} handleRemoveCardFromDeck={() => null} handleSortClick={() => null} saving={false} handleAddCardToDeck={() => null} readOnly={true} />
          </div>
          <div className="order-2 flex min-w-0 flex-1 flex-col gap-2 lg:w-80 xl:w-96">
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
