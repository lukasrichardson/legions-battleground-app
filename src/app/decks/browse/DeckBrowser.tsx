"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import { renderCardTile } from "../[deckId]/components/CardTile";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { fetchPublishedDeckFilterOptions, fetchPublishedDecks } from "@/client/utils/api.utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FullPage from "@/app/components/FullPage";
import { MultiSelect } from "@/client/ui/multiselect";

export default function DeckBrowser() {
  const router = useRouter();
  const [decks, setDecks] = useState([]);
  const [legion, setLegion] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<{ legion: string[] }>({ legion: [] });

  const handleLegionSelect = (legionVal: string[]) => {
    setLegion(legionVal);
  }

  useEffect(() => {
    fetchPublishedDecks(legion, setDecks);
    fetchPublishedDeckFilterOptions(legion, (data: {legion: string[]}) => setFilterOptions(data));
  }, [legion])
  const handleDeckSelect = (deckId) => () => {
    if (!deckId) return;
    router.push("/decks/browse/" + deckId);
  }
  return (
    <FullPage showBreadcrumbs={true}>
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
          Published Decks
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
          Browse and Copy decks published by the community
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <Card className="bg-white/10 border-white/20 text-white h-full flex flex-col">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center justify-start text-lg">
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Published Decks
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
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-1 overflow-hidden">
            {decks.length === 0 ? (
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
                    const warlordOrNull = deck.cards_in_deck.find(card => card.card_type.names[0] === CARD_TYPE.WARLORD);
                    return (
                      <div
                        key={deck._id || deck.id}
                        className="cursor-pointer group relative"
                        onClick={handleDeckSelect(deck._id || deck.id)}
                      >
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
                          <div className="text-center">
                            <p className="text-sm font-medium text-white truncate">
                              {deck.name}
                              <span className="text-xs text-gray-400 mt-1">
                              {" - " + (deck.cards_in_deck?.filter(card => ![CARD_TYPE.WARLORD, CARD_TYPE.VEIL_REALM, CARD_TYPE.SYNERGY, CARD_TYPE.GUARDIAN].includes(card.card_type.names[0]))?.length || 0) + " cards"}
                              </span>
                            </p>
                          </div>
                          <div className="flex justify-center mb-2">
                            {renderCardTile(warlordOrNull || deck.cards_in_deck?.[0], 0, () => null)}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FullPage>
  )
}