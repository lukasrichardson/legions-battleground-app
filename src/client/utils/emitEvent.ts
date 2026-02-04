/* eslint-disable  @typescript-eslint/no-explicit-any */
import { SOCKET_PAYLOAD_TYPE } from "@/client/hooks/useSocket";
import { GAME_EVENT } from '@/client/enums/GameEvent';
import { socket } from "@/client/socket";
import { ROOM_EVENT } from "@/client/enums/RoomEvent";

export const emitGameEvent = ({type, data}: {type: GAME_EVENT, data: any}) => {
  socket.emit(SOCKET_PAYLOAD_TYPE.gameEvent, {type, data});
}

export const emitRoomEvent = ({type, data}: {type: ROOM_EVENT, data: any}) => {
  socket.emit(SOCKET_PAYLOAD_TYPE.roomEvent, {type, data});
}