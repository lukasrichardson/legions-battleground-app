import { users,  } from "../game/game";
import { IOServer, CustomSocket } from "../interfaces/SocketTypes";
import { RoomService } from "../services/game/RoomService";
export { rooms } from "./roomRegistry";
import { 
  handleSocketDisconnect,
  handleSocketGameEvent,
  handleSocketJoinGame,
  handleSocketRoomEvent
} from "../utils/socket.util.clean";

const roomService = new RoomService();

export const handleSocketConnection = (io: IOServer) => {
  io.on("connection", (socket: CustomSocket) => {

    if (!users[socket.id as string]) {
      users[socket.id as string] = socket.id;
    }
    console.log("a user connected", users[socket.id as string]);
    socket.emit("rooms", roomService.getPublicRooms());

    socket.on("joinGame", () => handleSocketJoinGame(io, socket));
    socket.on("gameEvent", (data) => handleSocketGameEvent(io, socket, data));
    socket.on("roomEvent", (data) => handleSocketRoomEvent(io, socket, data));

    socket.on("disconnect", () => handleSocketDisconnect(io, socket));
  })
  

  
}
