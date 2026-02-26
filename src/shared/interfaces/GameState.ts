import { GamePhase, PreGamePhase } from "@/shared/enums/Phases";
import { DeckResponse } from "../../shared/interfaces/DeckResponse";
import { CardState } from "@/shared/interfaces/CardState";
import { SequenceState } from "@/server/interfaces/SequenceInterfaces";

type SingleZonePile = CardState[];
type MultiZonePile = SingleZonePile[];

export interface GameStateData {
  started: boolean;
  gameLog: string[];
  p2PlayerHealth: number;
  p1PlayerHealth: number;
  p2PlayerAP: number;
  p1PlayerAP: number;
  p2PlayerHand: CardState[];
  p2PlayerDeck: CardState[];
  p2PlayerDiscard: SingleZonePile;
  p2PlayerEradication: SingleZonePile;
  p2PlayerFortifieds: MultiZonePile;
  p2PlayerUnifieds: MultiZonePile;
  p2PlayerWarriors: MultiZonePile;
  p2PlayerVeilRealm: SingleZonePile;
  p2PlayerWarlord: SingleZonePile;
  p2PlayerSynergy: SingleZonePile;
  p2PlayerGuardian: SingleZonePile;
  p2PlayerTokens: SingleZonePile;
  p2PlayerRevealed: SingleZonePile;

  p1PlayerHand: CardState[];
  p1PlayerDeck: CardState[];
  p1PlayerDiscard: SingleZonePile;
  p1PlayerEradication: SingleZonePile;
  p1PlayerFortifieds: MultiZonePile;
  p1PlayerUnifieds: MultiZonePile;
  p1PlayerWarriors: MultiZonePile;
  p1PlayerVeilRealm: SingleZonePile;
  p1PlayerWarlord: SingleZonePile;
  p1PlayerSynergy: SingleZonePile;
  p1PlayerGuardian: SingleZonePile;
  p1PlayerTokens: SingleZonePile;
  p1PlayerRevealed: SingleZonePile;
  
  deckFromServer: DeckResponse | null;
  p2DeckFromServer: DeckResponse | null;
  p1DeckFromServer: DeckResponse | null;
  p1SelectedCards: CardState[];
  p2SelectedCards: CardState[];
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