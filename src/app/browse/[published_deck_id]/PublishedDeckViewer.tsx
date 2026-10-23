"use client";

import FullPage from "@/app/components/FullPage";
import LoadingState from "@/app/components/LoadingState";
import Modal from "@/app/components/Modals/Modal";
import CardGalleryInspector from "@/app/cards/CardGalleryInspector";
import DeckGrid from "@/app/decks/[deckId]/components/DeckGrid";
import Preview from "@/app/decks/[deckId]/Preview";
import {
  fetchPublishedDeckById,
  copyPublishedDeck,
} from "@/client/utils/api.utils";
import { useBanlist } from "@/client/hooks/useBanlist";
import { getApiErrorMessage } from "@/client/utils/apiError";
import { Button } from "@/client/ui/button";
import { InlineStatus } from "@/client/ui/inline-status";
import { getCardStatus } from "@/app/components/Card/CardStatusBadge";
import { getMainDeckCards, getSideDeckCards } from "@/shared/deckComposition";
import { HydratedDeckCard } from "@/shared/interfaces/DeckResponse";
import PublishedDeck from "@/shared/interfaces/PublishedDeck";
import { signIn, useSession } from "next-auth/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function PublishedDeckViewer() {
  const banlist = useBanlist();
  const params = useParams<{ published_deck_id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [deck, setDeck] = useState<PublishedDeck | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<HydratedDeckCard | null>(null);
  const [selectedCard, setSelectedCard] = useState<HydratedDeckCard | null>(
    null,
  );
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void fetchPublishedDeckById(params.published_deck_id)
      .then((nextDeck) => active && setDeck(nextDeck))
      .catch(
        () => active && setError("This published deck could not be loaded."),
      )
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [params.published_deck_id]);

  const copy = async () => {
    if (!deck) return;
    if (!session) {
      await signIn(undefined, { callbackUrl: pathname });
      return;
    }

    try {
      const result = await copyPublishedDeck(deck._id.toString());
      if (result._id) router.push(`/decks/${result._id}`);
      else
        setCopyError("The deck copy could not be created. Please try again.");
    } catch (error) {
      setCopyError(getApiErrorMessage(error, "The deck copy could not be created. Please try again."));
    }
  };

  if (loading) {
    return (
      <PageState>
        <LoadingState label="Loading published deck…" className="min-h-64" />
      </PageState>
    );
  }

  if (error || !deck) {
    return (
      <PageState>
        <InlineStatus variant="error">
          {error || "This published deck could not be loaded."}
        </InlineStatus>
      </PageState>
    );
  }

  const mainDeckCount = getMainDeckCards(deck).length;
  const sideDeckCount = getSideDeckCards(deck).length;

  return (
    <FullPage showBreadcrumbs={false}>
      <main className="mobile-shrink flex min-h-0 flex-1 flex-col gap-2 px-1 pb-[calc(.5rem+var(--safe-area-bottom))] pt-1 sm:px-2">
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/20 pb-2 text-sm sm:text-base">
          <h1 className="min-w-0 break-words font-serif text-lg font-semibold text-white sm:text-xl">
            {deck.name}
          </h1>
          <span className="text-sky-200">{deck.legion}</span>
          <span className="text-white/60">
            By {deck.author || "Unknown author"}
          </span>
          <span className="text-white/55">
            Published {new Date(deck.published_date).toLocaleDateString()}
          </span>
          <span className="text-white/55">
            {mainDeckCount} main · {sideDeckCount}/15 side
          </span>
          <Button
            type="button"
            onClick={copy}
            disabled={status === "loading"}
            pending={status === "loading"}
            variant="outline"
            size="sm"
            className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            {status === "loading"
              ? "Checking sign-in…"
              : session
                ? "Copy to My Decks"
                : "Sign in to copy"}
          </Button>
          {!session && status !== "loading" && (
            <span className="basis-full text-xs text-white/55 sm:text-right">
              Sign in only if you want to save a copy.
            </span>
          )}
          {copyError && (
            <InlineStatus variant="error" className="basis-full">
              {copyError}
            </InlineStatus>
          )}
        </header>

        <section
          className="min-h-0 flex-1 overflow-y-auto lg:flex lg:gap-3 lg:overflow-hidden"
          aria-label="Published deck cards"
        >
          <div className="min-h-0 min-w-0 lg:h-full lg:flex-[3]">
            <DndProvider backend={HTML5Backend}>
              <DeckGrid
                deck={deck}
                setHoveredCard={setHoveredCard}
                handleRemoveCardFromDeck={() => null}
                handleSortClick={() => null}
                saving={false}
                handleAddCardToDeck={() => null}
                onInspectCard={setSelectedCard}
                readOnly
                banlist={banlist}
              />
            </DndProvider>
          </div>
          <aside
            className="hidden min-h-0 min-w-0 flex-1 lg:flex lg:w-80 xl:w-96"
            aria-label="Card preview"
          >
            <Preview hoveredCard={hoveredCard} />
          </aside>
        </section>
      </main>

      <Modal
        open={Boolean(selectedCard)}
        closeModal={() => setSelectedCard(null)}
        ariaLabel="Published deck card details"
        modalHeader={
          <div className="flex items-center justify-between py-3">
            <span className="min-w-0 break-words text-base font-semibold text-white">
              {selectedCard?.title}
            </span>
            <button
              type="button"
              aria-label="Close card details"
              className="touch-feedback ml-3 grid h-11 w-11 shrink-0 place-items-center border border-sky-200/30"
              onClick={() => setSelectedCard(null)}
            >
              ×
            </button>
          </div>
        }
        modalContent={
          <CardGalleryInspector
            compact
            card={selectedCard}
            banlistItem={
              selectedCard ? getCardStatus(banlist, selectedCard.title) : null
            }
          />
        }
      />
    </FullPage>
  );
}

function PageState({ children }: { children: React.ReactNode }) {
  return <FullPage showBreadcrumbs={false}>{children}</FullPage>;
}
