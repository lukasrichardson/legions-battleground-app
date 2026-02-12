import { users,  } from "../game/game";
import { RoomsCollection } from "../../shared/interfaces/RoomInterface";
import { IOServer, CustomSocket } from "../interfaces/SocketTypes";
import { handleSocketDisconnect, handleSocketGameEvent, handleSocketJoinGame, handleSocketRoomEvent } from "../utils/socket.util";

export const rooms: RoomsCollection = {};

export const handleSocketConnection = (io: IOServer) => {
  io.on("connection", (socket: CustomSocket) => {

    if (!users[socket.id as string]) {
      users[socket.id as string] = socket.id;
    }
    console.log("a user connected", users[socket.id as string]);
    socket.emit("rooms", rooms);

    socket.on("joinGame", (data) => handleSocketJoinGame(io, socket, data));
    socket.on("gameEvent", (data) => handleSocketGameEvent(io, socket, data));
    socket.on("roomEvent", (data) => handleSocketRoomEvent(io, socket, data));

    socket.on("disconnect", () => handleSocketDisconnect(io, socket));
  })
  

  
}