import { gameEventMap } from '../../game/game';
import { GAME_EVENT } from '@/shared/enums/GameEvent';
import { ROOM_EVENT } from '@/shared/enums/RoomEvent';
import { GameService } from './GameService';
import { RoomService } from './RoomService';
import { IOServer } from '../../interfaces/SocketTypes';
import IPlayer from './interfaces/IPlayer';
import { MoveCardActionInterface } from '../../events/cardEvents';
import { CardState } from '../../../shared/interfaces/CardState';
import { CARD_TARGET } from '@/shared/enums/CardTarget';
import { CardService } from './CardService';
import { GameHistoryService } from './GameHistoryService';
import { RegularMatchService } from './RegularMatchService';
import { MatchStatus } from '@/shared/enums/Match';

export class EventHandler {
  private gameService = new GameService();
  private roomService = new RoomService();
  private cardService = new CardService();
  private gameHistoryService = new GameHistoryService();
  private regularMatchService = new RegularMatchService();

  async handleGameEvent(roomId: string, eventType: GAME_EVENT, data: unknown, player: IPlayer, io: IOServer, isRedo: boolean = false) {
    try {
      const room = this.roomService.getRoom(roomId);
      const game = this.gameService.getGameState(roomId);
      const isRegular = Boolean(room && !room.sandboxMode);
      const side = player.p1 ? "p1" : "p2";
      if (isRegular && game?.matchStatus === MatchStatus.Completed) {
        throw new Error("Match is complete");
      }
      switch (eventType) {
        case GAME_EVENT.readyForMatch: {
          const bothSeated = Boolean(room?.regularSeats?.p1 && room?.regularSeats?.p2);
          this.regularMatchService.ready(roomId, side, bothSeated);
          if (isRegular && bothSeated && game?.matchStatus === MatchStatus.Rps) {
            await this.gameService.startRegularSetup(roomId, room!.regularSeats!.p1!.deckId, room!.regularSeats!.p2!.deckId);
          }
          break;
        }
        case GAME_EVENT.setRpsChoice: {
          if (isRegular && game?.matchStatus !== MatchStatus.Rps) throw new Error("Rock Paper Scissors is not active");
          if (isRegular) {
            const choices = ["Rock", "Paper", "Scissors"] as const;
            if (!choices.includes(data as typeof choices[number])) throw new Error("Invalid Rock Paper Scissors choice");
            this.regularMatchService.chooseRps(roomId, side, data as typeof choices[number]);
            // A tie leaves both hands absent. The first decisive result deals
            // the opening state atomically before it is broadcast to either player.
            if (game?.rpsWinner) this.gameService.dealRegularOpeningState(roomId);
          } else {
            const action = gameEventMap[eventType];
            action(roomId, data, player, io);
          }
          break;
        }
        case GAME_EVENT.mulligan: {
          if (isRegular) {
            this.regularMatchService.completeMulligan(roomId, side);
          }
          this.cardService.mulligan(roomId, data as { number: number }, player, io, !isRegular);
          break;
        }
        case GAME_EVENT.keepHand: {
          if (!isRegular) throw new Error("Keep hand is only available in regular mode");
          this.regularMatchService.completeMulligan(roomId, side);
          break;
        }
        case GAME_EVENT.advancePhase: {
          if (!isRegular) throw new Error("Phase advancement is only available in regular mode");
          this.regularMatchService.advancePhase(roomId, side);
          break;
        }
        case GAME_EVENT.concede: this.regularMatchService.concede(roomId, side); break;
        case GAME_EVENT.offerDraw: this.regularMatchService.offerDraw(roomId, side); break;
        case GAME_EVENT.rescindDrawOffer: this.regularMatchService.rescindDrawOffer(roomId, side); break;
        case GAME_EVENT.acceptDrawOffer: this.regularMatchService.acceptDrawOffer(roomId, side); break;
        case GAME_EVENT.declineDrawOffer: this.regularMatchService.declineDrawOffer(roomId, side); break;
        case GAME_EVENT.resetGame: {
          if (isRegular) throw new Error("Regular matches cannot be reset");
          await this.gameService.resetGame(roomId, data);
          this.gameHistoryService.clearGameHistory(roomId);
          break;
        }
        case GAME_EVENT.moveCard: {
          await this.cardService.moveCard(roomId, data as MoveCardActionInterface, player, io);
          break;
        }
        case GAME_EVENT.selectCard: {
          this.cardService.selectCard(roomId, data as { card: CardState; side: "p1" | "p2" });
          break;
        }
        case GAME_EVENT.multiSelectCard: {
          this.cardService.multiSelectCard(roomId, data as { card: CardState; side: "p1" | "p2" });
          break;
        }
        case GAME_EVENT.flipCard: {
          this.cardService.flipCard(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          break;
        }
        case GAME_EVENT.increaseCardAttackModifier: {
          this.cardService.increaseCardAttackModifier(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          break;
        }
        case GAME_EVENT.decreaseCardAttackModifier: {
          this.cardService.decreaseCardAttackModifier(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number })
          break;
        }
        case GAME_EVENT.increaseCardOtherModifier: {
          this.cardService.increaseCardOtherModifier(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          break;
        }
        case GAME_EVENT.decreaseCardOtherModifier: {
          this.cardService.decreaseCardOtherModifier(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          break;
        }
        case GAME_EVENT.increaseCardCooldown: {
          this.cardService.increaseCardCooldown(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          break;
        }
        case GAME_EVENT.decreaseCardCooldown: {
          this.cardService.decreaseCardCooldown(roomId, data as { cardTarget: CARD_TARGET; cardIndex: number; zoneIndex?: number });
          break;
        }
        case GAME_EVENT.shuffleTargetPile: {
          this.cardService.shuffleTargetPile(roomId, data as { cardTarget: CARD_TARGET; targetIndex?: number });
          break;
        }
        case GAME_EVENT.sendChatMessage: {
          this.gameService.sendChatMessage(roomId, data as { message: string; side: "p1" | "p2" });
          break;
        }
        case GAME_EVENT.rollDie: {
          this.gameService.rollDie(roomId, data as { side: "p1" | "p2" });
          break;
        }
        case GAME_EVENT.setP1Viewing: {
          this.gameService.setP1Vieweing(roomId, data as { cardTarget: CARD_TARGET; limit: number | null, bottom?: boolean });
          break;
        }
        case GAME_EVENT.setP2Viewing: {
          this.gameService.setP2Viewing(roomId, data as { cardTarget: CARD_TARGET; limit: number | null, bottom?: boolean });
          break;
        }
        case GAME_EVENT.changeP2Health: {
          this.gameService.changeP2Health(roomId, data as number);
          break;
        }
        case GAME_EVENT.changeP1Health: {
          this.gameService.changeP1Health(roomId, data as number);
          break;
        }
        case GAME_EVENT.changeP2AP: {
          this.gameService.changeP2AP(roomId, data as number);
          break;
        }
        case GAME_EVENT.changeP1AP: {
          this.gameService.changeP1AP(roomId, data as number);
          break;
        }
        case GAME_EVENT.undo: {
          this.gameService.undoGameEvent(roomId);
          break;
        }
        case GAME_EVENT.redo: {
          const undoneHistory = this.gameHistoryService.getUndoneHistory(roomId);
          if (undoneHistory.length === 0) {
            console.warn("No actions to redo");
            break;
          }
          const lastUndone = undoneHistory[undoneHistory.length - 1];
          return this.handleGameEvent(roomId, lastUndone.event.type, lastUndone.event.data, { id: player.id , name: lastUndone.playerName, p1: lastUndone.p1 }, io, true);
        }
        default: {
          // Use existing event handlers for everything else
          const action = gameEventMap[eventType];
          if (!action) {
            console.error(`Unknown game event: ${eventType}`);
            break;
          }

          if (data) {
            action(roomId, data, player, io);
          } else {
            action(roomId, null, player, io);
          }
          break;
        }
      }
      const gameState = this.gameService.getGameState(roomId);
      io.to(roomId).emit("phaseEvent", { type: eventType, data: gameState });
      io.to(roomId).emit("gameEvent", { type: eventType, data: gameState });
      if (
        eventType !== GAME_EVENT.undo &&
        eventType !== GAME_EVENT.redo &&
        eventType !== GAME_EVENT.sendChatMessage &&
        eventType !== GAME_EVENT.rollDie &&
        eventType !== GAME_EVENT.setP1Viewing &&
        eventType !== GAME_EVENT.setP2Viewing &&
        eventType !== GAME_EVENT.mulligan &&
        eventType !== GAME_EVENT.selectCard &&
        eventType !== GAME_EVENT.multiSelectCard &&
        eventType !== GAME_EVENT.resetGame &&
        eventType !== GAME_EVENT.shuffleTargetPile
      ) {
        this.gameHistoryService.logGameEvent(roomId, { p1: player.p1, playerName: player.name, event: { type: eventType, data } });
        if (!isRedo) {
          this.gameHistoryService.clearUndoneHistory(roomId);
        } else this.gameHistoryService.removeLastUndoneEvent(roomId);
      }
      const gameHistory = this.gameHistoryService.getGameHistory(roomId);
      const undoneHistory = this.gameHistoryService.getUndoneHistory(roomId);
      io.to(roomId).emit("gameHistoryEvent", { gameHistory, undoneHistory });
    } catch (error) {
      console.error(`Game event ${eventType} failed for room ${roomId}:`, error);
      throw error;
    }
  }

  handleRoomEvent(roomId: string, eventType: ROOM_EVENT, player: IPlayer, io: IOServer) {
    try {
      switch (eventType) {
        case ROOM_EVENT.switchSide: {
          const roomState = this.roomService.switchSide(roomId, player);
          if (roomState) {
            io.to(roomId).emit("roomEvent", this.roomService.toRoomStateForMembers(roomState));
          }
          break;
        }
        default: {
          console.error(`Unknown room event: ${eventType}`);
          break;
        }
      }


    } catch (error) {
      console.error(`Room event ${eventType} failed for room ${roomId}:`, error);
    }
  }
}
