import { fetchDeckFilterOptions, fetchDeckListSummaries } from "@/client/utils/api.utils";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { renderCardTile } from "./[deckId]/components/CardTile";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import axios from "axios";
import { MultiSelect } from "@/client/ui/multiselect";
import LoadingState from "../components/LoadingState";
import { DeckListItem } from "@/shared/interfaces/DeckListItem";
import AppIcon from "@/app/components/AppIcon";

export const DecksList = () => {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckListItem[]>([]);
  const [legion, setLegion] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<{ legion: string[] }>({ legion: [] });
  const [loading, setLoading] = useState(true);

  const handleLegionSelect = (legionVal: string[]) => {
    setLegion(legionVal);
  }

  useEffect(() => {
    setLoading(true);
    void fetchDeckListSummaries(legion).then(setDecks).finally(() => setLoading(false));
  }, [legion])

  useEffect(() => {
    void fetchDeckFilterOptions<{ legion: string[] }>().then(setFilterOptions).catch((error) => console.warn("[DecksList] Filter request failed:", error));
  }, []);
  
  const handleDeckSelect = (deckId) => () => {
    if (!deckId) return;
    router.push("/decks/"+deckId);
  }

  const handleDeleteDeckClick = (deckId) => (e) => {
    e.stopPropagation();
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
    <div className="flex-1 min-h-0">
      <Card className="bg-white/10 border-white/20 text-white h-full flex flex-col">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center justify-start text-lg">
            <span className="flex items-center gap-2 text-sm">
              Your Decks
            </span>
            <span className="text-sm text-gray-400 mx-2">
              {decks.length} decks
            </span>
            <MultiSelect
              options={filterOptions?.legion?.map((option) => ({ value: option, label: option[0].toUpperCase() + option.slice(1) })) || []}
              value={legion}
              onChange={handleLegionSelect}
              placeholder="Legion"
              className="cursor-pointer text-xs"
            />
            <button onClick={clearFilters} className="ml-2 text-xs text-gray-400 hover:text-gray-200 transition-colors cursor-pointer border border-gray-400 rounded p-0.5">
              Clear
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-1 overflow-hidden">
          {loading ? (
            <LoadingState label="Loading your decks…" className="h-full" />
          ) : decks.length === 0 ? (
            <div className="text-center py-8 h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
                <AppIcon name="card-gallery" className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-400 text-base">No decks found</p>
              <p className="text-gray-500 text-sm mt-1">Create your first deck to get started!</p>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {decks.map(deck => {
                  return(
                  <div 
                    key={deck._id.toString()}
                    className="cursor-pointer group relative" 
                    onClick={handleDeckSelect(deck._id.toString())}
                  >
                    <div
                      className="text-white bg-amber-900 w-full h-0 absolute bottom-0 overflow-hidden group-hover:h-6 text-center"
                      onClick={handleDeleteDeckClick(deck._id.toString())}
                    >
                      DELETE
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-1 hover:bg-white/10 transition-colors">
                      <div className="flex justify-center mb-1">
                        {deck.coverCard ? renderCardTile(deck.coverCard, 0, () => null) : (
                          <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-slate-700/60 text-gray-400">♜</div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-white truncate">
                          {deck.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {deck.mainDeckSize} cards · Side {deck.sideDeckSize}/15
                        </p>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
