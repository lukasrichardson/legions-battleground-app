import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { MouseEventHandler, useState } from "react";
import Modal from "./Modal";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { moveCard } from "@/client/redux/gameStateSlice";
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import styles from "@/app/styles/modals.module.css";
import { Input } from "@/client/ui/input";

const ModalConstants = {
  CloseBtnText: "close",
  LabelBtnText: "card to draw:",
  PlunderBtnText: "Plunder",
  RandomBtnText: "Set as Random Card Number"
}

export default function PlunderModal({ closeModal }: { closeModal: () => void }) {
  const dispatch = useAppDispatch();
  const [cardToTake, setCardToTake] = useState<number | null>(null);
  const modalState = useAppSelector((state) => state.modalsState);
  const open = modalState.plunderModalOpen;
  const gameState = useAppSelector((state) => state.gameState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const { side } = clientGameState;
  const { p1PlayerDeck, p2PlayerDeck } = gameState;
  const p1 = side === "p1";
  const deckSize = p1 ? p1PlayerDeck.length : p2PlayerDeck.length;
  const validCardNumber = Number.isInteger(cardToTake) && cardToTake >= 2 && cardToTake <= deckSize;
  const {
    CloseBtnText,
    PlunderBtnText,
    LabelBtnText,
    RandomBtnText
  } = ModalConstants;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardToTake(e.target.value === "" ? null : Number(e.target.value));
  }

  const handleRandomNumber = () => {
    const min = 2;
    const max = deckSize;
    const range = max - min + 1;

    if (range <= 0) {
      return;
    }

    const randomBuffer = new Uint32Array(1);
    const maxUnbiased = Math.floor(0x100000000 / range) * range;
    let randomValue: number;

    do {
      window.crypto.getRandomValues(randomBuffer);
      randomValue = randomBuffer[0];
    } while (randomValue >= maxUnbiased);

    setCardToTake(min + (randomValue % range));
  }

  const handleHalf = () => {
    if (deckSize >= 2) {
      setCardToTake(Math.floor(deckSize / 2) + 1);
    }
  }

  const handlePlunder = () => {
    if (validCardNumber) {
      const cardToMove = p1 ? p1PlayerDeck[cardToTake - 1] : p2PlayerDeck[cardToTake - 1];
      dispatch(moveCard({
        id: cardToMove.id,
        from: p1 ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK,
        target: p1 ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND
      }));
      emitGameEvent({
        type: GAME_EVENT.moveCard, data: {
          id: cardToMove.id,
          from: { target: p1 ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK, targetIndex: cardToTake - 1 },
          target: p1 ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND,
        }
      });
      handleCloseModal();
    }
  }

  const renderDrawSuffix = () => {
    if (!cardToTake) return "";
    const string = cardToTake.toString();
    const lastChar = string[string.length - 1];

    if (string === "11" || string === "12" || string === "13") {
      return "th";
    } else if (lastChar === "1") {
      return "st"
    } else if (lastChar === "2") {
      return "nd"
    } else if (lastChar === "3") {
      return "rd"
    } else {
      return "th"
    }
  }

  const renderModalHeader = () => {
    return(
      <>
        <span>{PlunderBtnText}</span>
      </>
    )
  }

  const renderModalContent = () => (
    <div className="relative flex flex-col gap-3 items-center">
      <button className={styles.modalCloseButton} onClick={handleCloseModal as MouseEventHandler<HTMLButtonElement>}>{CloseBtnText}</button>
      {deckSize >=2 ? 
        <>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 pr-16">
          <label htmlFor="plunder-card-number">
            {LabelBtnText}
          </label>
          <Input id="plunder-card-number" aria-describedby="plunder-number-hint" aria-invalid={cardToTake !== null && !validCardNumber} className="min-w-0 flex-1 basis-40 border-sky-200/25 bg-slate-950/45 text-white focus:border-sky-300/70" name="plunderinput" type="number" inputMode="numeric" placeholder={`2–${deckSize}`} onChange={handleInputChange} value={cardToTake ?? ""} min={2} max={deckSize} step={1}/>
          {renderDrawSuffix()}
        </div>
        <p id="plunder-number-hint" className="text-sm text-slate-300">Enter a whole card position from 2 to {deckSize}.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <div><button className="cursor-pointer border border-sky-200/35 bg-slate-950/35 px-3 py-2 text-sm text-slate-100 transition hover:border-sky-200/65 hover:bg-blue-400/10" onClick={handleRandomNumber}>{RandomBtnText}</button></div>
          <div><button className="cursor-pointer border border-sky-200/35 bg-slate-950/35 px-3 py-2 text-sm text-slate-100 transition hover:border-sky-200/65 hover:bg-blue-400/10" onClick={handleHalf}>Set as half the deck</button></div>
        </div>
        <button disabled={!validCardNumber} className="min-h-11 cursor-pointer border border-sky-200/45 bg-[#246fb8] px-6 py-2 font-semibold text-white shadow-[0_0_14px_rgba(79,169,255,.22)] transition hover:bg-[#338de0] disabled:cursor-not-allowed disabled:opacity-50" onClick={handlePlunder}>{PlunderBtnText}</button>
      </> : "not enough cards to plunder"
      }
    </div>
  )

  const handleCloseModal = () => {
    setCardToTake(null);
    closeModal();
  }

  return (
    <Modal
      open={open}
      ariaLabel="Plunder"
      closeModal={handleCloseModal}
      modalHeader={renderModalHeader()}
      modalContent={renderModalContent()}
    />
  )
}
