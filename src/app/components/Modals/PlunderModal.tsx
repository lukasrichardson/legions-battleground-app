import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { MouseEventHandler, useState } from "react";
import Modal from "./Modal";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { moveCard } from "@/client/redux/gameStateSlice";
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import styles from "@/app/styles/modals.module.css";

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
  const {
    CloseBtnText,
    PlunderBtnText,
    LabelBtnText,
    RandomBtnText
  } = ModalConstants;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardToTake((Number(e.target.value) || null) as number);
  }

  const handleRandomNumber = () => {
    const min = 2;
    const max = deckSize;
    setCardToTake(Math.floor(Math.random() * (max - min + 1) + min));
  }

  const handleHalf = () => {
    if (deckSize >= 2) {
      setCardToTake(Math.floor(deckSize / 2) + 1);
    }
  }

  const handlePlunder = () => {
    if (!cardToTake) return;
    if (typeof Number(cardToTake) === "number" && cardToTake >= 2 && cardToTake <= deckSize) {
      const cardToMove = p1 ? p1PlayerDeck[cardToTake - 1] : p2PlayerDeck[cardToTake - 1];
      dispatch(moveCard({
        id: cardToMove.id,
        from: p1 ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK,
        target: p1 ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND
      }));
      emitGameEvent({type: GAME_EVENT.plunder, data: {
        number: cardToTake,
        p1
      }})
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
        <div className="flex">
          <label className="mr-2">
            {LabelBtnText}
          </label>
          <input className="min-w-48 bg-gray-600" name="plunderinput" type={"number"} defaultValue={undefined} placeholder="enter a number to cut to" onChange={handleInputChange} value={cardToTake || undefined} min={2} max={deckSize}/>
          {renderDrawSuffix()}
        </div>
        <div className="flex gap-6">
          <div><button className="cursor-pointer border-white border-2" onClick={handleRandomNumber}>{RandomBtnText}</button></div>
          <div><button className="cursor-pointer border-white border-2" onClick={handleHalf}>Set as half the deck</button></div>
        </div>
        <button className="cursor-pointer border-white border-2 px-6" onClick={handlePlunder}>{PlunderBtnText}</button>
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
      closeModal={handleCloseModal}
      modalHeader={renderModalHeader()}
      modalContent={renderModalContent()}
    />
  )
}