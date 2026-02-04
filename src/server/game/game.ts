
import GameState from '../interfaces/GameState';
import { addGameLog } from '../utils/generateGameLog';
import { GAME_EVENT } from '../enums/GameEvent';
import { ROOM_EVENT } from '../enums/RoomEvent';
import { PreGamePhase } from '../enums/Phases';
import { fetchInitialDecks, resetPlayersCards } from '../utils/game.util';
import { clearselectedCard, conscript, decreaseCardAttackModifier, decreaseCardCooldown, decreaseCardOtherModifier, flipCard, increaseCardAttackModifier, increaseCardCooldown, increaseCardOtherModifier, moveCard, plunder, selectCard, shuffleTargetPile } from '../events/cardEvents';
import { goNextPhase, mulligan, playerInput, resetGame, rollDie, sendChatMessage, setP1Viweing, setP2Viewing, setRpsChoice } from '../events/playerEvents';
import { changeP1AP, changeP1Health, changeP2AP, changeP2Health } from '../events/healthApEvents';
import { switchSide, playerLeft } from '../events/roomEvents';
import { Server } from 'socket.io';

export const games: {
  [key: string]: GameState["game"]
} = {}

export const users: {
  [key: string]: string
} = {};

const initialState: GameState["game"] = {
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
  selectedCard: null,
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
  sandboxMode: false,
}

export const startGame = async (room: string, deckId: string) => {
  if (games[room]?.started) return;
  games[room] = { ...initialState };
  
  // Import rooms from socketHandler to access room configuration
  const { rooms } = await import('../network/socketHandler');
  // Inherit sandboxMode from room configuration
  games[room].sandboxMode = rooms[room]?.sandboxMode || false;
  
  console.log(`🎮 Game started for room: ${room}, sandbox mode: ${games[room].sandboxMode}`);

  const { p2Deck: p2DeckResponse, p1Deck: p1DeckResponse } = await fetchInitialDecks(deckId);
  games[room].p2DeckFromServer = p2DeckResponse;
  games[room].p1DeckFromServer = p1DeckResponse;

  resetPlayersCards(room, p1DeckResponse, p2DeckResponse);

  games[room].gameLog = addGameLog(games[room].gameLog, "Game Started");
}

export const gameEventMap: {
  [key: string]: (roomId: string, action: unknown, player: { name: string; p1: boolean }, io?: Server) => void
} = {
  //cards
  [GAME_EVENT.moveCard]: moveCard,
  [GAME_EVENT.selectCard]: selectCard,
  [GAME_EVENT.clearSelectedCard]: clearselectedCard,
  [GAME_EVENT.flipCard]: flipCard,
  [GAME_EVENT.increaseCardAttackModifier]: increaseCardAttackModifier,
  [GAME_EVENT.decreaseCardAttackModifier]: decreaseCardAttackModifier,
  [GAME_EVENT.increaseCardOtherModifier]: increaseCardOtherModifier,
  [GAME_EVENT.decreaseCardOtherModifier]: decreaseCardOtherModifier,
  [GAME_EVENT.increaseCardCooldown]: increaseCardCooldown,
  [GAME_EVENT.decreaseCardCooldown]: decreaseCardCooldown,
  [GAME_EVENT.shuffleTargetPile]: shuffleTargetPile,
  [GAME_EVENT.conscript]: conscript,
  [GAME_EVENT.plunder]: plunder,
  //
  [GAME_EVENT.rollDie]: rollDie,
  [GAME_EVENT.mulligan]: mulligan,
  [GAME_EVENT.playerInput]: playerInput,
  [GAME_EVENT.resetGame]: resetGame,
  [GAME_EVENT.sendChatMessage]: sendChatMessage,
  [GAME_EVENT.setP1Viewing]: setP1Viweing,
  [GAME_EVENT.setP2Viewing]: setP2Viewing,
  [GAME_EVENT.nextPhase]: goNextPhase,
  [GAME_EVENT.setRpsChoice]: setRpsChoice,
  //
  [GAME_EVENT.changeP2Health]: changeP2Health,
  [GAME_EVENT.changeP1Health]: changeP1Health,
  [GAME_EVENT.changeP2AP]: changeP2AP,
  [GAME_EVENT.changeP1AP]: changeP1AP,
  
}

export const roomEventMap: {
  [key: string]: (roomId: string, player: { id: string; p1: boolean }, ) => void,
} = {
  [ROOM_EVENT.switchSide]: switchSide,
  [ROOM_EVENT.playerLeft]: playerLeft
}