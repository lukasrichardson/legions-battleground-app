import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CardInterface } from "@/shared/interfaces/CardInterface";

export interface ClientGameState {
  cardInFocus: CardInterface | null;
  previousCardInFocus: CardInterface | null;
  pileInViewTarget: CARD_TARGET | null;
  pileInViewIndex: number | null;
  pileInViewLimit: number | null;
  topXCards: CardInterface[];
  side: "p1" | "p2";
}