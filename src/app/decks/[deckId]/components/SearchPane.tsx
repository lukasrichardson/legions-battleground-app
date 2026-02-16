import { useEffect, useMemo, useRef, useState } from "react";
import { CardDocument } from "@/client/interfaces/Card.mongo";
import { fetchCards, fetchFilterOptions } from "@/client/utils/api.utils";
import { Input } from "@/client/ui/input";
import { Card, CardContent } from "@/client/ui/card";
import { Button } from "@/client/ui/button";
import { MultiSelect } from "@/client/ui/multiselect";
import { SearchCardTile } from "./CardTile";
import { preloadSearchResults } from "@/client/utils/imagePreloader";
import { legionColours } from "@/client/constants/colours.constants";
import { LEGIONS } from "@/client/constants/legions.constants";

export default function SearchPane({
  setHoveredCard,
  handleAddCardToDeck,
  deckLegion,
  gallery = false
}: {
  setHoveredCard: (card: CardDocument | null) => void,
  handleAddCardToDeck: (card: CardDocument) => void,
  deckLegion: string | null,
  gallery?: boolean
}) {
  const [legion, setLegion] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cards, setCards] = useState<CardDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [filterOptions, setFilterOptions] = useState({});
  const [type, setType] = useState<string[]>([]);
  const [rarity, setRarity] = useState<string[]>([]);
  const [set, setSet] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const horizontalScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (deckLegion) {
      if (deckLegion === "Bounty" || deckLegion === "bounty") {
        setLegion([LEGIONS.BOUNTY]);
      } else {
        setLegion([deckLegion.charAt(0).toUpperCase() + deckLegion.slice(1), LEGIONS.BOUNTY]);
      }
    }
  }, [deckLegion]);

  useEffect(() => {
    const getCards = async () => {
      const fetchCardsObject = {
        legion: deckLegion && legion.length === 0 ? (deckLegion === "Bounty" || deckLegion === "bounty" ? [LEGIONS.BOUNTY] : [deckLegion.charAt(0).toUpperCase() + deckLegion.slice(1), LEGIONS.BOUNTY]) : legion,
        query: debouncedQuery,
        page,
        pageSize,
        type,
        rarity,
        set
      }
      const res: { cards?: CardDocument[]; total?: number } = await fetchCards(fetchCardsObject);
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
    if (horizontalScrollRef.current) {
      horizontalScrollRef.current.scrollLeft = 0;
    }
  }

  const filterOptionsForDeckLegion = useMemo(() => {
    if (!deckLegion) return filterOptions;
    return {
      ...filterOptions,
      legion: (deckLegion === "Bounty" || deckLegion === "bounty") ? [LEGIONS.BOUNTY] : [deckLegion.charAt(0).toUpperCase() + deckLegion.slice(1), LEGIONS.BOUNTY],
    };
  }, [filterOptions, deckLegion]);

  const preloadNextPage = () => {
    fetchCards({
      legion: deckLegion && legion.length === 0 ? (deckLegion === "Bounty" || deckLegion === "bounty" ? [LEGIONS.BOUNTY] : [deckLegion.charAt(0).toUpperCase() + deckLegion.slice(1), LEGIONS.BOUNTY]) : legion,
      query: debouncedQuery,
      page: page + 1,
      pageSize,
      type,
      rarity,
      set
    }).then(res => {
      if (res?.cards) {
        preloadSearchResults(res.cards);
      } else {
        console.warn('[SearchPane] Scroll-triggered preload returned no cards');
      }
    }).catch(error => {
      console.warn('[SearchPane] Scroll-triggered preload failed:', error);
    });
  }

  const handleOnScroll = (e) => {
    e.preventDefault();
    e.currentTarget.scrollLeft += e.deltaY;
    const scrollPercent = e.currentTarget.scrollLeft / (e.currentTarget.scrollWidth - e.currentTarget.clientWidth);
    // Trigger next page preload when user scrolls 80% to the right
    if (scrollPercent > 0.8 && total > pageSize * page) {
      preloadNextPage();
    }
  }

  const handleVerticalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercent = scrollTop / (scrollHeight - clientHeight);
    // Trigger next page preload when user scrolls 80% down
    if (scrollPercent > 0.8 && total > pageSize * page) {
      preloadNextPage();
    }
  }

  const clearFilters = () => {
    setLegion([]);
    setType([]);
    setRarity([]);
    setSet([]);
  }

  useEffect(() => {
    return () => {
      setLegion([]);
      setType([]);
      setRarity([]);
      setSet([]);
      setCards([]);
      setHoveredCard(null);
      setTotal(0);
      setPage(1);
      setQuery("");
      setDebouncedQuery("");
    }
  }, [setHoveredCard]);

  return (
    <Card className="bg-white/10 border-white/20 text-white h-full flex flex-col">
      <CardContent className="p-2 pt-0 h-full flex flex-col overflow-hidden">
        {/* Search and Filters - Compact for mobile */}
        <div className="space-y-1 mb-2">
          <label htmlFor="search-input" className="text-xs">Search</label>
          <Input
            id="search-input"
            value={query}
            onChange={handleSearchChange}
            placeholder="Search cards..."
            className="bg-white/10 border-white/20 text-white placeholder-gray-400 h-6 text-xs"
          />

          {/* Only show filters on larger screens to save space on mobile */}
          <div className="hidden lg:block">
            {(Object.keys(filterOptionsForDeckLegion).length > 0) && (
              <div className="space-y-0.5">
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
                <Button onClick={clearFilters} size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-5 px-1 text-xs">
                Clear
              </Button>
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
        <div ref={scrollRef} onScroll={handleVerticalScroll} className="grow overflow-auto shadow-black shadow-2xl">
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
            >
              {gallery ? <div onWheel={handleVerticalScroll} className="flex flex-wrap overflow-x-hidden overflow-y-auto">
                {cards.map((card, index) => (
                  <div
                    key={card.toString() + index}
                    className="w-full xs:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/6 xl:w-1/10 cursor-pointer max-h-full inline-block box-border relative"
                    onClick={(e) => handleSearchedCardClick(e, card)}
                  >

                    <SearchCardTile card={card} index={index} onContextMenu={handleSearchedCardClick} onMouseEnter={setHoveredCard} />
                  </div>
                ))}
              </div> : <div ref={horizontalScrollRef} onWheel={handleOnScroll} className="lg:flex lg:items-start lg:justify-start lg:flex-wrap h-full overflow-x-scroll overflow-y-hidden lg:overflow-x-hidden lg:overflow-y-auto whitespace-nowrap">
                {cards.map((card, index) => (
                  <div
                    key={card.toString() + index}
                    className="inline-block w-1/3 xs:w-1/4 sm:w-1/6 md:w-1/7 lg:w-full cursor-pointer max-h-full lg:flex justify-start items-start overflow-hidden rounded p-1 pr-0.5 my-0.5"
                    
                    onClick={(e) => handleSearchedCardClick(e, card)}
                  >
                    <div className="w-full lg:w-1/5 xl:w-1/7 h-full">
                      <SearchCardTile card={card} index={index} onContextMenu={handleSearchedCardClick} onMouseEnter={setHoveredCard} />
                    </div>
                    <div className="hidden w-4/5 lg:flex flex-col xl:w-6/7 h-full justify-between">
                      <span className="text-wrap text-sm font-extrabold tracking-tighter underline">{card.title}</span>
                      <span className="text-wrap text-xs font-semibold w-fit p-0.5 my-0.5 rounded" style={{ backgroundColor: legionColours[card.legion.names[0]] ? `${legionColours[card.legion.names[0]]}` : "", color: card.legion.names[0] === LEGIONS.ANGELS ? "black" : "white" }}>{card.legion.names[0]} | {card.card_type.names[0]}</span>
                      <div className="flex justify-between"><span className="text-wrap text-xs">{card.rarity.names[0]}</span>
                        <span className="text-wrap text-xs">{card.card_code}</span>
                      </div>
                    </div>
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