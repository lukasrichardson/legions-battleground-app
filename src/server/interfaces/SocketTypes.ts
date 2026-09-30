import { Server, Socket as SocketIOSocket } from 'socket.io';
import { GAME_EVENT } from '@/shared/enums/GameEvent';
import { ROOM_EVENT } from '@/shared/enums/RoomEvent';


export type JoinGamePayload = Record<string, never>;
export interface GameEventPayload {
  type: GAME_EVENT;
  data?: unknown;
}

export type RegularMatchEvent =
  | GAME_EVENT.readyForMatch
  | GAME_EVENT.chooseFirstPlayer
  | GAME_EVENT.keepHand
  | GAME_EVENT.advancePhase
  | GAME_EVENT.concede
  | GAME_EVENT.offerDraw
  | GAME_EVENT.rescindDrawOffer
  | GAME_EVENT.acceptDrawOffer
  | GAME_EVENT.declineDrawOffer;

export interface RoomEventPayload {
  type: ROOM_EVENT;
  data?: unknown;
}

export interface CustomSocket extends SocketIOSocket {
  room?: string;
}

export type IOServer = Server;
