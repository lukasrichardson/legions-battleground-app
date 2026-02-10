import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { closeImportDeckModal } from "@/client/redux/modalsSlice";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/client/ui/button";
import { Input } from "@/client/ui/input";
import { Card, CardContent } from "@/client/ui/card";
import { useAuth } from "@/client/hooks/useAuth";
import CardImage from "../Card/CardImage";

interface ToolboxCard {
  qty: number,
  image: string,
  type: string,
  id: string,
  thumb: string,
}

interface ToolboxDeck {
  id: string;
  name: string;
  description: string;
  cards_in_deck: ToolboxCard[];
  legion: string;
}

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(`/api/toolboxDecks/${deckId}`);
      if (!res.data.id) throw new Error("Deck not found");
      const deckToSet: ToolboxCard[] = [];
      Object.values(res.data.cards_in_deck as ToolboxCard[]).forEach((card: ToolboxCard) => {
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
      setDeck({ ...res.data, cards_in_deck: deckToSet });
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
        console.log("err from preview deck", err.message);
        setError("Error: " + err.message);
      } else {
        console.log("err from preview deck", err);
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
      dispatch(closeImportDeckModal());
      setError("");
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

  const renderModalContent = () => (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header inside content */}
      <div className="text-center mb-6">
        <p className="text-gray-300 text-base max-w-md mx-auto leading-relaxed">Paste a deck ID to fetch and preview your deck before importing.</p>
      </div>

      {/* Form Card */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-sm shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white">{DeckIdLabelText}</label>
              <Input
                type="text"
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                placeholder="4938"
                name="deckId"
                autoComplete="on"
                autoFocus
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 h-12 transition-all duration-200"
                required
              />
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  {HelpBlurb} {" "}
                  <a
                    href="https://legionstoolbox.com/my-decks"
                    target="_blank"
                    className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors duration-200"
                  >
                    {HelpLinkText}
                  </a>
                </p>
              </div>
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

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              disabled={loading}
            >
              {GeneratePreviewText}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Deck Preview */}
      {deck && (
        <div className="mt-8">
          <h4 className="text-xl font-semibold text-white mb-3">Deck Preview</h4>
          <div className="text-gray-300 mb-4 space-y-1">
            <div><span className="font-medium text-white">Name:</span> {deck.name}</div>
            <div><span className="font-medium text-white">Id:</span> {deck.id}</div>
          </div>

          {(deck && deck.name && deck.id && deck.legion && deck.cards_in_deck) && (
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
                  card ?
                    <div key={card.id ?? 'card' + index.toString()} className="w-[90px] h-[120px] relative">
                      <CardImage
                        src={card.thumb || card.image}
                        alt={`Card ${index + 1}`}
                        className="w-24 h-32 object-cover rounded-lg border border-white/20"
                      />
                    </div>
                    : null

                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
  useEffect(() => {
    return () => {
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
    }
  }, [importDeckModalOpen])
  return (
    <Modal
      open={importDeckModalOpen !== false}
      closeModal={() => dispatch(closeImportDeckModal())}
      modalHeader={
        <div className="flex items-center justify-between w-full p-6 pb-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">{TitleText}</span>
          </div>
          <button
            onClick={() => dispatch(closeImportDeckModal())}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
      modalContent={loading ? renderLoading() : renderModalContent()}
    />
  )
}