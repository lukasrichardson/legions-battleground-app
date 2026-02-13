import { games,
  //  startGame as originalStartGame
   } from '../game/game';
import { GameStateData } from '../interfaces/GameState';
import { fetchInitialDecks, resetPlayersCards, fetchPlayerDeckById } from '../utils/game.util';
import { rooms } from '../network/socketHandler';
import { addGameLog } from '../utils/generateGameLog';
import { initialState } from '../game/initialGameState';
import { PreGamePhase } from '../enums/Phases';

export class GameService {
  async startGame(roomId: string, deckId: string): Promise<GameStateData> {
    if (games[roomId]?.started) {
      return games[roomId];
    }

    games[roomId] = { ...initialState };
    games[roomId].sandboxMode = rooms[roomId]?.sandboxMode || false;
    
    console.log(`🎮 Game started for room: ${roomId}, sandbox mode: ${games[roomId].sandboxMode}`);

    const { p2Deck: p2DeckResponse, p1Deck: p1DeckResponse } = await fetchInitialDecks(deckId);
    games[roomId].p2DeckFromServer = p2DeckResponse;
    games[roomId].p1DeckFromServer = p1DeckResponse;

    resetPlayersCards(roomId, p1DeckResponse, p2DeckResponse);
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "Game Started");

    return games[roomId];
  }

  async resetGame(roomId: string, options?: { p2DeckId?: string; p1DeckId?: string }): Promise<GameStateData> {
    if (!games[roomId]) {
      throw new Error(`Game ${roomId} not found`);
    }

    const gameState = this.getGameState(roomId);
    const currentSandboxMode = gameState.sandboxMode;
    
    games[roomId].sandboxMode = currentSandboxMode;
    games[roomId].gameLog = addGameLog([], "Game Started");
    games[roomId].p2PlayerAP = 0;
    games[roomId].p1PlayerAP = 0;
    games[roomId].p2PlayerHealth = 0;
    games[roomId].p1PlayerHealth = 0;
    if (options?.p2DeckId && gameState.p2DeckFromServer?.id !== options.p2DeckId) {
      games[roomId].p2DeckFromServer = await fetchPlayerDeckById({ deckId: options.p2DeckId });
    }
    
    if (options?.p1DeckId && gameState.p1DeckFromServer?.id !== options.p1DeckId) {
      games[roomId].p1DeckFromServer = await fetchPlayerDeckById({ deckId: options.p1DeckId });
    }

    resetPlayersCards(roomId, gameState.p1DeckFromServer!, gameState.p2DeckFromServer!);

    games[roomId].gameLog = addGameLog(gameState.gameLog, "Game Restarted");
    games[roomId].currentPhase = PreGamePhase.RPS;
    games[roomId].turnNumber = 0;
    games[roomId].rpsWinner = null;
    games[roomId].p1RPSChoice = null;
    games[roomId].p2RPSChoice = null;
    games[roomId].p1Mulligan = null;
    games[roomId].p2Mulligan = null;
    games[roomId].sequences = [];
    games[roomId].resolving = false;

    return games[roomId];
  }

  getGameState(roomId: string): GameStateData | null {
    return games[roomId] || null;
  }
}