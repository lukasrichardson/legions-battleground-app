import { Server, Socket as SocketIOSocket } from 'socket.io';
import { GAME_EVENT } from '../enums/GameEvent';
import { ROOM_EVENT } from '../enums/RoomEvent';

export interface GameEventPayload {
  type: GAME_EVENT;
  data?: unknown;
}

export interface RoomEventPayload {
  type: ROOM_EVENT;
  data?: unknown;
}

export interface CustomSocket extends SocketIOSocket {
  room?: string;
}

export type IOServer = Server;