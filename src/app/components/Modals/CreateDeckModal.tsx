import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useRouter } from "next/navigation";
import { Button } from "@/client/ui/button";
import { Input } from "@/client/ui/input";
import { Card, CardContent } from "@/client/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/client/ui/select";
import { createDeck, fetchFilterOptions } from "@/client/utils/api.utils";

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
    fetchFilterOptions(setFilterOptions);
  }, [])

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
      const newDeck: { _id: string, id: string } = await createDeck({ name: deckName.trim(), legion: selectedLegion }, () => null);
      setDeckName("");
      setSelectedLegion("");
      setError("");
      closeModal();
      router.push(`/decks/${newDeck._id || newDeck.id}`);
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
    closeModal();
  };

  // Auto-clear errors after user input
  useEffect(() => {
    if (error && (deckName || selectedLegion)) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [deckName, selectedLegion, error]);

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-white/20 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-lg text-white font-medium mt-6">{LoadingText}</p>
      <div className="flex space-x-1 mt-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );

  const renderModalContent = () => (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-8">
        <p className="text-gray-300 text-base max-w-md mx-auto leading-relaxed">{CreateDeckDescription}</p>
      </div>

      {/* Form Card */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-sm shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleCreateDeck} className="space-y-6">
            {/* Deck Name */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white">
                {DeckNameLabelText} <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                name="deckName"
                autoComplete="off"
                autoFocus
                className={`bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-12 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${error && !deckName.trim()
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                placeholder="Enter deck name"
                required
                disabled={loading}
              />
            </div>

            {/* Legion Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white">
                {LegionLabelText} <span className="text-red-400">*</span>
              </label>
              <Select value={selectedLegion} onValueChange={setSelectedLegion} disabled={loading}>
                <SelectTrigger className={`bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-12 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${error && !selectedLegion
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
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-300 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white font-semibold py-4 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Deck...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>{CreateDeckBtnText}</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Modal
      open={open}
      closeModal={handleClose}
      modalHeader={
        <div className="flex items-center justify-between w-full p-6 pb-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">{CreateDeckBtnText}</span>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
      modalContent={loading ? renderLoading() : renderModalContent()}
    />
  );
}
