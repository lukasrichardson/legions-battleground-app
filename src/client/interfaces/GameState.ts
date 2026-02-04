import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CardInterface } from "./CardInterface";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";

export interface GameState {
  game: {
    started: boolean;
    gameLog: string[];
    p2PlayerHealth: number;
    p1PlayerHealth: number;
    p2PlayerAP: number;
    p1PlayerAP: number;
    p2PlayerHand: CardInterface[];
    p2PlayerDeck: CardInterface[];
    p2PlayerDiscard: CardInterface[];
    p2PlayerEradication: CardInterface[];
    p2PlayerFortifieds: CardInterface[][];
    p2PlayerUnifieds: CardInterface[][];
    p2PlayerWarriors: CardInterface[][];
    p2PlayerVeilRealm: CardInterface[];
    p2PlayerWarlord: CardInterface[];
    p2PlayerSynergy: CardInterface[];
    p2PlayerGuardian: CardInterface[];
    p2PlayerTokens: CardInterface[];
    p2PlayerRevealed: CardInterface[];

    p1PlayerHand: CardInterface[];
    p1PlayerDeck: CardInterface[];
    p1PlayerDiscard: CardInterface[];
    p1PlayerEradication: CardInterface[];
    p1PlayerFortifieds: CardInterface[][];
    p1PlayerUnifieds: CardInterface[][];
    p1PlayerWarriors: CardInterface[][];
    p1PlayerVeilRealm: CardInterface[];
    p1PlayerWarlord: CardInterface[];
    p1PlayerSynergy: CardInterface[];
    p1PlayerGuardian: CardInterface[];
    p1PlayerTokens: CardInterface[];
    p1PlayerRevealed: CardInterface[];
    
    deckFromServer: DeckResponse | null;
    p2DeckFromServer: DeckResponse | null;
    p1DeckFromServer: DeckResponse | null;
    selectedCard: CardInterface | null;
    p1Viewing: string | null;
    p2Viewing: string | null;
    playerConscripted: boolean;
    sandboxMode: boolean;
  };
  cardInFocus: CardInterface | null;
  previousCardInFocus: CardInterface | null;
  pileInViewTarget: CARD_TARGET | null;
  pileInViewIndex: number | null;
  pileInViewLimit: number | null;
  topXCards: CardInterface[];
  side: "p1" | "p2";
}
