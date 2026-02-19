import { gameEventMap } from '../game/game';
import { GAME_EVENT } from '../enums/GameEvent';
import { ROOM_EVENT } from '../enums/RoomEvent';
import { GameService } from './GameService';
import { RoomService } from './RoomService';
import { IOServer } from '../interfaces/SocketTypes';
import IPlayer from './interfaces/IPlayer';
import { MoveCardActionInterface } from '../events/cardEvents';
import { CardInterface } from '../interfaces/CardInterface';
import { CARD_TARGET } from '@/shared/enums/CardTarget';
import { CardService } from './CardService';

export class EventHandler {
  private gameService = new GameService();
  private roomService = new RoomService();
  private cardService = new CardService();

  async handleGameEvent(roomId: string, eventType: GAME_EVENT, data: unknown, player: IPlayer, io: IOServer) {
    try {
      switch (eventType) {
        case GAME_EVENT.resetGame: {
          const gameState = await this.gameService.resetGame(roomId, data);
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.moveCard: {
          const gameState = await this.cardService.moveCard(roomId, data as MoveCardActionInterface, player, io);
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.selectCard: {
          const gameState = this.cardService.selectCard(roomId, data as CardInterface);
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.clearSelectedCard: {
          const gameState = this.cardService.clearSelectedCard(roomId);
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.flipCard: {
          const gameState = this.cardService.flipCard(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.increaseCardAttackModifier: {
          const gameState = this.cardService.increaseCardAttackModifier(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.decreaseCardAttackModifier: {
          const gameState = this.cardService.decreaseCardAttackModifier(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.increaseCardOtherModifier: {
          const gameState = this.cardService.increaseCardOtherModifier(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.decreaseCardOtherModifier: {
          const gameState = this.cardService.decreaseCardOtherModifier(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.increaseCardCooldown: {
          const gameState = this.cardService.increaseCardCooldown(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.decreaseCardCooldown: {
          const gameState = this.cardService.decreaseCardCooldown(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.shuffleTargetPile: {
          const gameState = this.cardService.shuffleTargetPile(roomId, data as { cardTarget: CARD_TARGET; targetIndex?: number });
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.plunder: {
          const gameState = this.cardService.plunder(roomId, data as { number: number }, player);
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.mulligan: {
          const gameState = this.cardService.mulligan(roomId, data as { number: number }, player, io);
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.sendChatMessage: {
          this.gameService.sendChatMessage(roomId, data as { message: string; side: "p1" | "p2" });
          const gameState = this.gameService.getGameState(roomId);
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.rollDie: {
          this.gameService.rollDie(roomId, data as { side: "p1" | "p2" });
          const gameState = this.gameService.getGameState(roomId);
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.setP1Viewing: {
          const gameState = this.gameService.setP1Vieweing(roomId, data as { cardTarget: CARD_TARGET; limit: number | null, bottom?: boolean });
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.setP2Viewing: {
          const gameState = this.gameService.setP2Viewing(roomId, data as { cardTarget: CARD_TARGET; limit: number | null, bottom?: boolean });
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.changeP2Health: {
          const gameState = this.gameService.changeP2Health(roomId, data as number);
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.changeP1Health: {
          const gameState = this.gameService.changeP1Health(roomId, data as number);
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.changeP2AP: {
          const gameState = this.gameService.changeP2AP(roomId, data as number);
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        case GAME_EVENT.changeP1AP: {
          const gameState = this.gameService.changeP1AP(roomId, data as number);
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          return;
        }
        default: {
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

          const gameState = this.gameService.getGameState(roomId);
          io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
          io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
        }
      }
    } catch (error) {
      console.error(`Game event ${eventType} failed for room ${roomId}:`, error);
    }
  }

  handleRoomEvent(roomId: string, eventType: ROOM_EVENT, player: IPlayer, io: IOServer) {
    try {
      switch (eventType) {
        case ROOM_EVENT.switchSide: {
          const roomState = this.roomService.switchSide(roomId, player);
          io.to(roomId).emit("roomEvent", roomState);
          return;
        }
        case ROOM_EVENT.playerLeft: {
          this.gameService.playerLeft(roomId, player);
          const roomState = this.roomService.getRoom(roomId);
          io.to(roomId).emit("roomEvent", roomState);
          return;
        }
        default: {
          console.error(`Unknown room event: ${eventType}`);
          return;
        }
      }


    } catch (error) {
      console.error(`Room event ${eventType} failed for room ${roomId}:`, error);
    }
  }
}