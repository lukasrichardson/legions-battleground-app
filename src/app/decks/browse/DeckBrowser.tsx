"use client";

import { renderCardTile } from "../[deckId]/components/CardTile";
import { fetchPublishedDeckFilterOptions, fetchPublishedDeckListSummaries } from "@/client/utils/api.utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FullPage from "@/app/components/FullPage";
import { MultiSelect } from "@/client/ui/multiselect";
import { PublishedDeckListItem } from "@/shared/interfaces/DeckListItem";
import DeckCollectionPanel from "@/app/components/DeckCollectionPanel";
import { Button } from "@/client/ui/button";
import PageHeader from "@/app/components/PageHeader";
import { InlineStatus } from "@/client/ui/inline-status";

export default function DeckBrowser() {
  const router = useRouter();
  const [decks, setDecks] = useState<PublishedDeckListItem[]>([]);
  const [legion, setLegion] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<{ legion: string[] }>({ legion: [] });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState("");

  const handleLegionSelect = (legionVal: string[]) => {
    setLegion(legionVal);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    setPage(1);
    void fetchPublishedDeckListSummaries(legion, 1).then((response) => {
      if (!active) return;
      setDecks(response.decks);
      setTotal(response.total);
      setHasMore(response.hasMore);
    }).catch(() => {
      if (active) setLoadError("Could not load published decks. Please try again.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [legion])

  useEffect(() => {
    void fetchPublishedDeckFilterOptions<{ legion: string[] }>().then(setFilterOptions).catch((error) => console.warn("[DeckBrowser] Filter request failed:", error));
  }, [])

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const response = await fetchPublishedDeckListSummaries(legion, nextPage);
      setDecks((current) => [...current, ...response.decks]);
      setPage(response.page);
      setHasMore(response.hasMore);
    } catch {
      setLoadError("Could not load more published decks. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };
  const handleDeckSelect = (deckId) => () => {
    if (!deckId) return;
    router.push("/decks/browse/" + deckId);
  }
  return (
    <FullPage showBreadcrumbs={true}>
      <PageHeader title="Published Decks" description="Browse community decklists and copy a starting point for your next deck." />
      <div className="min-h-0 flex-1">
        <DeckCollectionPanel
          title="Published Decks"
          count={total}
          filter={<MultiSelect options={filterOptions.legion.map((option) => ({ value: option, label: option[0].toUpperCase() + option.slice(1) }))} value={legion} onChange={handleLegionSelect} placeholder="Legion" />}
          loading={loading}
          loadingLabel="Loading published decks…"
          isEmpty={!loadError && decks.length === 0}
          emptyTitle="No published decks found"
          emptyDescription="Try clearing your filters or check back later."
          footer={hasMore ? <div className="flex justify-center py-4"><Button type="button" variant="outline" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Loading…" : "Load more"}</Button></div> : undefined}
        >
          {loadError && <InlineStatus variant="error" className="mb-3">{loadError}</InlineStatus>}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {decks.map((deck) => (
                <article key={deck._id.toString()}>
                  <button type="button" className="w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={handleDeckSelect(deck._id.toString())}>
                    <p className="truncate text-center text-sm font-medium text-white">{deck.name}</p>
                    <p className="mt-1 truncate text-center text-xs text-muted-foreground">{deck.mainDeckSize} cards · Side {deck.sideDeckSize}/15</p>
                    <div className="mb-2 mt-2 flex justify-center">
                      {deck.coverCard ? renderCardTile(deck.coverCard, 0, () => null) : <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-slate-700/60 text-muted-foreground">♜</div>}
                    </div>
                    <p className="truncate text-center text-sm font-medium text-white">{deck.author || "Unknown author"}</p>
                    <p className="mt-1 text-center text-xs text-muted-foreground">{deck.published_date ? new Date(deck.published_date).toLocaleDateString() : ""}</p>
                  </button>
                </article>
              ))}
            </div>
        </DeckCollectionPanel>
      </div>
    </FullPage>
  )
}
