import { users, gameEventMap, games, roomEventMap } from "../game/game";
import { setDeck } from "../utils/game.util";
import { GAME_EVENT } from "../enums/GameEvent";
import { ROOM_EVENT } from "../enums/RoomEvent";
import { startGame } from "../game/game";
import { RoomsCollection } from "../../shared/interfaces/RoomInterface";
import { IOServer, CustomSocket } from "../interfaces/SocketTypes";

export const rooms: RoomsCollection = {};

export const handleSocketConnection = (io: IOServer) => {
  io.on("connection", (socket: CustomSocket) => {

    if (!users[socket.id as string]) {
      users[socket.id as string] = socket.id;
    }
    console.log("a user connected", users[socket.id as string]);
    socket.emit("rooms", rooms);

    socket.on("joinGame", async (data: {roomName: string, playerName: string, deckId: string}) => {
      if (!data.playerName || !data.roomName || !data.deckId) return;
      const { roomName, playerName, deckId } = data;
      if (!rooms[roomName]) {
        rooms[roomName] = {id: roomName, players: {}, sandboxMode: true, password: ""};
        // initialize game room in server
      }
      if (!!rooms[roomName]?.players?.[socket.id]) return;
      socket.room = roomName;
      const p1 = Object.values(rooms[roomName].players).length === 0 || !(Object.values(rooms[roomName].players)?.find((player) => player.p1)) || rooms[roomName].players[socket.id]?.p1;
      rooms[roomName].players[socket.id] = {id: socket.id, name: playerName, p1: !!p1};
      socket.join(roomName);
      
      if (!games[roomName]) {
        await startGame(roomName, deckId);
      } else {
        await setDeck(roomName, deckId, p1);
      }
      // socket.emit("joinedGame", roomName);
      io.emit("rooms", rooms);
      io.to(socket.room).emit("roomEvent", rooms[socket.room]);
      io.to(socket.room).emit("gameEvent", { type: GAME_EVENT.startGame, data: games[roomName] });
    })
  
    interface GameEventPayload {
      type: GAME_EVENT;
      data?: unknown;
    }

    socket.on("gameEvent", async (payload: GameEventPayload) => {
      if (!socket.room || !rooms[socket.room]) return;
      const { data, type } = payload;
      const action = gameEventMap[type as GAME_EVENT];
  
      if (type === GAME_EVENT.resetGame) {
        if (action) {
          if (data) {
            await action(socket.room, data, rooms[socket.room].players[socket.id], io);
            io.to(socket.room).emit("gameEvent", { type, data: games[socket.room] });
          } else {
            await action(socket.room, null, rooms[socket.room].players[socket.id], io);
            io.to(socket.room).emit("gameEvent", { type, data: games[socket.room] });
  
          }
          io.to(socket.room).emit("phaseEvent", { type, data: games[socket.room] });
        }
      } else {
        if (action) {
          if (data) {
            action(socket.room, data, rooms[socket.room].players[socket.id], io);
          } else {
            action(socket.room, null, rooms[socket.room].players[socket.id], io);
          }
          
          io.to(socket.room).emit("phaseEvent", { type, data: games[socket.room] });
          io.to(socket.room).emit("gameEvent", { type, data: games[socket.room] });
        }
      }
  
    });

    interface RoomEventPayload {
      type: ROOM_EVENT;
      data?: unknown;
    }

    socket.on("roomEvent", async (payload: RoomEventPayload) => {
      if (!socket.room || !rooms[socket.room]) return;
      const { type } = payload;
      const action = roomEventMap[type as ROOM_EVENT];
      if (action) {
        action(socket.room, rooms[socket.room].players[socket.id]);
        io.to(socket.room).emit("roomEvent", rooms[socket.room]);
      }
    })

    socket.on("disconnect", () => {
      if (users[socket.id as string]) {
        delete users[socket.id as string];
      }
      
      if (socket.room) {
        try {
          // Ensure room and players exist before accessing
          if (rooms[socket.room] && rooms[socket.room].players && rooms[socket.room].players[socket.id]) {
            roomEventMap[ROOM_EVENT.playerLeft](socket.room, rooms[socket.room].players[socket.id]);
            delete rooms[socket.room].players[socket.id];
            
            // Clean up room if no players left
            if (Object.keys(rooms[socket.room].players).length === 0) {
              console.log(`Cleaning up empty room: ${socket.room}`);
              delete rooms[socket.room];
              
              // Clean up game state
              if (games[socket.room]) {
                delete games[socket.room];
              }
            }
            
            io.emit("rooms", rooms);
          }
        } catch (error) {
          console.error(`Error during disconnect cleanup for room ${socket.room}:`, error);
          // Force cleanup even on error to prevent memory leaks
          if (rooms[socket.room]) {
            delete rooms[socket.room];
          }
          if (games[socket.room]) {
            delete games[socket.room];
          }
        }
      }
      
      console.log("user disconnected ", socket.id);
    });
  })
  

  
}