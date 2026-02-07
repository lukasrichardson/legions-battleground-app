import Breadcrumbs from "../../components/Breadcrumbs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/client/ui/select";
import { fetchDecks } from "@/client/utils/api.utils";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DeckEditorHeaderProps {
  deck?: DeckResponse | null;
  isEditingName: boolean;
  editedName: string;
  saving: boolean;
  onStartEditingName: () => void;
  onCancelEditingName: () => void;
  onSaveDeckName: () => void;
  onNameChange: (value: string) => void;
  onNameKeyPress: (e: React.KeyboardEvent) => void;
  deckListRefreshTrigger?: number;
}

export default function DeckEditorHeader({
  deck,
  isEditingName,
  editedName,
  saving,
  onStartEditingName,
  onCancelEditingName,
  onSaveDeckName,
  onNameChange,
  onNameKeyPress,
  deckListRefreshTrigger
}: DeckEditorHeaderProps) {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getDecks = async () => {
      try {
        setLoading(true);
        setError(null);
        fetchDecks((param) => {
          setDecks((param as unknown[]) || []);
          setLoading(false);
        });
      } catch (err) {
        setError('Failed to load decks');
        setLoading(false);
        console.error('Error fetching decks:', err);
      }
    };
    getDecks();
  }, [deckListRefreshTrigger]);

  const handleDeckChange = (selectedId: string) => {
    if (selectedId && selectedId !== (deck?._id || deck?.id)) {
      router.push(`/decks/${selectedId}`);
    }
  };

  const handleDeleteDeckClick = () => {
    axios.delete(`/api/decks/${deck?._id || deck?.id}`).then(() => {
      router.push(`/decks`);
    }).catch((err) => {
      console.error("Error deleting deck:", err);
    });
  }

  const handleCreateDuplicateClick = () => {
    axios.post(`/api/decks/${deck?._id}/duplicate`).then((response) => {
      const newDeckId = response.data.deck._id || response.data.deck.id;
      router.push(`/decks/${newDeckId}`);
    }).catch((err) => {
      console.error("Error duplicating deck:", err);
    });
  }

  return (
    <div className="space-y-1 py-1">
      {/* Breadcrumbs */}
      <div className="mb-1 absolute top-2 left-2">
        <Breadcrumbs breadcrumbs={[{ name: "Home", path: "/" }, { name: "Decks", path: "/decks" }]} />
      </div>

      {/* Title and Deck Selector */}
      <div className="text-center space-y-1">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
          Deck Editor
        </h1>
        <h3 className="text-sm text-gray-400">Left Click to add cards, Right Click to remove cards</h3>

        {/* Deck Selector */}
        <div className="flex items-center justify-center gap-3">
          <Select value={deck?._id?.toString()} onValueChange={handleDeckChange} disabled={loading}>
            <SelectTrigger className="h-8 w-40 text-sm bg-white/10 border-white/20 text-white">
              <SelectValue placeholder={loading ? "Loading..." : "Select deck"} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Your Decks</SelectLabel>
                {error ? (
                  <div className="px-2 py-1 text-xs text-red-400">{error}</div>
                ) : (
                  decks.map((deckOption) => (
                    <SelectItem key={deckOption._id} value={deckOption._id.toString()}>
                      {deckOption.name} ({deckOption.legion})
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          <button onClick={handleDeleteDeckClick} className="text-red-500 hover:underline cursor-pointer">Delete Deck</button>
          <div className="text-center">
            {isEditingName ? (
              <div className="inline-flex items-center gap-2 flex-wrap justify-center">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => onNameChange(e.target.value)}
                  onKeyDown={onNameKeyPress}
                  className="bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="Deck name"
                  autoFocus
                  disabled={saving}
                />
                <button
                  onClick={onSaveDeckName}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2 py-1 rounded text-sm cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEditingName}
                  disabled={saving}
                  className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-2 py-1 rounded text-sm cursor-pointer"
                >
                  Cancel
                </button>
                {saving && <span className="text-white/70 text-xs">Saving...</span>}
              </div>
            ) : (
              <button
                onClick={onStartEditingName}
                className="group text-white/90 hover:text-white transition-colors cursor-pointer"
                disabled={saving}
              >
                <span className="text-sm font-medium">
                  {deck?.name || 'Unnamed Deck'}
                </span>
                <span className="ml-1 opacity-40 group-hover:opacity-100 transition-opacity text-xs">
                  ✏️
                </span>
              </button>
            )}
            <span className="text-white/70 text-xs">{"(" + (deck?.legion || 'Unknown Legion') + ")"}</span>
          </div>
          <button className="cursor-pointer border-white border-1 rounded p-0.5" onClick={handleCreateDuplicateClick}><span className="text-white">Copy</span></button>
        </div>
      </div>

    </div>
  )
}