"use client";

import { fetchPublishedDeckFilterOptions, fetchPublishedDeckListSummaries } from "@/client/utils/api.utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FullPage from "@/app/components/FullPage";
import { MultiSelect } from "@/client/ui/multiselect";
import { PublishedDeckListItem } from "@/shared/interfaces/DeckListItem";
import { Button } from "@/client/ui/button";
import PageHeader from "@/app/components/PageHeader";
import { useUiVariant } from "@/app/components/arena/uiVariant";
import { InlineStatus } from "@/client/ui/inline-status";
import LoadingState from "@/app/components/LoadingState";
import { EmptyState } from "@/client/ui/empty-state";
import CardImage from "@/app/components/Card/CardImage";

const date = (value: Date | string) => new Date(value).toLocaleDateString();

export default function DeckBrowser() {
  const variant = useUiVariant(); const router = useRouter();
  const [decks, setDecks] = useState<PublishedDeckListItem[]>([]); const [legion, setLegion] = useState<string[]>([]);
  const [options, setOptions] = useState<{ legion: string[] }>({ legion: [] }); const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [hasMore, setHasMore] = useState(false); const [error, setError] = useState("");
  useEffect(() => { let active = true; setLoading(true); setError(""); setPage(1); void fetchPublishedDeckListSummaries(legion, 1).then((r) => { if (active) { setDecks(r.decks); setTotal(r.total); setHasMore(r.hasMore); } }).catch(() => active && setError("Could not load published decks. Please try again.")).finally(() => active && setLoading(false)); return () => { active = false; }; }, [legion]);
  useEffect(() => { void fetchPublishedDeckFilterOptions<{ legion: string[] }>().then(setOptions).catch(() => undefined); }, []);
  const loadMore = async () => { setLoadingMore(true); try { const response = await fetchPublishedDeckListSummaries(legion, page + 1); setDecks((current) => [...current, ...response.decks]); setPage(response.page); setHasMore(response.hasMore); } catch { setError("Could not load more published decks. Please try again."); } finally { setLoadingMore(false); } };
  return <FullPage showBreadcrumbs={false}><div className="mobile-shrink min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(1rem+var(--safe-area-bottom))] pt-2 sm:px-4"><PageHeader variant={variant} title="Published Decks" description="Browse community decklists and copy a starting point for your next deck." /><section aria-label="Published deck browser" className="rounded-sm border border-white/20 bg-[rgba(5,11,17,.71)] p-3 sm:p-4"><div className="flex flex-col gap-3 border-b border-white/15 pb-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-300" aria-live="polite">{total} {total === 1 ? "deck" : "decks"}</p><div className="flex flex-wrap items-center gap-2"><span className="text-sm text-slate-200">Filter by legion</span><MultiSelect className="max-w-full [&_button]:min-h-[var(--touch-target-size)]" options={options.legion.map((value) => ({ value, label: value }))} value={legion} onChange={setLegion} placeholder="All legions" menuPlacement="viewport" /></div></div>{error && <InlineStatus variant="error" className="mt-3">{error}</InlineStatus>}{loading ? <LoadingState label="Loading published decks…" className="min-h-64" /> : decks.length === 0 && !error ? <EmptyState icon="♜" title="No published decks found" description="Try clearing your filters or check back later." className="min-h-64" /> : <div className="mt-3 grid grid-cols-1 gap-3 min-[540px]:grid-cols-2 xl:grid-cols-3">{decks.map((deck) => <DeckCard key={deck._id.toString()} deck={deck} onOpen={() => router.push(`/browse/${deck._id}`)} />)}</div>}{hasMore && <div className="mt-4 flex justify-center"><Button type="button" variant="outline" onClick={loadMore} disabled={loadingMore} pending={loadingMore} className="w-full sm:w-auto">{loadingMore ? "Loading…" : "Load more decks"}</Button></div>}</section></div></FullPage>;
}

function DeckCard({ deck, onOpen }: { deck: PublishedDeckListItem; onOpen: () => void }) { const featured = deck.coverCard?.title || "No featured card"; return <article><button type="button" onClick={onOpen} aria-label={`Open published deck ${deck.name}`} className="touch-feedback flex min-h-[var(--touch-target-size)] w-full gap-3 rounded-sm border border-white/15 bg-slate-950/35 p-3 text-left hover:bg-blue-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"><span className="relative block w-20 shrink-0 self-start overflow-hidden rounded border border-white/10"><span className="block aspect-[3/4]">{deck.coverCard ? <CardImage src={deck.coverCard.featured_image} alt={featured} loading="lazy" priority={false} className="object-contain" /> : <span className="grid h-full place-items-center text-slate-500">♜</span>}</span></span><span className="min-w-0 flex-1"><span className="block break-words text-base font-semibold text-white">{deck.name}</span><span className="mt-1 block break-words text-sm text-sky-100">{deck.legion}</span><span className="mt-1 block break-words text-sm text-slate-300">By {deck.author || "Unknown author"}</span><span className="mt-1 block break-words text-xs text-slate-400">Featured card: {featured}</span><span className="mt-1 block text-xs text-slate-300">{deck.mainDeckSize} main · {deck.sideDeckSize}/15 side</span><span className="mt-1 block text-xs text-slate-500">Published {date(deck.published_date)}</span></span></button></article>; }
