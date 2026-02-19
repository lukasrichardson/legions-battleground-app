import { CardInterface } from "./CardInterface";

export interface ClientGameState {
  previousCardInFocus: CardInterface | null;
  pileInViewLimit: number | null;
  topXCards: CardInterface[];
  side: "p1" | "p2";
}