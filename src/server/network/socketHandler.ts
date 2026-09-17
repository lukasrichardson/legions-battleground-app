import { users,  } from "../game/game";
import { RoomsCollection } from "../../shared/interfaces/RoomInterface";
import { IOServer, CustomSocket } from "../interfaces/SocketTypes";
import { 
  handleSocketDisconnect,
  handleSocketGameEvent,
  handleSocketJoinGame,
  handleSocketRoomEvent
} from "../utils/socket.util.clean";
import { RoomService } from "../services/game/RoomService";
import { getToken } from "next-auth/jwt";
import { IncomingMessage } from "http";

export const rooms: RoomsCollection = {};
const roomService = new RoomService();

export const handleSocketConnection = (io: IOServer) => {
  io.use(async (socket, next) => {
    if (process.env.NODE_ENV !== 'production') {
      (socket as CustomSocket).user = { id: 'development-user' };
      next();
      return;
    }

    try {
      const token = await getToken({
        req: socket.request as IncomingMessage & { cookies: Partial<{ [key: string]: string }> },
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (token?.sub) {
        const customSocket = socket as CustomSocket;
        customSocket.user = {
          id: token.sub,
          email: token.email || undefined,
          name: token.name || undefined,
        };
      }
      next();
    } catch {
      // Room discovery is public. Protected events verify socket.user themselves.
      next();
    }
  });

  io.on("connection", (socket: CustomSocket) => {

    if (!users[socket.id as string]) {
      users[socket.id as string] = socket.id;
    }
    console.log("a user connected", users[socket.id as string]);
    socket.emit("rooms", roomService.getRooms());

    socket.on("joinGame", (data) => handleSocketJoinGame(io, socket, data));
    socket.on("gameEvent", (data) => handleSocketGameEvent(io, socket, data));
    socket.on("roomEvent", (data) => handleSocketRoomEvent(io, socket, data));

    socket.on("disconnect", () => handleSocketDisconnect(io, socket));
  })
  

  
}
