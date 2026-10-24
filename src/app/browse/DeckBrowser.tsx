"use client";

import {
  fetchPublishedDeckFilterOptions,
  fetchPublishedDeckListSummaries,
} from "@/client/utils/api.utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FullPage from "@/app/components/FullPage";
import DeckCollectionHeader from "@/app/components/DeckCollectionHeader";
import { PublishedDeckListItem } from "@/shared/interfaces/DeckListItem";
import { Button } from "@/client/ui/button";
import PageHeader from "@/app/components/PageHeader";
import { useUiVariant } from "@/app/components/arena/uiVariant";
import { InlineStatus } from "@/client/ui/inline-status";
import LoadingState from "@/app/components/LoadingState";
import { EmptyState } from "@/client/ui/empty-state";
import DeckSummaryCard from "@/app/components/DeckSummaryCard";

const date = (value: Date | string) => new Date(value).toLocaleDateString();

export default function DeckBrowser() {
  const variant = useUiVariant();
  const router = useRouter();
  const [decks, setDecks] = useState<PublishedDeckListItem[]>([]);
  const [legion, setLegion] = useState<string[]>([]);
  const [options, setOptions] = useState<{ legion: string[] }>({ legion: [] });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setPage(1);
    void fetchPublishedDeckListSummaries(legion, 1)
      .then((r) => {
        if (active) {
          setDecks(r.decks);
          setTotal(r.total);
          setHasMore(r.hasMore);
        }
      })
      .catch(
        () =>
          active &&
          setError("Could not load published decks. Please try again."),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [legion]);
  useEffect(() => {
    void fetchPublishedDeckFilterOptions<{ legion: string[] }>()
      .then(setOptions)
      .catch(() => undefined);
  }, []);
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const response = await fetchPublishedDeckListSummaries(legion, page + 1);
      setDecks((current) => [...current, ...response.decks]);
      setPage(response.page);
      setHasMore(response.hasMore);
    } catch {
      setError("Could not load more published decks. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };
  return (
    <FullPage showBreadcrumbs={false}>
      <div className="mobile-shrink min-h-0 flex-1 overflow-y-auto pb-[calc(1rem+var(--safe-area-bottom))] pt-2">
        <PageHeader
          variant={variant}
          title="Published Decks"
          description="Browse community decklists and copy a starting point for your next deck."
        />
        <section
          aria-label="Published deck browser"
          className="rounded-sm border border-white/20 bg-[rgba(5,11,17,.71)]"
        >
          <DeckCollectionHeader count={total} legions={options.legion} selectedLegions={legion} onLegionsChange={setLegion} />
          <div className="p-3 sm:p-4">
            {error && (
              <InlineStatus variant="error" className="mt-3">
                {error}
              </InlineStatus>
            )}
            {loading ? (
              <LoadingState
                label="Loading published decks…"
                className="min-h-64"
              />
            ) : decks.length === 0 && !error ? (
              <EmptyState
                icon="♜"
                title="No published decks found"
                description="Try clearing your filters or check back later."
                className="min-h-64"
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 min-[540px]:grid-cols-2 xl:grid-cols-3">
                {decks.map((deck) => (
                  <DeckSummaryCard
                    key={deck._id.toString()}
                    deck={deck}
                    openLabel={`Open published deck ${deck.name}`}
                    onOpen={() => router.push(`/browse/${deck._id}`)}
                    detail={
                      <>
                        <span className="mt-1 mr-1 break-words text-sm text-slate-300">
                          By {deck.author || "Unknown author"}
                        </span>
                        <span className="mt-1 text-xs text-slate-500">
                          {date(deck.published_date)}
                        </span>
                      </>
                    }
                  />
                ))}
              </div>
            )}
            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  pending={loadingMore}
                  className="w-full sm:w-auto"
                >
                  {loadingMore ? "Loading…" : "Load more decks"}
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </FullPage>
  );
}
