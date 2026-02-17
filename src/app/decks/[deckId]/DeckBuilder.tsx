
import React, { useEffect, useState} from "react";
import { useParams} from 'next/navigation'
import { CardDocument } from "@/client/interfaces/Card.mongo";
import Preview from "./Preview";
import DeckGrid from "./components/DeckGrid";
import SearchPane from "./components/SearchPane";
import DeckEditorHeader from "./components/DeckEditorHeader";
import { fetchDeckById, patchDeckById } from "@/client/utils/api.utils";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import { preloadDeckImages } from "@/client/utils/imagePreloader";
import FullPage from "@/app/components/FullPage";
import { CARD_TYPE } from "@/shared/enums/CardType";

export default function DeckBuilder() {
  const params = useParams<{ deckId: string }>()
  const [hoveredCard, setHoveredCard] = useState<CardDocument | null>(null);
  const [deck, setDeck] = useState<DeckResponse | null>(null); // TODO: Fix type - should be properly typed but DeckResponse interface doesn't match actual usage
  const [saving, setSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [deckListRefreshTrigger, setDeckListRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchDeck = async () => {
      if (!params.deckId) return;
      fetchDeckById(params.deckId, (data) => setDeck(data as DeckResponse));
    }
    fetchDeck();
    return () => { setDeck(null) };
  }, [params?.deckId]);

  // Preload deck images when deck is loaded
  useEffect(() => {
    if (deck?.cards_in_deck?.length) {
      try {
        preloadDeckImages(deck.cards_in_deck);
      } catch (error) {
        console.warn('[DeckBuilder] Preload failed:', error);
      }
    }
  }, [deck?.cards_in_deck]);
  
  const handleRemoveCardFromDeck = async (card) => {
    const cardInDeckIndex = deck.cards_in_deck.findIndex(item => item.id === card.id);
    if (cardInDeckIndex || cardInDeckIndex === 0) {
      setSaving(true);
      patchDeckById(deck._id.toString(), {
        ...deck,
        cards_in_deck: deck.cards_in_deck.filter((_, i) => i !== cardInDeckIndex)
      }, (deckRes) =>{
        setDeck(deckRes as DeckResponse);
        setSaving(false);
      });
    }
  }

  const handleAddCardToDeck = async (card) => {
    if (card) {
      setSaving(true);
      patchDeckById(deck._id.toString(), {
        ...deck,
        cards_in_deck: [...deck.cards_in_deck, card]
      }, (deckRes) =>{
        setDeck(deckRes as DeckResponse);
        setSaving(false);
      });
    }
  }

  const handleSortClick = async () => {
    const counts = {};
    deck.cards_in_deck.forEach(card => {
      counts[card.id] = (counts[card.id] || 0) + 1;
    });
    const warriors = deck.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.WARRIOR);
    const unifieds = deck.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.UNIFIED);
    const fortifieds = deck.cards_in_deck.filter(item => item?.card_type?.names?.[0] === CARD_TYPE.FORTIFIED);
    const restOfDeck = deck.cards_in_deck.filter(item => ![CARD_TYPE.WARRIOR.toString(), CARD_TYPE.UNIFIED.toString(), CARD_TYPE.FORTIFIED.toString()].includes(item?.card_type?.names?.[0]));
    const sortedDeck = {
      ...deck,
      cards_in_deck: [...warriors.sort((a, b) => {
        return counts[b.id] - counts[a.id];
      }), ...unifieds.sort((a, b) => {
        return counts[b.id] - counts[a.id];
      }), ...fortifieds.sort((a, b) => {
        return counts[b.id] - counts[a.id];
      }), ...restOfDeck.sort((a, b) => {
        return counts[b.id] - counts[a.id];
      })]
      
    };
    setSaving(true);
    patchDeckById(deck._id.toString(), sortedDeck, (deckRes) =>{
      setDeck(deckRes as DeckResponse);
      setSaving(false);
    });
  }

  const handleStartEditingName = () => {
    setEditedName(deck?.name || '');
    setIsEditingName(true);
  }

  const handleCancelEditingName = () => {
    setIsEditingName(false);
    setEditedName('');
  }

  const handleSaveDeckName = async () => {
    if (editedName.trim() && editedName !== deck.name) {
      setSaving(true);
      patchDeckById(deck._id.toString(), {
        ...deck,
        name: editedName.trim()
      }, (deckRes) => {
        setDeck(deckRes as DeckResponse);
        setIsEditingName(false);
        setEditedName('');
        setSaving(false);
        // Only trigger refresh if name actually changed
        if ((deckRes as DeckResponse).name !== deck.name) {
          setDeckListRefreshTrigger(prev => prev + 1);
        }
      });
    } else {
      setIsEditingName(false);
      setEditedName('');
    }
  }

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveDeckName();
    } else if (e.key === 'Escape') {
      handleCancelEditingName();
    }
  }

  return (
    <FullPage showBreadcrumbs={true}>
        {/* Header - Fixed height, no overflow issues */}
        <div className="h-auto mb-1">
          <DeckEditorHeader 
            deck={deck}
            isEditingName={isEditingName}
            editedName={editedName}
            saving={saving}
            onStartEditingName={handleStartEditingName}
            onCancelEditingName={handleCancelEditingName}
            onSaveDeckName={handleSaveDeckName}
            onNameChange={setEditedName}
            onNameKeyPress={handleNameKeyPress}
            deckListRefreshTrigger={deckListRefreshTrigger}
          />
        </div>
        
        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 min-h-0 flex flex-col-reverse lg:flex-row gap-2">
          {/* Deck Grid Pane - Full width on mobile, left side on large screens */}
          <div className="flex-2 lg:flex-3 min-h-0 order-1 lg:order-1">
            <DeckGrid
              deck={deck}
              setHoveredCard={setHoveredCard}
              handleRemoveCardFromDeck={handleRemoveCardFromDeck}
              handleSortClick={handleSortClick}
              saving={saving}
              handleAddCardToDeck={handleAddCardToDeck}
            />
          </div>
          
          {/* Right Sidebar - Search and Preview on large screens */}
          <div className="flex flex-1 lg:flex-1 flex-col gap-2 order-2 lg:order-2 lg:w-80 xl:w-96">
            {/* Preview Pane - Only show on large screens */}
            <div className="hidden lg:block h-1/3">
              <Preview hoveredCard={hoveredCard} />
            </div>
            
            {/* Search Pane - Responsive height to prevent overlap on small screens */}
            <div className="h-full lg:h-2/3 overflow-hidden">
              <SearchPane
                setHoveredCard={setHoveredCard}
                handleAddCardToDeck={handleAddCardToDeck}
                deckLegion={deck?.legion || null}
              />
            </div>
          </div>
        </div>
    </FullPage>
  );
}
