import { PreGamePhase } from "@/shared/enums/Phases";
import { GameStateData } from "../interfaces/GameState";

export const initialGameState: GameStateData = {
  started: false,
  gameLog: [],
  p2PlayerHealth: 0,
  p1PlayerHealth: 0,
  p2PlayerAP: 0,
  p1PlayerAP: 0,
  //
  p2PlayerHand: [],
  p2PlayerDeck: [],
  p2PlayerDiscard: [],
  p2PlayerEradication: [],
  p2PlayerFortifieds: [[], [], [], [], []],
  p2PlayerUnifieds: [[], [], [], [], []],
  p2PlayerWarriors: [[], [], [], [], []],
  p2PlayerVeilRealm: [],
  p2PlayerWarlord: [],
  p2PlayerSynergy: [],
  p2PlayerGuardian: [],
  p2PlayerTokens: [],
  p2PlayerRevealed: [],

  p1PlayerHand: [],
  p1PlayerDeck: [],
  p1PlayerDiscard: [],
  p1PlayerEradication: [],
  p1PlayerFortifieds: [[], [], [], [], []],
  p1PlayerUnifieds: [[], [], [], [], []],
  p1PlayerWarriors: [[], [], [], [], []],
  p1PlayerVeilRealm: [],
  p1PlayerWarlord: [],
  p1PlayerSynergy: [],
  p1PlayerGuardian: [],
  p1PlayerTokens: [],
  p1PlayerRevealed: [],
  //
  deckFromServer: null,
  p2DeckFromServer: null,
  p1DeckFromServer: null,
  p1SelectedCards: [],
  p2SelectedCards: [],
  p2Viewing: null,
  p1Viewing: null,

  //
  currentPhase: PreGamePhase.RPS,
  turnNumber: 0,
  rpsWinner: null,
  p1RPSChoice: null,
  p2RPSChoice: null,
  p1Mulligan: null,
  p2Mulligan: null,
  //
  sequences: [],
  resolving: false,
  //
  playerConscripted: false,
  sandboxMode: true,
}