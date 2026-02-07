// import { MultiSelect } from "@/app/components/Multiselect";
import { useEffect, useMemo, useRef, useState } from "react";
import { CardDocument } from "@/client/interfaces/Card.mongo";
import { fetchCards, fetchFilterOptions } from "@/client/utils/api.utils";
import { Input } from "@/client/ui/input";
import { Card, CardContent} from "@/client/ui/card";
import { Button } from "@/client/ui/button";
import { MultiSelect } from "@/client/ui/multiselect";
import { SearchCardTile } from "./CardTile";
import { preloadSearchResults } from "@/client/utils/imagePreloader";

export default function SearchPane({
  setHoveredCard,
  handleAddCardToDeck,
  deckLegion,
  gallery = false
}: {
  setHoveredCard: (card: CardDocument | null) => void,
  handleAddCardToDeck: (card) => void,
  deckLegion: string | null,
  gallery?: boolean
}) {
  const [legion, setLegion] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cards, setCards] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [filterOptions, setFilterOptions] = useState({});
  const [type, setType] = useState<string[]>([]);
  const [rarity, setRarity] = useState<string[]>([]);
  const [set, setSet] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (deckLegion) {
      setLegion([deckLegion.charAt(0).toUpperCase() + deckLegion.slice(1), "Bounty"]);
    }
  }, [deckLegion]);

  useEffect(() => {
    const getCards = async () => {
      const res = await fetchCards({ legion: deckLegion && legion.length === 0 ? [deckLegion.charAt(0).toUpperCase() + deckLegion.slice(1), "Bounty"] : legion, query: debouncedQuery, page, pageSize, type, rarity, set });
      if (res?.cards) {
        setCards(res.cards);
      }
      if (res?.total || res?.total === 0) {
        setTotal(res.total);
      }
    }
    getCards();
    getFilterOptions();
  }, [legion, debouncedQuery, page, pageSize, type, rarity, set, deckLegion]);

  // Preload search result images with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (cards.length > 0) {
        console.log(`[SearchPane] Preloading ${Math.min(cards.length, 20)} search result images`);
        try {
          preloadSearchResults(cards);
        } catch (error) {
          console.warn('[SearchPane] Preload failed:', error);
        }
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [cards]);


  const handleLegionSelect = (legionVal: string[]) => {
    resetPage();
    setLegion(legionVal);
  }

  const handleTypeSelect = (typeVal: string[]) => {
    resetPage();
    setType(typeVal);
  }

  const handleRaritySelect = (rarityVal: string[]) => {
    resetPage();
    setRarity(rarityVal);
  }

  const handleSetSelect = (setVal: string[]) => {
    resetPage();
    setSet(setVal);
  }

  const handleSearchChange = (e) => {
    resetPage();
    setQuery(e.target.value);
  }

  const handleSearchedCardClick = async (e, card) => {
    e.preventDefault();
    handleAddCardToDeck(card);
  }

  const getFilterOptions = async () => {
    fetchFilterOptions(setFilterOptions);
  }

  const nextPage = () => {
    setPageAndScrollTop(page + 1);
  }

  const prevPage = () => {
    setPageAndScrollTop(page > 1 ? page - 1 : 1);
  }

  const resetPage = () => {
    setPageAndScrollTop(1);
  }

  const setPageAndScrollTop = (newPage: number) => {
    setPage(newPage);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }

  const filterOptionsForDeckLegion = useMemo(() => {
    if (!deckLegion) return filterOptions;
    return {
      ...filterOptions,
      legion: [deckLegion.charAt(0).toUpperCase() + deckLegion.slice(1), "Bounty"],
    };
  }, [filterOptions, deckLegion]);
  const handleOnScroll = (e) => {
    e.preventDefault();
    e.currentTarget.scrollLeft += e.deltaY;
  }

  return (
    <Card className="bg-white/10 border-white/20 text-white h-full flex flex-col">
      <CardContent className="p-2 pt-0 h-full flex flex-col overflow-hidden">
        {/* Search and Filters - Compact for mobile */}
        <div className="space-y-1 mb-2 flex-1/4">
          <Input
            value={query}
            onChange={handleSearchChange}
            placeholder="Search cards..."
            className="bg-white/10 border-white/20 text-white placeholder-gray-400 h-6 text-xs"
          />

          {/* Only show filters on larger screens to save space on mobile */}
          <div className="hidden lg:block">
            {(Object.keys(filterOptionsForDeckLegion).length > 0) && (
              <div className="space-y-1">
                {Object.keys(filterOptionsForDeckLegion).map((key) => (
                  <MultiSelect
                    key={key}
                    options={filterOptionsForDeckLegion[key].map((option) => ({ value: option, label: option }))}
                    value={key === 'legion' ? legion : key === 'type' ? type : key === 'rarity' ? rarity : set}
                    onChange={key === 'legion' ? handleLegionSelect : key === 'type' ? handleTypeSelect : key === 'rarity' ? handleRaritySelect : handleSetSelect}
                    placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)}`}
                    className="cursor-pointer text-xs"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination Controls - Compact */}
          <div className="flex justify-center gap-1">
            {page > 1 && (
              <Button onClick={prevPage} size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-5 px-1 text-xs">
                Prev
              </Button>
            )}
              <div className="text-center text-xs text-gray-300">
              Page {page} of {total / pageSize > 0 ? Math.ceil(total / pageSize) : 1} ({total} cards)
              </div>
            {total / pageSize > page && (
              <Button onClick={nextPage} size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-5 px-1 text-xs">
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Cards List - Scrollable with smaller card sizes to match deck */}
        <div className="grow lg:overflow-auto">
          {cards.length === 0 ? (
            <div className="text-center py-2 h-full flex flex-col items-center justify-center">
              <div className="w-6 h-6 bg-gray-700/50 rounded-full flex items-center justify-center mb-1">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-400 text-xs">No cards found</p>
              <p className="text-gray-500 text-xs mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div
              ref={scrollRef}
            >
              {gallery ? <div onWheel={handleOnScroll} className="flex flex-wrap overflow-x-hidden overflow-y-auto">
                {cards.map((card, index) => (
                  <div
                    key={card.toString() + index}
                    className="max-w-full xs:max-w-1/2 sm:max-w-1/3 md:max-w-1/4 lg:max-w-1/6 cursor-pointer max-h-full inline-block box-border"
                    onClick={(e) => handleSearchedCardClick(e, card)}
                  >
                    
                    <SearchCardTile card={card} index={index} onContextMenu={handleSearchedCardClick} onMouseEnter={setHoveredCard} />
                  </div>
                ))}
              </div> : <div onWheel={handleOnScroll} className="lg:flex lg:justify-center lg:flex-wrap h-full overflow-x-scroll overflow-y-hidden lg:overflow-x-hidden lg:overflow-y-auto whitespace-nowrap">
                {cards.map((card, index) => (
                  <div
                    key={card.toString() + index}
                    className="max-w-1/3 xs:max-w-1/4 sm:max-w-1/6 md:max-w-1/7 lg:max-w-1/5 cursor-pointer max-h-full inline-block box-border"
                    onClick={(e) => handleSearchedCardClick(e, card)}
                  >
                    
                    <SearchCardTile card={card} index={index} onContextMenu={handleSearchedCardClick} onMouseEnter={setHoveredCard} />
                  </div>
                ))}
              </div>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}