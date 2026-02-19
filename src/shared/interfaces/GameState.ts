import { GamePhase, PreGamePhase } from "@/server/enums/Phases";
import { DeckResponse } from "../../shared/interfaces/DeckResponse";
import { CardInterface } from "@/shared/interfaces/CardInterface";
import { SequenceState } from "@/server/interfaces/SequenceInterfaces";

export interface GameStateData {
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
  p2Viewing: string | null;
  p1Viewing: string | null;
  currentPhase: PreGamePhase | GamePhase;
  turnNumber: number;
  rpsWinner: "p1" | "p2" | null;
  p1RPSChoice: string | null;
  p2RPSChoice: string | null;
  p1Mulligan: boolean | null;
  p2Mulligan: boolean | null;
  sequences: SequenceState["sequences"];
  resolving: SequenceState["resolving"];
  playerConscripted: boolean;
  sandboxMode: boolean;
}

export default interface GameState {
  game: GameStateData;
}