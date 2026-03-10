import { GameEventLog } from '@/shared/interfaces/GameEventLog';
import {
  games,
} from '../../game/game';

const gameHistory: { [roomId: string]: GameEventLog[] } = {};
const undoneHistory: { [roomId: string]: GameEventLog[] } = {};

export class GameHistoryService {
  logGameEvent(roomName: string, gameEvent: GameEventLog): GameEventLog[] {
    if (!games[roomName]) {
      console.error(`Game not found for room: ${roomName}`);
      return [];
    }
    gameHistory[roomName] = gameHistory[roomName] || [];
    gameHistory[roomName].push(gameEvent);
    return gameHistory[roomName];
  }
  clearGameHistory(roomName: string) {
    delete gameHistory[roomName];
    delete undoneHistory[roomName];
  }
  clearUndoneHistory(roomName: string) {
    delete undoneHistory[roomName];
  }
  getGameHistory(roomName: string): GameEventLog[] {
    return gameHistory[roomName] || [];
  }
  getUndoneHistory(roomName: string): GameEventLog[] {
    return undoneHistory[roomName] || [];
  }
  removeLastGameEvent(roomName: string): GameEventLog[] {
    if (!gameHistory[roomName] || gameHistory[roomName].length === 0) {
      return [];
    }
    const lastEvent = gameHistory[roomName].pop();
    if (lastEvent) {
      undoneHistory[roomName] = undoneHistory[roomName] || [];
      undoneHistory[roomName].push(lastEvent);
    }
    return gameHistory[roomName];
  }
  removeLastUndoneEvent(roomName: string): GameEventLog[] {
    if (!undoneHistory[roomName] || undoneHistory[roomName].length === 0) {
      return [];
    }
    undoneHistory[roomName].pop();
    return undoneHistory[roomName];
  }
}