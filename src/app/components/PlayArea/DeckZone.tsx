import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CardState } from "@/shared/interfaces/CardState";
import GridItem from "./GridItem";
import Card from "../Card/Card";
import { useAppSelector } from "@/client/redux/hooks";
import { useEffect, useRef, useState } from "react";

export default function DeckZone ({item, cardTarget, p1}: {item: CardState | null, cardTarget: CARD_TARGET, p1?: boolean}) {
  const [shuffle, setShuffle] = useState(false);
  const gridItemRef = useRef<HTMLDivElement>(null);
  const gameState = useAppSelector((state) => state.gameState);
  const {gameLog, p1PlayerDeck, p2PlayerDeck} = gameState;
  const hidden = p1 ? cardTarget === CARD_TARGET.P2_PLAYER_DECK : cardTarget === CARD_TARGET.P1_PLAYER_DECK;
  const shuffleDeck = () => {
    setShuffle(true);
  }
  useEffect(() => {
    if (gameLog.length > 0) {
      if (gameLog[gameLog.length - 1].includes("shuffled")) {
        if (gameLog[gameLog.length - 1].split("shuffled ")[1] === cardTarget) {
          shuffleDeck();
        }
      }
    }
  }, [gameLog, gameLog.length, cardTarget]);
  const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === "shuffle") setShuffle(false);
  }
  const pileSize = cardTarget === CARD_TARGET.P1_PLAYER_DECK ? p1PlayerDeck.length : p2PlayerDeck.length;
  return (
    <GridItem cardTarget={cardTarget}>
      <div className="absolute bottom-[10%] inset-x-0 mx-auto z-10 text-white font-bold text-lg pointer-events-none drop-shadow-[0_1px_1px_rgba(29,30,24,0.9)]">{pileSize}</div>
      {item ? (
        <div ref={gridItemRef} onAnimationEnd={handleAnimationEnd} className={`${shuffle ? "deckShuffle" : ""}`}>
          <Card card={item} cardTarget={cardTarget} index={0} hidden={hidden} />
        </div>
      ) : (
        "empty deck zone"
      )}
    </GridItem>
  )
}