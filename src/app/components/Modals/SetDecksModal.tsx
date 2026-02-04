import styles from "@/app/styles/modals.module.css";
import { MouseEventHandler, useRef, useState } from "react";
import { useClickOutside } from "@/client/hooks/useClickOutside";
import { useAppSelector } from "@/client/redux/hooks";
import Modal from "./Modal";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from '@/client/enums/GameEvent';

const ModalConstants = {
  ModalHeader: "Change Deck(s)",
  CloseBtnText: "close",
  p2DeckLabel: "Player 2Deck Id: ",
  p1DeckLabel: "Player 1 Deck Id: ",
  SubmitBtnText: "Submit",
}

export default function SetDecksModal({closeModal}: {closeModal: () => void}) {
  const [p2DeckId, setP2DeckId] = useState<string|null>(null);
  const [p1DeckId, setP1DeckId] = useState<string|null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, closeModal as () => void);
  const modalState = useAppSelector((state) => state.modalsState);
  const { setDecksModalOpen } = modalState;
  const open = setDecksModalOpen;
  const {
    ModalHeader,
    CloseBtnText,
    p2DeckLabel,
    p1DeckLabel,
    SubmitBtnText
  } = ModalConstants;
  if (!open) return null;

  const renderModalHeader = () => (
    <>
      <span className={styles.modalHeaderTitle}>{ModalHeader}</span>
      <button className={styles.modalCloseButton} onClick={closeModal as MouseEventHandler<HTMLButtonElement>}>{CloseBtnText}</button>
    </>
  )
  const setDecks = async () => {
    emitGameEvent({type: GAME_EVENT.resetGame, data: {p2DeckId: p2DeckId, p1DeckId: p1DeckId}});
    closeModal();
  }
  const handleP2DeckIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setP2DeckId(e.target.value);
  }
  const handleP1DeckIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setP1DeckId(e.target.value);
  }

  const renderModalContent = () => (
    <div className={styles.setDecksModal}>
      <label htmlFor="p2DeckId">{p2DeckLabel}</label>
      <input type="text" placeholder="type deck id from toolbox" name="p2DeckId" onChange={handleP2DeckIdChange} value={p2DeckId || undefined}/>
      <label htmlFor="p1DeckId">{p1DeckLabel}</label>
      <input type="text" placeholder="type deck id from toolbox" name="p1DeckId" onChange={handleP1DeckIdChange} value={p1DeckId || undefined}/>
              <button className="submitSetDecks cursor-pointer" onClick={setDecks}>{SubmitBtnText}</button>
      <span>{"."}</span>
      <span>{"."}</span>
      <span>{"."}</span>
      <span>{"."}</span>
      <span>sample blastforge deck id: 4938</span>
      <span>sample prometheus deck id: 4738</span>
    </div>
  )
  return (
    <Modal open={open} closeModal={closeModal} modalHeader={renderModalHeader()} modalContent={renderModalContent()}/>
  )
}