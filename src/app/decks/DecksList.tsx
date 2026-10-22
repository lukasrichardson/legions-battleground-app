import {
  fetchDeckFilterOptions,
  fetchDeckListSummaries,
} from "@/client/utils/api.utils";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { MultiSelect } from "@/client/ui/multiselect";
import { DeckListItem } from "@/shared/interfaces/DeckListItem";
import DeckCollectionPanel from "@/app/components/DeckCollectionPanel";
import { InlineStatus } from "@/client/ui/inline-status";
import { useUiVariant } from "../components/arena/uiVariant";
import { Trash2 } from "lucide-react";
import DeckSummaryCard from "@/app/components/DeckSummaryCard";

export const DecksList = () => {
  const router = useRouter();
  const variant = useUiVariant();
  const [decks, setDecks] = useState<DeckListItem[]>([]);
  const [legion, setLegion] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<{ legion: string[] }>({
    legion: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const handleLegionSelect = (legionVal: string[]) => {
    setLegion(legionVal);
  };

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    void fetchDeckListSummaries(legion)
      .then(setDecks)
      .catch(() => setLoadError("Could not load your decks. Please try again."))
      .finally(() => setLoading(false));
  }, [legion]);

  useEffect(() => {
    void fetchDeckFilterOptions<{ legion: string[] }>()
      .then(setFilterOptions)
      .catch((error) =>
        console.warn("[DecksList] Filter request failed:", error),
      );
  }, []);

  const handleDeckSelect = (deckId) => () => {
    if (!deckId) return;
    router.push("/decks/" + deckId);
  };

  const handleDeleteDeckClick = (deckId, deckName) => (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete ${deckName}? This cannot be undone.`)) return;
    axios
      .delete(`/api/decks/${deckId}`)
      .then(() => {
        return fetchDeckListSummaries(legion).then(setDecks);
      })
      .catch((err) => {
        console.error("Error deleting deck:", err);
      });
  };

  const clearFilters = () => {
    setLegion([]);
  };
  return (
    <div className="min-h-0 flex-1">
      <DeckCollectionPanel
        variant={variant}
        title="Your Decks"
        count={decks.length}
        filter={
          <MultiSelect
            options={filterOptions.legion.map((option) => ({
              value: option,
              label: option[0].toUpperCase() + option.slice(1),
            }))}
            value={legion}
            onChange={handleLegionSelect}
            placeholder="Legion"
          />
        }
        onClearFilters={legion.length > 0 ? clearFilters : undefined}
        loading={loading}
        loadingLabel="Loading your decks…"
        isEmpty={!loadError && decks.length === 0}
        emptyTitle="No decks found"
        emptyDescription="Create your first deck to get started."
      >
        {loadError ? (
          <div className="flex min-h-48 items-center justify-center">
            <InlineStatus variant="error">{loadError}</InlineStatus>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-3 min-[540px]:grid-cols-2 xl:grid-cols-4">
            {decks.map((deck) => (
              <DeckSummaryCard
                key={deck._id.toString()}
                deck={deck}
                openLabel={`Edit deck ${deck.name}`}
                onOpen={handleDeckSelect(deck._id.toString())}
                action={
                  <button
                    type="button"
                    className="touch-feedback absolute right-3 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-sm border border-rose-200/30 bg-rose-500/15 text-rose-100 transition hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                    onClick={handleDeleteDeckClick(
                      deck._id.toString(),
                      deck.name,
                    )}
                    aria-label={`Delete ${deck.name}`}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                }
              />
            ))}
          </div>
        )}
      </DeckCollectionPanel>
    </div>
  );
};
