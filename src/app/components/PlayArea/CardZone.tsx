import { CARD_TARGET } from "@/shared/enums/CardTarget";
import GridItem from "./GridItem";
import Card from "../Card/Card";
import { CardState } from "@/shared/interfaces/CardState";

export default function CardZone({ items, cardTarget, targetIndex, zoneName }: { items: CardState[], cardTarget: CARD_TARGET, targetIndex?: number, zoneName?: string }) {
  const pileSize = items.length;
  if (cardTarget === CARD_TARGET.P2_PLAYER_DISCARD ||
    cardTarget === CARD_TARGET.P1_PLAYER_DISCARD ||
    cardTarget === CARD_TARGET.P2_PLAYER_ERADICATION ||
    cardTarget === CARD_TARGET.P1_PLAYER_ERADICATION ||
    cardTarget === CARD_TARGET.P2_PLAYER_TOKENS ||
    cardTarget === CARD_TARGET.P1_PLAYER_TOKENS
  ) {
    if (items.length) {
      items = [items[items.length - 1]];
    }
  }
  const showPileSize = cardTarget === CARD_TARGET.P2_PLAYER_DECK ||
  cardTarget === CARD_TARGET.P1_PLAYER_DECK ||
  cardTarget === CARD_TARGET.P2_PLAYER_DISCARD ||
  cardTarget === CARD_TARGET.P1_PLAYER_DISCARD ||
  cardTarget === CARD_TARGET.P2_PLAYER_ERADICATION ||
  cardTarget === CARD_TARGET.P1_PLAYER_ERADICATION ||
  cardTarget === CARD_TARGET.P2_PLAYER_TOKENS ||
  cardTarget === CARD_TARGET.P1_PLAYER_TOKENS ||
  cardTarget === CARD_TARGET.P1_PLAYER_REVEALED ||
  cardTarget === CARD_TARGET.P2_PLAYER_REVEALED;
  return (
    <GridItem cardTarget={cardTarget} targetIndex={targetIndex} key={targetIndex}>
      {showPileSize && (
        <div className="absolute bottom-[10%] inset-x-0 mx-auto z-10 text-white font-bold text-lg pointer-events-none drop-shadow-[0_1px_1px_rgba(29,30,24,0.9)]">
          {pileSize}
        </div>
      )}
      {pileSize === 0 && (
        <div className="opacity-30 text-white text-sm">{zoneName}</div>
      )}
      {[...items].reverse().map((item, index) => <Card card={item} cardTarget={cardTarget} zoneIndex={targetIndex} index={items.length - 1 - index} key={index} />)}
    </GridItem>
  )
}