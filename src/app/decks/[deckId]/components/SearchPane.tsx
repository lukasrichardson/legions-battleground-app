import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CardDocument } from "@/shared/interfaces/Card.mongo";
import { fetchBanlist, fetchCards, fetchFilterOptions, postBanlistUpdate } from "@/client/utils/api.utils";
import { Input } from "@/client/ui/input";
import { Card, CardContent } from "@/client/ui/card";
import { Button } from "@/client/ui/button";
import { MultiSelect } from "@/client/ui/multiselect";
import { SearchCardTile } from "./CardTile";
import { preloadSearchResults } from "@/client/utils/imagePreloader";
import { cardTypeColours, legionColours } from "@/client/constants/colours.constants";
import { LEGIONS } from "@/client/constants/legions.constants";
import BanlistItem, { BanlistStatus } from "@/shared/interfaces/BanlistItem.mongo";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { decodeHTMLEntities } from "@/client/utils/string.util";
import LoadingState from "@/app/components/LoadingState";
import Modal from "@/app/components/Modals/Modal";
import AppIcon from "@/app/components/AppIcon";
import { EmptyState } from "@/client/ui/empty-state";
import { InlineStatus } from "@/client/ui/inline-status";

export default function SearchPane({
  setHoveredCard,
  handleAddCardToDeck,
  deckLegion,
  gallery = false,
  addTarget = "main",
  onAddTargetChange,
  onSelectCard,
  onClearSelectedCard,
  selectedCardId = null,
}: {
  setHoveredCard: (card: CardDocument | null, banlistItem?: BanlistItem | null) => void,
  handleAddCardToDeck: (card: CardDocument) => void,
  deckLegion: string | null,
  gallery?: boolean,
  addTarget?: "main" | "side",
  onAddTargetChange?: (target: "main" | "side") => void,
  onSelectCard?: (card: CardDocument, banlistItem: BanlistItem | null) => void,
  onClearSelectedCard?: () => void,
  selectedCardId?: string | null,
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
  const [srlStatus, setSrlStatus] = useState<string[]>([]);
  const [banlist, setBanlist] = useState<BanlistItem[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [cardLoadError, setCardLoadError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const horizontalScrollRef = useRef<HTMLDivElement | null>(null);
  const isScrollingRef = useRef(false);
  const scrollStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloadedPageKeyRef = useRef<string | null>(null);
  const cardRequestIdRef = useRef(0);
  const setHoveredCardRef = useRef(setHoveredCard);
  setHoveredCardRef.current = setHoveredCard;

  useEffect(() => {
    void fetchBanlist().then(setBanlist).catch((error) => console.warn("[SearchPane] Banlist request failed:", error));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const getCards = async () => {
      const requestId = ++cardRequestIdRef.current;
      const fetchCardsObject = {
        legion: deckLegion && legion.length === 0 ? (deckLegion === "Bounty" || deckLegion === "bounty" ? [LEGIONS.BOUNTY] : [deckLegion.charAt(0).toUpperCase() + deckLegion.slice(1), LEGIONS.BOUNTY]) : legion,
        query: debouncedQuery,
        page,
        pageSize,
        type,
        rarity,
        set,
        srlStatus,
      }
      setLoadingCards(true);
      setCardLoadError("");
      try {
        const res: { cards?: CardDocument[]; total?: number } = await fetchCards(fetchCardsObject);
        if (requestId !== cardRequestIdRef.current) return;
        if (res?.cards) {
          setCards(res.cards);
        }
        if (res?.total || res?.total === 0) {
          setTotal(res.total);
        }
      } catch (error) {
        if (requestId === cardRequestIdRef.current) {
          console.warn("[SearchPane] Card request failed:", error);
          setCardLoadError("Could not load cards. Please try again.");
        }
      } finally {
        if (requestId === cardRequestIdRef.current) {
          setLoadingCards(false);
        }
      }
    }
    void getCards();
    return () => {
      cardRequestIdRef.current += 1;
    };
  }, [legion, debouncedQuery, page, pageSize, type, rarity, set, srlStatus, deckLegion]);

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

  const handleSrlStatusSelect = (statusValues: string[]) => {
    resetPage();
    setSrlStatus(statusValues);
  }

  const handleSearchChange = (e) => {
    resetPage();
    setQuery(e.target.value);
  }

  const handleSearchedCardClick = async (e, card) => {
    e.preventDefault();
    handleAddCardToDeck(card);
  }

  useEffect(() => {
    let active = true;
    void fetchFilterOptions()
      .then((options) => {
        if (active) setFilterOptions(options);
      })
      .catch((error) => console.warn("[SearchPane] Filter options request failed:", error));
    return () => {
      active = false;
    };
  }, []);

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

  const criteriaKey = useMemo(
    () => [debouncedQuery, page, legion.join("|"), type.join("|"), rarity.join("|"), set.join("|"), srlStatus.join("|")].join("\u0000"),
    [debouncedQuery, legion, page, rarity, set, srlStatus, type],
  );
  const previewCriteriaKey = useMemo(
    () => [debouncedQuery, legion.join("|"), type.join("|"), rarity.join("|"), set.join("|"), srlStatus.join("|")].join("\u0000"),
    [debouncedQuery, legion, rarity, set, srlStatus, type],
  );

  const preloadNextPage = () => {
    if (preloadedPageKeyRef.current === criteriaKey || total <= pageSize * page) {
      return;
    }
    preloadedPageKeyRef.current = criteriaKey;
    fetchCards({
      legion: deckLegion && legion.length === 0 ? (deckLegion === "Bounty" || deckLegion === "bounty" ? [LEGIONS.BOUNTY] : [deckLegion.charAt(0).toUpperCase() + deckLegion.slice(1), LEGIONS.BOUNTY]) : legion,
      query: debouncedQuery,
      page: page + 1,
      pageSize,
      type,
      rarity,
      set,
      srlStatus,
    }).then(res => {
      if (res?.cards) {
        void preloadSearchResults(res.cards);
      } else {
        console.warn('[SearchPane] Scroll-triggered preload returned no cards');
      }
    }).catch(error => {
      if (preloadedPageKeyRef.current === criteriaKey) {
        preloadedPageKeyRef.current = null;
      }
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
    isScrollingRef.current = true;
    if (scrollStopTimeoutRef.current) {
      clearTimeout(scrollStopTimeoutRef.current);
    }
    scrollStopTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 120);

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
    setSrlStatus([]);
    setPageAndScrollTop(1);
    setQuery("");
    setDebouncedQuery("");
  }

  useEffect(() => {
    return () => {
      if (scrollStopTimeoutRef.current) {
        clearTimeout(scrollStopTimeoutRef.current);
      }
      cardRequestIdRef.current += 1;
      setHoveredCardRef.current(null);
    }
  }, []);

  const handleCardSrlClick = async (card, status) => {
    setBanlist(await postBanlistUpdate({
      name: card.title,
      status
    }));
  }

  const suspendedCards = useMemo(() => {
    const suspended = {};
    banlist.forEach(item => {
      if (item.status === BanlistStatus.SUSPENDED) {
        suspended[item.name] = true;
      }
    });
    return suspended;
  }, [banlist]);

  const restrictedCards = useMemo(() => {
    const restricted = {};
    banlist.forEach(item => {
      if (item.status === BanlistStatus.RESTRICTED) {
        restricted[item.name] = true;
      }
    });
    return restricted;
  }, [banlist]);

  const limitedCards = useMemo(() => {
    const limited = {};
    banlist.forEach(item => {
      if (item.status === BanlistStatus.LIMITED) {
        limited[item.name] = true;
      }
    });
    return limited;
  }, [banlist]);

  const banlistByName = useMemo(() => new Map(banlist.map((item) => [item.name, item])), [banlist]);
  const handleGalleryCardHover = useCallback((card: CardDocument) => {
    if (!isScrollingRef.current) {
      setHoveredCard(card, banlistByName.get(card.title) ?? null);
    }
  }, [banlistByName, setHoveredCard]);
  const activeFilterCount = legion.length + type.length + rarity.length + set.length + srlStatus.length;
  const hasActiveCriteria = Boolean(query || activeFilterCount);
  const resultStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const resultEnd = Math.min(page * pageSize, total);
  const getBanlistItem = (card: CardDocument) => banlistByName.get(card.title) ?? null;
  const previousPreviewCriteriaKey = useRef(previewCriteriaKey);

  useEffect(() => {
    if (previousPreviewCriteriaKey.current !== previewCriteriaKey) {
      previousPreviewCriteriaKey.current = previewCriteriaKey;
      if (gallery) {
        setHoveredCard(null);
        if (selectedCardId) {
          onClearSelectedCard?.();
        }
      }
    }
  }, [gallery, onClearSelectedCard, previewCriteriaKey, selectedCardId, setHoveredCard]);

  const galleryFilters = (className = "", menuPlacement: "popover" | "viewport" | "inline" = "popover") => (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {Object.keys(filterOptionsForDeckLegion).map((key) => (
        <MultiSelect
          key={key}
          options={filterOptionsForDeckLegion[key].map((option) => ({ value: option, label: key === 'srlStatus' ? option.charAt(0).toUpperCase() + option.slice(1) : option }))}
          value={key === 'legion' ? legion : key === 'type' ? type : key === 'rarity' ? rarity : key === 'set' ? set : srlStatus}
          onChange={key === 'legion' ? handleLegionSelect : key === 'type' ? handleTypeSelect : key === 'rarity' ? handleRaritySelect : key === 'set' ? handleSetSelect : handleSrlStatusSelect}
          placeholder={key === 'srlStatus' ? 'S/R/L Status' : `${key.charAt(0).toUpperCase() + key.slice(1)}`}
          menuPlacement={menuPlacement}
          className="cursor-pointer text-xs [&_button]:min-h-10 [&_button]:bg-secondary [&_button]:px-3"
        />
      ))}
      {hasActiveCriteria && <Button onClick={clearFilters} type="button" variant="ghost" className="min-h-10 px-2 text-sm text-cyan-100 hover:bg-white/10 hover:text-white">Clear all</Button>}
    </div>
  );

  return (
    <Card className={gallery ? "h-full border-white/10 bg-slate-900/75 text-white shadow-xl shadow-black/20" : "bg-white/10 border-white/20 text-white h-full flex flex-col"}>
      <CardContent className={gallery ? "flex h-full flex-col overflow-hidden p-3 sm:p-4" : "p-2 pt-0 h-full flex flex-col overflow-hidden"}>
        <div className={gallery ? "mb-2 space-y-1" : "space-y-1 mb-2"}>
          <div className="flex">

          {onAddTargetChange && (
            <div className="flex items-center gap-1 text-xs text-white/80">
              <span className="mr-1">Add to:</span>
              <Button type="button" size="sm" onClick={() => onAddTargetChange("main")} className={`h-6 px-2 text-xs text-white ${addTarget === "main" ? "bg-blue-600 hover:bg-blue-500" : "bg-white/10 hover:bg-white/20"}`}>
                Main Deck
              </Button>
              <Button type="button" size="sm" onClick={() => onAddTargetChange("side")} className={`h-6 px-2 text-xs text-white ${addTarget === "side" ? "bg-purple-600 hover:bg-purple-500" : "bg-white/10 hover:bg-white/20"}`}>
                Side Deck
              </Button>
            </div>
          )}
          <Input
            id="search-input"
            value={query}
            onChange={handleSearchChange}
            placeholder="Search cards..."
            aria-label="Search cards"
            className={gallery ? "h-11 border-white/15 bg-slate-950/60 px-3 text-sm text-white placeholder:text-slate-500 focus-visible:ring-cyan-300 max-w-lg" : "bg-white/10 border-white/20 text-white h-6 text-xs placeholder:text-white/50"}
          />

          {gallery ? <>
            <div className="flex items-center justify-between gap-2 lg:hidden">
              <Button type="button" onClick={() => setFiltersOpen(true)} variant="outline" className="min-h-11 border-cyan-200/25 bg-cyan-300/10 px-4 text-cyan-50 hover:bg-cyan-300/20">
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Button>
            </div>
            <div className="hidden lg:block">{galleryFilters()}</div>
          </> : <div className="block">
            {(Object.keys(filterOptionsForDeckLegion).length > 0) && (
              <div className="md:space-y-0.5">
                {Object.keys(filterOptionsForDeckLegion).map((key) => (
                  <MultiSelect
                    key={key}
                    options={filterOptionsForDeckLegion[key].map((option) => ({ value: option, label: key === 'srlStatus' ? option.charAt(0).toUpperCase() + option.slice(1) : option }))}
                    value={key === 'legion' ? legion : key === 'type' ? type : key === 'rarity' ? rarity : key === 'set' ? set : srlStatus}
                    onChange={key === 'legion' ? handleLegionSelect : key === 'type' ? handleTypeSelect : key === 'rarity' ? handleRaritySelect : key === 'set' ? handleSetSelect : handleSrlStatusSelect}
                    placeholder={key === 'srlStatus' ? 'S/R/L' : `${key.charAt(0).toUpperCase() + key.slice(1)}`}
                    className="cursor-pointer text-xs"
                  />
                ))}
                <Button onClick={clearFilters} size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-5 px-1 text-xs">
                  Clear
                </Button>
              </div>
            )}
          </div>}
          </div>

          <div className={gallery ? "flex items-center justify-between gap-2 border-white/10" : "flex justify-center gap-1"}>
            <Button onClick={prevPage} size="sm" variant="outline" disabled={page <= 1} className={gallery ? "min-h-10 border-white/15 bg-white/5 px-3 text-slate-100 hover:bg-white/10" : "bg-white/10 border-white/20 text-white hover:bg-white/20 h-5 px-1 text-xs"}>
              Prev
            </Button>
            <div className={gallery ? "text-center text-xs text-slate-400" : "text-center text-xs text-gray-300"}>
              {gallery ? `Showing ${resultStart}–${resultEnd} of ${total.toLocaleString()}` : `Page ${page} of ${total / pageSize > 0 ? Math.ceil(total / pageSize) : 1} (${total} cards)`}
            </div>
            {total / pageSize > page && (
              <Button onClick={nextPage} size="sm" variant="outline" className={gallery ? "min-h-8 border-white/15 bg-white/5 px-3 text-slate-100 hover:bg-white/10" : "bg-white/10 border-white/20 text-white hover:bg-white/20 h-5 px-1 text-xs"}>
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Cards List - Scrollable with smaller card sizes to match deck */}
        <div ref={scrollRef} onScroll={handleVerticalScroll} className="grow overflow-auto shadow-black shadow-2xl">
          {loadingCards ? (
            gallery ? <div aria-label="Loading cards" className="grid grid-cols-2 gap-2 p-1 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:gap-4 xl:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 12 }, (_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-xl border border-white/5 bg-slate-800/80" />)}
            </div> : <LoadingState label="Loading cards…" className="h-full" />
          ) : cardLoadError ? (
            <div className="flex h-full items-center justify-center"><InlineStatus variant="error">{cardLoadError}</InlineStatus></div>
          ) : cards.length === 0 ? (
            <EmptyState
              icon={<AppIcon name="search" size={20} />}
              title="No cards found"
              description="Try adjusting your search criteria."
              action={gallery && hasActiveCriteria ? <Button type="button" onClick={clearFilters} variant="outline" className="min-h-10 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">Clear all filters</Button> : undefined}
            />
          ) : (
            <div
            >
              {gallery ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:gap-4 xl:grid-cols-5 2xl:grid-cols-6">
                {cards.map((card, index) => (
                  <div
                    key={card._id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect ${decodeHTMLEntities(card.title)}${selectedCardId === card._id ? ", selected" : ""}`}
                    className={`group relative box-border max-h-full cursor-pointer rounded-xl p-0.5 outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${selectedCardId === card._id ? "bg-cyan-300 shadow-lg shadow-cyan-950/50" : "hover:bg-white/10"}`}
                    onClick={() => onSelectCard?.(card, getBanlistItem(card))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectCard?.(card, getBanlistItem(card));
                      }
                    }}
                  >
                    {process.env.NODE_ENV === "development" && <div className="absolute opacity-0 hover:opacity-100 w-1/2 h-full bg-white/50 z-1 flex flex-col items-center justify-center gap-1 cursor-default">
                      <div className="bg-gray-500 cursor-pointer" onClick={() => handleCardSrlClick(card, BanlistStatus.SUSPENDED)}>0</div>
                      <div className="bg-gray-500 cursor-pointer" onClick={() => handleCardSrlClick(card, BanlistStatus.RESTRICTED)}>1</div>
                      <div className="bg-gray-500 cursor-pointer" onClick={() => handleCardSrlClick(card, BanlistStatus.LIMITED)}>2</div>
                      <div className="bg-gray-500 cursor-pointer" onClick={() => handleCardSrlClick(card, BanlistStatus.UNRESTRICTED)}>-</div>
                    </div>}
                    {suspendedCards[card.title] && (
                      <div className="absolute top-1 right-2 bg-red-500 text-white text-[20px] px-1 py-0.5 rounded z-10">
                        0
                      </div>
                    )}
                    {restrictedCards[card.title] && (
                      <div className="absolute top-1 right-2 bg-yellow-500 text-white text-[20px] px-1 py-0.5 rounded z-10">
                        1
                      </div>
                    )}
                    {limitedCards[card.title] && (
                      <div className="absolute top-1 right-2 bg-purple-500 text-white text-[20px] px-1 py-0.5 rounded z-10">
                        2
                      </div>
                    )}
                    <SearchCardTile card={card} index={index} eagerImage={index < 6} onContextMenu={handleSearchedCardClick} onMouseEnter={handleGalleryCardHover} />
                  </div>
                ))}
              </div> : <div ref={horizontalScrollRef} onWheel={handleOnScroll} className="lg:flex lg:items-start lg:justify-start lg:flex-wrap h-full overflow-x-scroll overflow-y-hidden lg:overflow-x-hidden lg:overflow-y-auto whitespace-nowrap">
                {cards.map((card, index) => (
                  <div
                    key={card.toString() + index}
                    className="bg-white/10 hover:bg-white/20 inline-block w-1/3 xs:w-1/4 sm:w-1/6 md:w-1/7 lg:w-full cursor-pointer max-h-full lg:flex justify-start items-center overflow-hidden rounded pr-0.5 border-b-white border-b-2 relative "
                    style={{ backgroundColor: legionColours[card.legion.names[0]] ? `${legionColours[card.legion.names[0]]}` : "", color: [LEGIONS.ANGELS.toString(), LEGIONS.TITANS.toString()].includes(card.legion.names[0]) ? "black" : "white"}}
                    onClick={(e) => handleSearchedCardClick(e, card)}
                  >
                    <div className="w-full lg:w-1/7 xl:w-1/8 h-full relative z-2">
                      {suspendedCards[card.title] && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[16px] px-1 py-0.5 rounded z-10">
                          0
                        </div>
                      )}
                      {restrictedCards[card.title] && (
                        <div className="absolute top-0 right-0 bg-yellow-500 text-white text-[16px] px-1 py-0.5 rounded z-10">
                          1
                        </div>
                      )}
                      {limitedCards[card.title] && (
                        <div className="absolute top-0 right-0 bg-purple-500 text-white text-[16px] px-1 py-0.5 rounded z-10">
                          2
                        </div>
                      )}
                      <SearchCardTile card={card} index={index} eagerImage={index < 6} onContextMenu={handleSearchedCardClick} onMouseEnter={setHoveredCard} />
                    </div>
                    <div className="hidden w-6/7 lg:flex flex-col xl:w-7/8 h-full justify-between" onClick={() => setHoveredCard(card)}>
                      <span className="text-md underline truncate">{decodeHTMLEntities(card.title)}</span>
                      <span>
                        <span className="text-[12px] font-semibold w-fit p-0.5 my-0.5 rounded" style={{ backgroundColor: cardTypeColours[card.card_type.names[0]] ? `${cardTypeColours[card.card_type.names[0]]}` : "", color: [CARD_TYPE.WARRIOR.toString(), CARD_TYPE.GUARDIAN.toString(), CARD_TYPE.SYNERGY.toString(), CARD_TYPE.VEIL_REALM.toString(), CARD_TYPE.WARLORD.toString()].includes(card.card_type.names[0]) ? "black" : "white" }}>
                          {card.card_type.names[0]}
                        </span>
                        <span className="text-[10px] ml-1">{card.rarity.names[0]}</span>
                      </span>
                      <div className="flex justify-between">
                        <span className="text-[8px]">{card.card_code}</span>
                      </div>
                    </div>
                    <div className="w-full h-full absolute bg-transparent hover:bg-white/20 transition-all duration-100"></div>
                  </div>
                ))}
              </div>}
            </div>
          )}
        </div>
        {gallery && <div className="lg:hidden">
          <Modal
            open={filtersOpen}
            closeModal={() => setFiltersOpen(false)}
            variant="bottom-sheet"
            ariaLabel="Card filters"
            modalHeader={<div className="flex items-center justify-between py-3"><span className="text-base font-semibold text-white">Filters</span><button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><AppIcon name="close" size={18} /></button></div>}
            modalContent={<div className="w-full pb-2">{galleryFilters("flex-col items-stretch [&_.relative]:w-full [&_button]:w-full", "viewport")}</div>}
          />
        </div>}
      </CardContent>
    </Card>
  )
}
