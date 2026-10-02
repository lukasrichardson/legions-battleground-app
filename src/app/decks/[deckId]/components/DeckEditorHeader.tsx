import useIsMobile from "@/client/hooks/useIsMobile";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/client/ui/select";
import { Button } from "@/client/ui/button";
import { InlineStatus } from "@/client/ui/inline-status";
import { createPublishedDeck } from "@/client/utils/api.utils";
import { useDeckPickerOptions } from "@/client/hooks/useDeckPickerOptions";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const { options: decks, loading, error } = useDeckPickerOptions(true, deckListRefreshTrigger);
  const router = useRouter();
  const [actionPending, setActionPending] = useState<"copy" | "publish" | null>(null);
  const [actionError, setActionError] = useState("");
  const actionButtonClass = "h-9 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white";

  const handleDeckChange = (selectedId: string) => {
    setActionError("");
    if (selectedId && selectedId !== (deck?._id || deck?.id)) {
      router.push(`/decks/${selectedId}`);
    }
  };

  const handleStartEditing = () => {
    setActionError("");
    onStartEditingName();
  };

  const handleSaveName = () => {
    setActionError("");
    onSaveDeckName();
  };

  const handleDeleteDeckClick = () => {
    setActionError("");
    const deckId = deck?._id || deck?.id;
    if (!deckId) return;
    if (!window.confirm(`Delete ${deck?.name ?? "this deck"}? This cannot be undone.`)) return;
    axios.delete(`/api/decks/${deckId}`).then(() => {
      router.push("/decks");
    }).catch((err) => {
      console.error("Error deleting deck:", err);
    });
  };

  const handleCreateDuplicateClick = async () => {
    if (!deck?._id) return;
    setActionError("");
    setActionPending("copy");
    try {
      const response = await axios.post(`/api/decks/${deck._id}/duplicate`);
      const newDeckId = response.data.deck._id || response.data.deck.id;
      router.push(`/decks/${newDeckId}`);
    } catch (err) {
      console.error("Error duplicating deck:", err);
      setActionError("Could not copy this deck. Please try again.");
    } finally {
      setActionPending(null);
    }
  };

  const handlePublishDeckClick = async () => {
    if (!deck?._id) return;
    setActionError("");
    setActionPending("publish");
    try {
      const publishedDeck = await createPublishedDeck(deck._id.toString());
      router.push(`/decks/browse/${publishedDeck._id}`);
    } catch (err) {
      console.error("Error publishing deck:", err);
      setActionError("Could not publish this deck. Please try again.");
    } finally {
      setActionPending(null);
    }
  };
  const isMobile = useIsMobile();
  const actionsDisabled = saving || actionPending !== null;
  return (
    <div className="space-y-1">
      <div className="text-center flex flex-wrap">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Select value={deck?._id?.toString()} onValueChange={handleDeckChange} disabled={loading || Boolean(error) || actionsDisabled}>
            <SelectTrigger className="h-10 min-w-52 border-white/20 bg-white/10 text-sm text-white focus-visible:ring-2 focus-visible:ring-blue-400">
              <SelectValue placeholder={loading ? "Loading decks…" : error ? "Decks unavailable" : "Select deck"} />
            </SelectTrigger>
            <SelectContent className="border-white/20 bg-slate-800 text-white">
              <SelectGroup>
                {decks.map((deckOption) => (
                  <SelectItem key={deckOption._id} value={deckOption._id.toString()} className="text-white hover:bg-white/10 focus:bg-white/10">
                    {deckOption.name} ({deckOption.legion})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

        </div>
        {isEditingName ? (
              <div className="inline-flex flex-wrap items-center justify-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => onNameChange(e.target.value)}
                  onKeyDown={onNameKeyPress}
                  className="h-9 rounded border border-white/30 bg-white/10 px-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Deck name"
                  autoFocus
                  disabled={actionsDisabled}
                />
                <Button
                  type="button"
                  onClick={handleSaveName}
                  disabled={actionsDisabled}
                  className="h-9 bg-green-600 text-white hover:bg-green-700"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  onClick={onCancelEditingName}
                  disabled={actionsDisabled}
                  variant="outline"
                  className={actionButtonClass}
                >
                  Cancel
                </Button>
                {saving && <span className="text-white/70 text-xs">Saving...</span>}
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleStartEditing}
                variant="outline"
                className={actionButtonClass}
                disabled={actionsDisabled}
              >
                Rename
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleCreateDuplicateClick} className={actionButtonClass} disabled={actionsDisabled}>
              {actionPending === "copy" ? "Copying…" : "Copy"}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteDeckClick} className="h-9" disabled={actionsDisabled}>
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={handlePublishDeckClick} className="h-9 border-green-500/50 bg-green-500/10 text-green-300 hover:bg-green-500/20 hover:text-green-200" disabled={actionsDisabled}>
              {actionPending === "publish" ? "Publishing…" : "Publish"}
            </Button>
        {!isMobile && (<span className="text-sm text-gray-400">Click or Drag to add / remove cards from deck</span>)}

      </div>
      {error && <InlineStatus variant="error">{error}</InlineStatus>}
      {actionError && <InlineStatus variant="error">{actionError}</InlineStatus>}
    </div>
  )
}
