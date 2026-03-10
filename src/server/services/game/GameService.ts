import {
  games,
} from '../../game/game';
import { fetchInitialDecks, resetPlayersCards, fetchPlayerDeckById } from '../../utils/game.util';
import { rooms } from '../../network/socketHandler';
import { addGameLog } from '../../utils/generateGameLog';
import { initialGameState } from '@/shared/constants/initialGameState';
import { PreGamePhase } from '../../../shared/enums/Phases';
import { CARD_TARGET } from '@/shared/enums/CardTarget';
import { GameStateData } from '@/shared/interfaces/GameState';
import { GameHistoryService } from './GameHistoryService';
import { GAME_EVENT } from '@/shared/enums/GameEvent';
import { CardService } from './CardService';
import { MoveCardActionInterface } from '../../events/cardEvents';

export class GameService {
  private gameHistoryService = new GameHistoryService();
  private cardService = new CardService();

  async startGame(roomId: string, deckId: string, p2DeckId?: string): Promise<GameStateData> {
    if (games[roomId]?.started) {
      return games[roomId];
    }

    games[roomId] = { ...initialGameState };
    games[roomId].sandboxMode = rooms[roomId]?.sandboxMode || false;

    console.log(`🎮 Game started for room: ${roomId}, sandbox mode: ${games[roomId].sandboxMode}`);

    const { p2Deck: p2DeckResponse, p1Deck: p1DeckResponse } = await fetchInitialDecks(deckId, p2DeckId);
    games[roomId].p2DeckFromServer = p2DeckResponse;
    games[roomId].p1DeckFromServer = p1DeckResponse;

    resetPlayersCards(roomId, p1DeckResponse, p2DeckResponse);
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "Game Started");

    games[roomId].started = true;
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

  playerLeft(roomId: string, player: { id: string; p1: boolean }) {
    if (player.p1) {
      games[roomId].p1Viewing = null;
    } else {
      games[roomId].p2Viewing = null;
    }
  }

  getGameState(roomId: string): GameStateData | null {
    return games[roomId] || null;
  }

  sendChatMessage(roomId: string, action: { message: string; side: "p1" | "p2" }): void {
    if (!games[roomId]) return;
    const { message, side } = action;
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, side + " player says: '" + message + "'");
  }

  rollDie(roomId: string, action: { side: "p1" | "p2" }) {
    if (!games[roomId]) return;
    const { side } = action;
    const result = Math.floor(Math.random() * 6) + 1;
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, side + " player rolled a " + result);
  }

  setP1Vieweing(roomId: string, action: { cardTarget: CARD_TARGET, limit: number | null, bottom?: boolean }): GameStateData {
    if (!games[roomId]) return;
    games[roomId].p1Viewing = (action.limit ? (action.bottom ? "bottom " : "top ") + action.limit + " of " : "") + action.cardTarget;
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "p1 viewing " + (action.limit ? (action.bottom ? "bottom " : "top ") + action.limit + " of " : "") + action.cardTarget);
    return games[roomId];
  }

  setP2Viewing(roomId: string, action: { cardTarget: CARD_TARGET; limit: number | null, bottom?: boolean }): GameStateData {
    if (!games[roomId]) return;
    games[roomId].p2Viewing = (action.limit ? (action.bottom ? "bottom " : "top ") + action.limit + " of " : "") + action.cardTarget;
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "p2 viewing " + (action.limit ? (action.bottom ? "bottom " : "top ") + action.limit + " of " : "") + action.cardTarget);
    return games[roomId];
  }

  changeP2Health(roomId: string, action: number): GameStateData {
    games[roomId].p2PlayerHealth += action;
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "p2 player health changed by " + action);
    return games[roomId];
  }

  changeP1Health(roomId: string, action: number): GameStateData {
    games[roomId].p1PlayerHealth += action;
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "p1 player health changed by " + action);
    return games[roomId];
  }

  changeP2AP(roomId: string, action: number): GameStateData {
    games[roomId].p2PlayerAP += action;
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "p2 player AP changed by " + action);
    return games[roomId];
  }

  changeP1AP(roomId: string, action: number): GameStateData {
    games[roomId].p1PlayerAP += action;
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "p1 player AP changed by " + action);
    return games[roomId];
  }

  undoGameEvent(roomId: string): GameStateData {
    const gameHistory = this.gameHistoryService.getGameHistory(roomId);
    if (gameHistory.length === 0) {
      return games[roomId];
    }
    const lastEvent = gameHistory[gameHistory.length - 1];
    if (!lastEvent) {
      return games[roomId];
    }
    switch (lastEvent.event.type) {
      case GAME_EVENT.moveCard: {
        const { id, from, target, targetIndex, keywords, bottom } = lastEvent.event.data as MoveCardActionInterface;
      this.cardService.moveCard(roomId, {
        id,
        from: { target, targetIndex },
        target: from.target,
        targetIndex: from.targetIndex,
        keywords,
        bottom
      }, { p1: lastEvent.p1, name: lastEvent.playerName }, null);
        break;
      }
      case GAME_EVENT.flipCard: {
        const { cardTarget, cardIndex, zoneIndex } = lastEvent.event.data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number };
        this.cardService.flipCard(roomId, { cardTarget, cardIndex, zoneIndex });
        break;
      }
      case GAME_EVENT.increaseCardAttackModifier: {
        const { cardTarget, cardIndex, zoneIndex } = lastEvent.event.data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number };
        this.cardService.decreaseCardAttackModifier(roomId, { cardTarget, cardIndex, zoneIndex});
        break;
      }
      case GAME_EVENT.decreaseCardAttackModifier: {
        const { cardTarget, cardIndex, zoneIndex } = lastEvent.event.data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number };
        this.cardService.increaseCardAttackModifier(roomId, { cardTarget, cardIndex, zoneIndex});
        break;
      }
      case GAME_EVENT.increaseCardOtherModifier: {
        const { cardTarget, cardIndex, zoneIndex } = lastEvent.event.data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number };
        this.cardService.decreaseCardOtherModifier(roomId, { cardTarget, cardIndex, zoneIndex});
        break;
      }
      case GAME_EVENT.decreaseCardOtherModifier: {
        const { cardTarget, cardIndex, zoneIndex } = lastEvent.event.data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number };
        this.cardService.increaseCardOtherModifier(roomId, { cardTarget, cardIndex, zoneIndex});
        break;
      }
      case GAME_EVENT.increaseCardCooldown: {
        const { cardTarget, cardIndex, zoneIndex } = lastEvent.event.data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number };
        this.cardService.decreaseCardCooldown(roomId, { cardTarget, cardIndex, zoneIndex});
        break;
      }
      case GAME_EVENT.decreaseCardCooldown: {
        const { cardTarget, cardIndex, zoneIndex } = lastEvent.event.data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number };
        this.cardService.increaseCardCooldown(roomId, { cardTarget, cardIndex, zoneIndex});
        break;
      }
      case GAME_EVENT.changeP1AP: {
        const changeAmount = lastEvent.event.data as number;
        this.changeP1AP(roomId, -changeAmount);
        break;
      }
      case GAME_EVENT.changeP2AP: {
        const changeAmount = lastEvent.event.data as number;
        this.changeP2AP(roomId, -changeAmount);
        break;
      }
      case GAME_EVENT.changeP1Health: {
        const changeAmount = lastEvent.event.data as number;
        this.changeP1Health(roomId, -changeAmount);
        break;
      }
      case GAME_EVENT.changeP2Health: {
        const changeAmount = lastEvent.event.data as number;
        this.changeP2Health(roomId, -changeAmount);
        break;
      }
      default: {
        this.gameHistoryService.removeLastGameEvent(roomId);
        return this.undoGameEvent(roomId);
      }
    }

    this.gameHistoryService.removeLastGameEvent(roomId);
    return games[roomId];
  }

}