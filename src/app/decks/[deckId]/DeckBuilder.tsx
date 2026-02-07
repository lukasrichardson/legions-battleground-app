
import React, { useEffect, useState} from "react";
import { useParams} from 'next/navigation'
import { CardDocument } from "@/client/interfaces/Card.mongo";
import Preview from "./Preview";
import DeckGrid from "./components/DeckGrid";
import SearchPane from "./components/SearchPane";
import DeckEditorHeader from "./components/DeckEditorHeader";
import { fetchDeckById, patchDeckById } from "@/client/utils/api.utils";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";

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
    const sortedDeck = {
      ...deck,
      cards_in_deck: deck.cards_in_deck.sort((a, b) => {
        // Sort by card type first, then by name
        const typeA = a.card_type.names[0];
        const typeB = b.card_type.names[0];
        if (typeA < typeB) return 1;
        if (typeA > typeB) return -1;
        return a.title.localeCompare(b.title);
      })
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
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900/80 to-slate-900 overflow-hidden">
      <div className="h-full flex flex-col px-2 py-2">
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
            />
          </div>
          
          {/* Right Sidebar - Search and Preview on large screens */}
          <div className="flex flex-1 lg:flex-1 flex-col gap-2 order-2 lg:order-2 lg:w-80 xl:w-96">
            {/* Preview Pane - Only show on large screens */}
            <div className="hidden lg:block h-1/3 overflow-hidden">
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
      </div>
    </div>
  );
}
