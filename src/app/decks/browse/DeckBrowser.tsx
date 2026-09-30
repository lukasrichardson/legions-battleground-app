"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import { renderCardTile } from "../[deckId]/components/CardTile";
import { fetchPublishedDeckFilterOptions, fetchPublishedDeckListSummaries } from "@/client/utils/api.utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FullPage from "@/app/components/FullPage";
import { MultiSelect } from "@/client/ui/multiselect";
import LoadingState from "../../components/LoadingState";
import { PublishedDeckListItem } from "@/shared/interfaces/DeckListItem";

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

  const handleLegionSelect = (legionVal: string[]) => {
    setLegion(legionVal);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPage(1);
    void fetchPublishedDeckListSummaries(legion, 1).then((response) => {
      if (!active) return;
      setDecks(response.decks);
      setTotal(response.total);
      setHasMore(response.hasMore);
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
      <div className="text-center mb-2">
        <p className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto">
          Browse and Copy decks published by the community
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <Card className="bg-white/10 border-white/20 text-white h-full flex flex-col">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center justify-start text-lg">
              <span className="flex items-center gap-2">
                Published Decks
              </span>
              <span className="text-sm text-gray-400 mx-2">
                {total} decks
              </span>
              <MultiSelect
                options={filterOptions?.legion?.map((option) => ({ value: option, label: option[0].toUpperCase() + option.slice(1) })) || []}
                value={legion}
                onChange={handleLegionSelect}
                placeholder="Legion"
                className="cursor-pointer text-xs"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-1 overflow-hidden">
            {loading ? (
              <LoadingState label="Loading published decks…" className="h-full" />
            ) : decks.length === 0 ? (
              <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-gray-400 text-base">No decks found</p>
                <p className="text-gray-500 text-sm mt-1">Create your first deck to get started!</p>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {decks.map(deck => {
                    return (
                      <div
                        key={deck._id.toString()}
                        className="cursor-pointer group relative"
                        onClick={handleDeckSelect(deck._id.toString())}
                      >
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
                          <div className="text-center">
                            <p className="text-sm font-medium text-white truncate">
                              {deck.name}
                              <span className="text-xs text-gray-400 mt-1">
                              {" - " + deck.mainDeckSize + " cards"}
                              {" · Side " + deck.sideDeckSize + "/15"}
                              </span>
                            </p>
                          </div>
                          <div className="flex justify-center mb-2">
                            {deck.coverCard ? renderCardTile(deck.coverCard, 0, () => null) : (
                              <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-slate-700/60 text-gray-400">♜</div>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-white truncate">
                              {deck.author || ""}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {deck.published_date ? new Date(deck.published_date).toLocaleDateString() : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {hasMore && (
                  <div className="flex justify-center py-4">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="rounded border border-white/30 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-50"
                    >
                      {loadingMore ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FullPage>
  )
}
