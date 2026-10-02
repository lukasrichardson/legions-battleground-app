import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useRouter } from "next/navigation";
import { Input } from "@/client/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/client/ui/select";
import { createDeck, fetchFilterOptions } from "@/client/utils/api.utils";
import { InlineStatus } from "@/client/ui/inline-status";
import AppIcon from "../AppIcon";
import LoadingState from "../LoadingState";
import PublicModalForm, { publicModalFieldClassName, publicModalInputClassName, publicModalLabelClassName, publicModalSelectClassName } from "../PublicModalForm";
import PublicFormSubmitButton from "../PublicFormSubmitButton";
import PublicModalHeader from "../PublicModalHeader";

const ModalConstants = {
  LoadingText: "Creating your deck...",
  DeckNameLabelText: "Deck Name",
  LegionLabelText: "Legion",
  CreateDeckBtnText: "Create Deck",
  CreateDeckDescription: "Create a new deck to start building your strategy",
  SelectLegionPlaceholder: "Select a legion"
}

export default function CreateDeckModal({
  open,
  closeModal
}: {
  open: boolean;
  closeModal: () => void;
}) {
  const router = useRouter();
  const [deckName, setDeckName] = useState("");
  const [selectedLegion, setSelectedLegion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ legion: [] });

  const {
    LoadingText,
    DeckNameLabelText,
    LegionLabelText,
    CreateDeckBtnText,
    CreateDeckDescription,
    SelectLegionPlaceholder
  } = ModalConstants;

  useEffect(() => {
    if (!open) return
    void fetchFilterOptions<{ legion: string[] }>().then(setFilterOptions).catch((error) => console.warn("[CreateDeckModal] Filter request failed:", error));
  }, [open])

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deckName.trim()) {
      setError("Deck name is required");
      return;
    }

    if (!selectedLegion) {
      setError("Please select a legion");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const newDeck = await createDeck({ name: deckName.trim(), legion: selectedLegion });
      router.push(`/decks/${newDeck._id || newDeck.id}`);
      setDeckName("");
      setSelectedLegion("");
      setError("");
      closeModal();
    } catch (err) {
      console.error("Error creating deck:", err);
      setError("Failed to create deck. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDeckName("");
    setSelectedLegion("");
    setError("");
    setLoading(false);
    closeModal();
  };

  // Auto-clear errors after user input
  useEffect(() => {
    if (error && (deckName || selectedLegion)) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [deckName, selectedLegion, error]);

  const renderModalContent = () => (
    <PublicModalForm description={CreateDeckDescription}>
          <form onSubmit={handleCreateDeck} className="space-y-6">
            {/* Deck Name */}
            <div className={publicModalFieldClassName}>
              <label htmlFor="deck-name" className={publicModalLabelClassName}>
                {DeckNameLabelText} <span className="text-red-400">*</span>
              </label>
              <Input
                id="deck-name"
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                name="deckName"
                autoComplete="off"
                autoFocus
                className={`${publicModalInputClassName} ${error && !deckName.trim()
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                placeholder="Enter deck name"
                required
                disabled={loading}
              />
            </div>

            {/* Legion Selection */}
            <div className={publicModalFieldClassName}>
              <label htmlFor="deck-legion" className={publicModalLabelClassName}>
                {LegionLabelText} <span className="text-red-400">*</span>
              </label>
              <Select value={selectedLegion} onValueChange={setSelectedLegion} disabled={loading}>
                <SelectTrigger id="deck-legion" className={`${publicModalSelectClassName} ${error && !selectedLegion
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'focus:border-blue-500 focus:ring-blue-500/20'
                  }`}>
                  <SelectValue placeholder={SelectLegionPlaceholder} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20 text-white">
                  {filterOptions?.legion?.map((legion) => (
                    <SelectItem
                      key={legion}
                      value={legion}
                      className="text-white hover:bg-white/10 focus:bg-white/10"
                    >
                      {legion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error Display */}
            {error && <InlineStatus variant="error">{error}</InlineStatus>}

            {/* Submit Button */}
            <PublicFormSubmitButton loading={loading} loadingLabel="Creating deck…" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <AppIcon name="create" size={20} />
              <span>{CreateDeckBtnText}</span>
            </PublicFormSubmitButton>
          </form>
    </PublicModalForm>
  );

  return (
    <Modal
      open={open}
      closeModal={handleClose}
      modalHeader={<PublicModalHeader title={CreateDeckBtnText} icon="create" onClose={handleClose} closeLabel="Close create deck" disabled={loading} />}
      modalContent={loading ? <LoadingState label={LoadingText} className="min-h-64 border-white/20 bg-white/10" /> : renderModalContent()}
    />
  );
}
