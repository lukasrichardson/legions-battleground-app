import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CardState } from "@/shared/interfaces/CardState";

export interface ClientGameState {
  cardInFocus: CardState | null;
  previousCardInFocus: CardState | null;
  pileInViewTarget: CARD_TARGET | null;
  pileInViewIndex: number | null;
  pileInViewLimit: number | null;
  topXCards: CardState[];
  side: "p1" | "p2";
}