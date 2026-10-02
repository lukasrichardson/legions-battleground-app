import { fetchDeckFilterOptions, fetchDeckListSummaries } from "@/client/utils/api.utils";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { renderCardTile } from "./[deckId]/components/CardTile";
import axios from "axios";
import { MultiSelect } from "@/client/ui/multiselect";
import { DeckListItem } from "@/shared/interfaces/DeckListItem";
import DeckCollectionPanel from "@/app/components/DeckCollectionPanel";
import { InlineStatus } from "@/client/ui/inline-status";

export const DecksList = () => {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckListItem[]>([]);
  const [legion, setLegion] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<{ legion: string[] }>({ legion: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const handleLegionSelect = (legionVal: string[]) => {
    setLegion(legionVal);
  }

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    void fetchDeckListSummaries(legion)
      .then(setDecks)
      .catch(() => setLoadError("Could not load your decks. Please try again."))
      .finally(() => setLoading(false));
  }, [legion])

  useEffect(() => {
    void fetchDeckFilterOptions<{ legion: string[] }>().then(setFilterOptions).catch((error) => console.warn("[DecksList] Filter request failed:", error));
  }, []);
  
  const handleDeckSelect = (deckId) => () => {
    if (!deckId) return;
    router.push("/decks/"+deckId);
  }

  const handleDeleteDeckClick = (deckId, deckName) => (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete ${deckName}? This cannot be undone.`)) return;
    axios.delete(`/api/decks/${deckId}`).then(() => {
      return fetchDeckListSummaries(legion).then(setDecks);
    }).catch((err) => {
      console.error("Error deleting deck:", err);
    });
  }

  const clearFilters = () => {
    setLegion([]);
  }
  return (
    <div className="min-h-0 flex-1">
      <DeckCollectionPanel
        title="Your Decks"
        count={decks.length}
        filter={<MultiSelect options={filterOptions.legion.map((option) => ({ value: option, label: option[0].toUpperCase() + option.slice(1) }))} value={legion} onChange={handleLegionSelect} placeholder="Legion" />}
        onClearFilters={legion.length > 0 ? clearFilters : undefined}
        loading={loading}
        loadingLabel="Loading your decks…"
        isEmpty={!loadError && decks.length === 0}
        emptyTitle="No decks found"
        emptyDescription="Create your first deck to get started."
      >
        {loadError ? <div className="flex h-full items-center justify-center"><InlineStatus variant="error">{loadError}</InlineStatus></div> : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {decks.map((deck) => (
              <article key={deck._id.toString()} className="group relative">
                <button type="button" className="w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 p-1 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={handleDeckSelect(deck._id.toString())}>
                  <div className="mb-1 flex justify-center">
                    {deck.coverCard ? renderCardTile(deck.coverCard, 0, () => null) : <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-slate-700/60 text-muted-foreground">♜</div>}
                  </div>
                  <div className="text-center">
                    <p className="truncate text-sm font-medium text-white">{deck.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{deck.mainDeckSize} cards · Side {deck.sideDeckSize}/15</p>
                  </div>
                </button>
                <button type="button" className="absolute right-1 top-1 cursor-pointer rounded-md bg-destructive/90 px-2 py-1 text-xs font-semibold text-destructive-foreground opacity-0 transition-opacity hover:bg-destructive focus-visible:opacity-100 group-hover:opacity-100" onClick={handleDeleteDeckClick(deck._id.toString(), deck.name)} aria-label={`Delete ${deck.name}`}>
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </DeckCollectionPanel>
    </div>
  )
}
