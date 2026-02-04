"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/client/ui/card";
import { Button } from "@/client/ui/button";
import { Input } from "@/client/ui/input";
// import Image from 'next/image';

// Type definitions
interface CardDocument {
  _id: string;
  id: number;
  title: string;
  featured_image: string;
  text: string;
  card_code: string;
  card_type: {
    names: string[];
    slugs: string[];
  };
  legion: {
    names: string[];
    slugs: string[];
  };
}

// API functions with improved error handling
const fetchCards = async ({legion, query, page, pageSize}: {legion?: string[], query?: string, page: number, pageSize: number}) => {
  try {
    const params = new URLSearchParams();
    if (legion && legion.length > 0) {
      legion.forEach(l => params.append('legion', l));
    }
    if (query) params.append('query', query);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    const url = `/api/cards?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { cards: data.cards || [], total: data.total || 0 };
  } catch (error) {
    console.error('Error fetching cards:', error);
    return { cards: [], total: 0 };
  }
};

const fetchFilterOptions = async () => {
  try {
    const response = await fetch('/api/filterOptions');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {};
  }
};

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 840'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#e5e7eb'/>
        <stop offset='100%' stop-color='#cbd5e1'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
  </svg>`);

export default function CardsPage() {
  const [legion, setLegion] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<CardDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});
  const [hoveredCard, setHoveredCard] = useState<CardDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const getCards = async () => {
      setLoading(true);
      try {
        const res = await fetchCards({ legion, query, page, pageSize });
        setCards(res.cards);
        setTotal(res.total);
      } catch {
        setCards([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }
    getCards();
  }, [legion, query, page, pageSize]);

  useEffect(() => {
    const getFilterOptions = async () => {
      try {
        const options = await fetchFilterOptions();
        setFilterOptions(options);
      } catch {
        setFilterOptions({});
      }
    }
    getFilterOptions();
  }, []);

  const handleLegionSelect = (value: string) => {
    resetPage();
    setLegion(value ? [value] : []);
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetPage();
    setQuery(e.target.value);
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

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Card Gallery</h1>
              <p className="text-gray-300">Browse and explore all cards in Legions Realms At War</p>
            </div>
            <Button 
              onClick={() => window.history.back()}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              ← Back
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 border-white/20 text-white sticky top-6">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                    </svg>
                  </div>
                  Search & Filter
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-200">Search</label>
                  <Input
                    type="text"
                    placeholder="Search cards..."
                    value={query}
                    onChange={handleSearchChange}
                    className="w-full bg-white/10 border-white/20 text-white placeholder-gray-400 rounded-lg"
                  />
                </div>

                {/* Legion Filter */}
                {Object.keys(filterOptions).length > 0 && (
                  <div className="space-y-4">
                    {Object.keys(filterOptions).map((key) => (
                      <div key={key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-200">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </label>
                        <select
                          value={legion[0] || ''}
                          onChange={(e) => handleLegionSelect(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 text-white rounded-lg p-2 text-sm"
                        >
                          <option value="" className="bg-gray-800">All {key}</option>
                          {filterOptions[key].map((option) => (
                            <option key={option} value={option} className="bg-gray-800">{option}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination Info */}
                <div className="pt-4 border-t border-white/10">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-300">
                      Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} of {total} cards
                    </p>
                    <p className="text-xs text-gray-400">
                      Page {page} of {totalPages}
                    </p>
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex justify-center gap-2">
                    <Button 
                      onClick={prevPage} 
                      disabled={page === 1}
                      size="sm" 
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </Button>
                    <Button 
                      onClick={nextPage} 
                      disabled={page >= totalPages}
                      size="sm" 
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cards Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-lg">Loading cards...</span>
                  </div>
                </CardContent>
              </Card>
            ) : cards.length === 0 ? (
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No cards found</h3>
                  <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                </CardContent>
              </Card>
            ) : (
              <div 
                ref={scrollRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {cards.map((card, index) => (
                  <Card
                    key={card._id + index}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-200 transform hover:scale-105 cursor-pointer group"
                    onMouseEnter={() => setHoveredCard(card)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <CardContent className="p-3">
                      {/* Card Image */}
                      <div className="aspect-[2.5/3.5] mb-3 rounded-lg overflow-hidden bg-gray-800/50 relative">
                        <img
                          src={card.featured_image || PLACEHOLDER}
                          alt={card.title || 'Card'}
                          className="object-cover group-hover:scale-110 transition-transform duration-200"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                          }}
                        />
                        {/* <Image
                          src={card.featured_image || PLACEHOLDER}
                          alt={card.title || 'Card'}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-200"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                          }}
                        /> */}
                      </div>

                      {/* Card Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{card.title}</h3>
                        
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          {card.card_type?.names?.[0] && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              card.card_type.names[0] === 'Warrior' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              card.card_type.names[0] === 'Warlord' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              card.card_type.names[0] === 'Guardian' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                              card.card_type.names[0] === 'Synergy' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                              card.card_type.names[0] === 'Fortified' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                              card.card_type.names[0] === 'Unified' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                              'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                            }`}>
                              {card.card_type.names[0]}
                            </span>
                          )}
                          {card.card_code && (
                            <span className="text-xs text-gray-400 font-mono">{card.card_code}</span>
                          )}
                        </div>
                        
                        {card.legion?.names?.[0] && (
                          <div className="text-xs text-gray-400">
                            <span className="bg-gray-700/50 px-2 py-1 rounded">
                              {card.legion.names[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Preview Modal/Overlay */}
      {hoveredCard && hoveredCard.featured_image && (
        <div className="fixed top-4 right-4 z-50 pointer-events-none">
          <Card className="bg-black/90 border-white/30 shadow-2xl backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="w-64 aspect-[2.5/3.5] rounded-lg overflow-hidden relative">
                <img
                  src={hoveredCard.featured_image}
                  alt={hoveredCard.title || 'Card Preview'}
                  className="object-cover"
                  sizes="256px"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                  }}
                />
                {/* <Image
                  src={hoveredCard.featured_image}
                  alt={hoveredCard.title || 'Card Preview'}
                  fill
                  className="object-cover"
                  sizes="256px"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                  }}
                /> */}
              </div>
              <div className="mt-3 text-center">
                <h4 className="text-white font-semibold">{hoveredCard.title}</h4>
                <p className="text-gray-400 text-sm">{hoveredCard.card_type?.names?.[0]}</p>
                {hoveredCard.legion?.names?.[0] && (
                  <p className="text-gray-500 text-xs">{hoveredCard.legion.names[0]}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}