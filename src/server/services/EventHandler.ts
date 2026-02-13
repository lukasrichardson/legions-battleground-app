import { gameEventMap, roomEventMap, games } from '../game/game';
import { GAME_EVENT } from '../enums/GameEvent';
import { ROOM_EVENT } from '../enums/RoomEvent';
import { GameService } from './GameService';
import { RoomService } from './RoomService';
import { IOServer } from '../interfaces/SocketTypes';
import IPlayer from './interfaces/IPlayer';

export class EventHandler {
  private gameService = new GameService();
  private roomService = new RoomService();

  async handleGameEvent(roomId: string, eventType: GAME_EVENT, data: unknown, player: IPlayer, io: IOServer) {
    try {
      // Handle special cases with services
      if (eventType === GAME_EVENT.resetGame) {
        const gameState = await this.gameService.resetGame(roomId, data);
        io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
        io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
        return;
      }

      // Use existing event handlers for everything else
      const action = gameEventMap[eventType];
      if (!action) {
        console.error(`Unknown game event: ${eventType}`);
        return;
      }

      if (data) {
        action(roomId, data, player, io);
      } else {
        action(roomId, null, player, io);
      }

      const gameState = games[roomId];
      io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
      io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });

    } catch (error) {
      console.error(`Game event ${eventType} failed for room ${roomId}:`, error);
    }
  }

  handleRoomEvent(roomId: string, eventType: ROOM_EVENT, player: IPlayer, io: IOServer) {
    try {
      const action = roomEventMap[eventType];
      if (!action) {
        console.error(`Unknown room event: ${eventType}`);
        return;
      }

      action(roomId, player);
      io.to(roomId).emit("roomEvent", this.roomService.getRoom(roomId));

    } catch (error) {
      console.error(`Room event ${eventType} failed for room ${roomId}:`, error);
    }
  }
}