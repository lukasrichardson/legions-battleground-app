import { useState } from "react";
import Modal from "./Modal";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { closeImportDeckModal } from "@/client/redux/modalsSlice";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/client/ui/button";
import { Input } from "@/client/ui/input";
import { useAuth } from "@/client/hooks/useAuth";
import CardImage from "../Card/CardImage";
import { fetchToolboxDeck, type ToolboxCard, type ToolboxDeck } from "@/client/utils/toolboxDeck";
import { InlineStatus } from "@/client/ui/inline-status";
import LoadingState from "../LoadingState";
import PublicModalForm, { publicModalFieldClassName, publicModalInputClassName, publicModalLabelClassName } from "../PublicModalForm";
import PublicFormSubmitButton from "../PublicFormSubmitButton";
import PublicModalHeader from "../PublicModalHeader";

const ModalConstants = {
  LoadingText: "Loading...",
  DeckIdLabelText: "Toolbox Deck ID",
  HelpBlurb: "Deck IDs can be found in the URL when editing a deck on the",
  HelpLinkText: "Legions ToolBox Website",
  TitleText: "Import Deck from Toolbox",
  GeneratePreviewText: "Generate Preview",
  ImportButtonText: "Import Deck To Battleground",
}

export default function PreviewDeckModal() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const modalsState = useAppSelector((state) => state.modalsState);
  const { isAuthenticated } = useAuth();
  const { importDeckModalOpen } = modalsState;
  const [error, setError] = useState("");
  const [deckId, setDeckId] = useState("");
  const [loading, setLoading] = useState(false);
  const [deck, setDeck] = useState<ToolboxDeck | null>(null);
  const [warriors, setWarriors] = useState<ToolboxCard[] | null>(null);
  const [unifieds, setUnifieds] = useState<ToolboxCard[] | null>(null);
  const [fortifieds, setFortifieds] = useState<ToolboxCard[] | null>(null);
  const [warlord, setWarlord] = useState<ToolboxCard | null>(null);
  const [guardian, setGuardian] = useState<ToolboxCard | null>(null);
  const [realm, setRealm] = useState<ToolboxCard | null>(null);
  const [synergy, setSynergy] = useState<ToolboxCard | null>(null);

  const resetForm = () => {
    setError("");
    setDeckId("");
    setLoading(false);
    setDeck(null);
    setWarriors(null);
    setUnifieds(null);
    setFortifieds(null);
    setWarlord(null);
    setGuardian(null);
    setRealm(null);
    setSynergy(null);
  };

  const handleClose = () => {
    resetForm();
    dispatch(closeImportDeckModal());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchToolboxDeck(deckId.trim());
      if (!res.id) throw new Error("Deck not found");
      const deckToSet: ToolboxCard[] = [];
      Object.values(res.cards_in_deck).forEach((card: ToolboxCard) => {
        for (let i = 0; i < card.qty; i++) {
          deckToSet.push({
            ...card,
            image: card.image,
            thumb: card.thumb,
          });
        }
      })
      const warriorsToSet = deckToSet.filter((card: ToolboxCard) => card.type === "Warrior");
      const unifiedsToSet = deckToSet.filter((card: ToolboxCard) => card.type === "Unified");
      const fortifiedsToSet = deckToSet.filter((card: ToolboxCard) => card.type === "Fortified");
      const warlordToSet = deckToSet.find((card: ToolboxCard) => card.type === "Warlord");
      const guardianToSet = deckToSet.find((card: ToolboxCard) => card.type === "Guardian");
      const realmToSet = deckToSet.find((card: ToolboxCard) => card.type === "Veil / Realm");
      const synergyToSet = deckToSet.find((card: ToolboxCard) => card.type === "Synergy");
      setDeck({ ...res, cards_in_deck: deckToSet });
      setWarriors(warriorsToSet);
      setUnifieds(unifiedsToSet);
      setFortifieds(fortifiedsToSet);
      setWarlord(warlordToSet || null);
      setGuardian(guardianToSet || null);
      setRealm(realmToSet || null);
      setSynergy(synergyToSet || null);
      setLoading(false);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        // Axios error: response may contain server error details
        setError("Error: " + (err.response?.data ?? err.message));
      } else if (err instanceof Error) {
        setError("Error: " + err.message);
      } else {
        setError("Error: An Error Occurred, try again");
      }
      setLoading(false);
    }
  }

  const {
    LoadingText,
    DeckIdLabelText,
    HelpBlurb,
    HelpLinkText,
    TitleText,
    GeneratePreviewText,
    ImportButtonText,
  } = ModalConstants;


  const handleImportDeckClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Check authentication before proceeding
    if (!isAuthenticated) {
      setError("Please sign in to import decks");
      return;
    }

    try {
      const res = await axios.post(`${window.location.origin}/api/importDecks`, deck);
      router.push(`/decks/${res.data.id}`);
      handleClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        // Axios error: response may contain server error details
        setError("Error importing deck: " + (err.response?.data ?? err.message));
      } else if (err instanceof Error) {
        // Generic JS Error
        setError("Error importing deck: " + err.message);
      } else {
        setError("Error importing deck: An unknown error occurred");
      }
      return;
    }

  }

  const renderDeckPreview = () => deck && (
    <div className="mt-8">
      <h4 className="text-xl font-semibold text-white mb-3">Deck Preview</h4>
      <div className="text-gray-300 mb-4 space-y-1">
        <div><span className="font-medium text-white">Name:</span> {deck.name}</div>
        <div><span className="font-medium text-white">Id:</span> {deck.id}</div>
      </div>

      {(deck.name && deck.id && deck.legion && deck.cards_in_deck) && (
        <div className="sticky top-0 z-10 py-2">
          <Button
            onClick={handleImportDeckClick}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {ImportButtonText}
          </Button>
        </div>
      )}

      <div>
        <span className="block text-white font-medium mb-3">Cards:</span>
        <div className="flex flex-wrap gap-2">
          {([warlord, realm, synergy, guardian, ...(warriors || []), ...(unifieds || []), ...(fortifieds || [])] as ToolboxCard[])
            .map((card, index) => (
              card ? (
                <div key={card.id ?? 'card' + index.toString()} className="w-[90px] h-[120px] relative">
                  <CardImage
                    src={card.thumb || card.image}
                    alt={`Card ${index + 1}`}
                    className="w-24 h-32 object-cover rounded-lg border border-white/20"
                  />
                </div>
              ) : null
            ))}
        </div>
      </div>
    </div>
  );

  const renderModalContent = () => (
    <PublicModalForm
      description="Paste a deck ID to fetch and preview your deck before importing."
      afterForm={renderDeckPreview()}
    >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={publicModalFieldClassName}>
              <label htmlFor="toolbox-deck-id" className={publicModalLabelClassName}>{DeckIdLabelText}</label>
              <Input
                id="toolbox-deck-id"
                type="text"
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                placeholder="4938"
                name="deckId"
                autoComplete="on"
                autoFocus
                className={publicModalInputClassName}
                required
              />
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  {HelpBlurb} {" "}
                  <a
                    href="https://api.legionstoolbox.com/my-decks"
                    target="_blank"
                    className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors duration-200"
                  >
                    {HelpLinkText}
                  </a>
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && <InlineStatus variant="error">{error}</InlineStatus>}

            <PublicFormSubmitButton loading={loading} loadingLabel="Generating preview…" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              {GeneratePreviewText}
            </PublicFormSubmitButton>
          </form>
    </PublicModalForm>
  )
  return (
    <Modal
      open={importDeckModalOpen !== false}
      closeModal={handleClose}
      modalHeader={<PublicModalHeader title={TitleText} icon="import" onClose={handleClose} closeLabel="Close deck import" />}
      modalContent={loading ? <LoadingState label={LoadingText} className="min-h-64 border-white/20 bg-white/10" /> : renderModalContent()}
    />
  )
}
