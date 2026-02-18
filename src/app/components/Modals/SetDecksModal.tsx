import styles from "@/app/styles/modals.module.css";
import { useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/client/hooks/useClickOutside";
import { useAppSelector } from "@/client/redux/hooks";
import Modal from "./Modal";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from '@/client/enums/GameEvent';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/client/ui/select";
import { fetchDecks } from "@/client/utils/api.utils";
import { Button } from "@/client/ui/button";


const ModalConstants = {
  ModalHeader: "Change Deck(s)",
  p2DeckLabel: "Player 2 Deck",
  p1DeckLabel: "Player 1 Deck",
  SubmitBtnText: "Submit",
}

export default function SetDecksModal({ closeModal }: { closeModal: () => void }) {
  const [p2DeckId, setP2DeckId] = useState<string | null>(null);
  const [p1DeckId, setP1DeckId] = useState<string | null>(null);
  const [decks, setDecks] = useState<{ name: string, _id: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, closeModal as () => void);
  const modalState = useAppSelector((state) => state.modalsState);
  const gameState = useAppSelector((state) => state.gameState);
  const { p2DeckFromServer, p1DeckFromServer } = gameState.game;
  const { setDecksModalOpen } = modalState;
  const open = setDecksModalOpen;
  const {
    ModalHeader,
    p2DeckLabel,
    p1DeckLabel,
    SubmitBtnText
  } = ModalConstants;

  const getDecks = async () => {
    fetchDecks((param: { name: string, _id: string }[]) => { setDecks(param) });
  }

  useEffect(() => {
    getDecks();
    handleP1DeckIdChange(p1DeckFromServer?._id?.toString() || "");
    handleP2DeckIdChange(p2DeckFromServer?._id?.toString() || "");
  }, [p1DeckFromServer?._id, p2DeckFromServer?._id, open]);

  const renderModalHeader = () => (
    <div className="flex items-center justify-between w-full p-6 pb-0">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <span className="text-xl font-bold text-white">{ModalHeader}</span>
      </div>
      <button
        onClick={closeModal}
        className="text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
  const handleSetDecks = async () => {
    emitGameEvent({ type: GAME_EVENT.resetGame, data: { p2DeckId: p2DeckId, p1DeckId: p1DeckId } });
    closeModal();
  }
  const handleP2DeckIdChange = (id: string) => {
    console.log("setting p2 deck id to", id);
    setP2DeckId(id);
  }
  const handleP1DeckIdChange = (id: string) => {
    console.log("setting p1 deck id to", id);
    setP1DeckId(id);
  }

  const renderModalContent = () => (
    <div className={styles.setDecksModal}>
      <div>
        <label className="block text-sm font-semibold text-white">
          {p1DeckLabel}
        </label>
        <Select value={p1DeckId} onValueChange={handleP1DeckIdChange}>
          <SelectTrigger className="h-6 w-32 text-xs bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Select deck" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {decks.map((deckOption, index) => (
                <SelectItem key={deckOption._id + `${index}`} value={deckOption._id}>
                  {deckOption.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

      </div>
      <div>
        <label className="block text-sm font-semibold text-white">
          {p2DeckLabel}
        </label>
        <Select value={p2DeckId} onValueChange={handleP2DeckIdChange}>
          <SelectTrigger className="h-6 w-32 text-xs bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Select deck" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {decks.map((deckOption, index) => (
                <SelectItem key={deckOption._id + `${index}`} value={deckOption._id}>
                  {deckOption.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {/* Submit Button */}
      <Button
        type="button"
        className="w-fit bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold my-2 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        onClick={handleSetDecks}
      >
        <div className="flex items-center justify-center gap-2">
          <span>{SubmitBtnText}</span>
        </div>
      </Button>
    </div>
  )
  if (!open) return null;
  return (
    <Modal open={open} closeModal={closeModal} modalHeader={renderModalHeader()} modalContent={renderModalContent()} />
  )
}