import { CustomSocket, GameEventPayload, IOServer, RoomEventPayload } from "../interfaces/SocketTypes";
import { games, users } from "../game/game";
import { setDeck } from "./game.util";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { GameService } from "../services/game/GameService";
import { RoomService } from "../services/game/RoomService";
import { EventHandler } from "../services/game/EventHandler";
import { ROOM_EVENT } from "@/shared/enums/RoomEvent";
import ValidatorService from "../services/game/ValidatorService";
import { GameHistoryService } from "../services/game/GameHistoryService";
import { ROOM_ADMISSION_COOKIE, resolveAdmissionGrant } from "../network/roomAdmissionTicket";

const readCookie = (cookieHeader: string | undefined, name: string): string | undefined => {
  if (!cookieHeader) return undefined;
  return cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
};

const getAdmissionGrant = (socket: CustomSocket) => {
  const handshakeToken = socket.handshake.auth?.admissionToken;
  const token = typeof handshakeToken === "string"
    ? handshakeToken
    : readCookie(socket.handshake.headers.cookie, ROOM_ADMISSION_COOKIE);
  return resolveAdmissionGrant(token);
};

// Create service instances
const gameService = new GameService();
const roomService = new RoomService();
const eventHandler = new EventHandler();
const validatorService = new ValidatorService();
const gameHistoryService = new GameHistoryService();

export const handleSocketJoinGame = async (
  io: IOServer,
  socket: CustomSocket
) => {
  try {
    const grant = getAdmissionGrant(socket);
    if (!grant) {
      socket.emit('error', { message: 'Join authorization expired. Return to the lobby and join again.' });
      return;
    }

    const { roomId: roomName, playerName, deckId, p2DeckId } = grant;
    const existingRoom = roomService.getRoom(roomName);
    if (!existingRoom) {
      socket.emit('error', { message: 'Failed to join room' });
      return;
    }

    if (!existingRoom.sandboxMode) {
      roomService.joinOrResumeRegularRoom(roomName, grant, socket.id);
      gameService.createRegularLobbyGame(roomName);
      socket.room = roomName;
      socket.join(roomName);
      io.emit("rooms", roomService.getPublicRooms());
      io.to(roomName).emit("roomEvent", roomService.toRoomStateForMembers(roomService.getRoom(roomName)!));
      io.to(roomName).emit("gameEvent", { type: GAME_EVENT.startGame, data: games[roomName] });
      return;
    }

    // Join or create room
    const player = { id: socket.id, name: playerName };
    const joinResult = roomService.joinRoom(roomName, player);
    
    if (!joinResult.success) {
      socket.emit('error', { message: 'Failed to join room' });
      return;
    }

    // Set up socket
    socket.room = roomName;
    socket.join(roomName);

    // Start or get game
    if (!games[roomName]) {
      await gameService.startGame(roomName, deckId, p2DeckId);
    } else {
      const isP1 = joinResult.room.players[socket.id]?.p1 ?? false;
      await setDeck(roomName, deckId, isP1);
    }

    // Emit updates
    io.emit("rooms", roomService.getPublicRooms());
    io.to(roomName).emit("roomEvent", roomService.toRoomStateForMembers(joinResult.room));
    io.to(roomName).emit("gameEvent", { 
      type: GAME_EVENT.startGame, 
      data: games[roomName] 
    });

  } catch (error) {
    const errorMsg = validatorService.handleError(error, 'handleSocketJoinGame');
    socket.emit('error', { message: errorMsg });
  }
};

export const handleSocketGameEvent = async (
  io: IOServer, 
  socket: CustomSocket, 
  payload: GameEventPayload
) => {
  if (!socket.room) {
    console.error('No room for game event');
    return;
  }

  try {
    // Validate payload
    const validation = validatorService.validateGameEvent(payload);
    if (!validation.valid) {
      socket.emit('error', { message: validation.error });
      return;
    }

    const room = roomService.getRoom(socket.room);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const player = room.players[socket.id];
    if (!player) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    await eventHandler.handleGameEvent(
      socket.room,
      payload.type as GAME_EVENT,
      payload.data,
      player,
      io
    );

  } catch (error) {
    const errorMsg = validatorService.handleError(error, 'handleSocketGameEvent');
    socket.emit('error', { message: errorMsg });
  }
};

export const handleSocketRoomEvent = async (
  io: IOServer,
  socket: CustomSocket,
  payload: RoomEventPayload
) => {
  if (!socket.room) {
    console.error('No room for room event');
    return;
  }

  try {
    // Validate payload
    const validation = validatorService.validateRoomEvent(payload);
    if (!validation.valid) {
      socket.emit('error', { message: validation.error });
      return;
    }

    const room = roomService.getRoom(socket.room);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const player = room.players[socket.id];
    if (!player) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    eventHandler.handleRoomEvent(
      socket.room,
      payload.type as ROOM_EVENT,
      player,
      io
    );

  } catch (error) {
    const errorMsg = validatorService.handleError(error, 'handleSocketRoomEvent');
    socket.emit('error', { message: errorMsg });
  }
};

export const handleSocketDisconnect = async (
  io: IOServer,
  socket: CustomSocket
) => {
  try {
    // Clean up user
    if (users[socket.id]) {
      delete users[socket.id];
    }

    // Handle room cleanup
    if (socket.room) {
      const room = roomService.getRoom(socket.room);
      
      if (room && !room.sandboxMode) {
        roomService.markRegularSeatDisconnected(socket.room, socket.id);
        if (!roomService.hasConnectedRegularOpponent(socket.room)) {
          roomService.removeRoom(socket.room);
          delete games[socket.room];
        } else {
          io.to(socket.room).emit("roomEvent", roomService.toRoomStateForMembers(room));
          io.to(socket.room).emit("gameEvent", { type: GAME_EVENT.startGame, data: games[socket.room] });
        }
        io.emit("rooms", roomService.getPublicRooms());
      } else if (room && room.players[socket.id]) {
        // Trigger player left event
        gameService.playerLeft(socket.room, room.players[socket.id]);
        
        // Remove player from room (this also cleans up empty rooms)
        roomService.leaveRoom(socket.room, socket.id);

        // Clean up game state if room is empty
        if (!roomService.getRoom(socket.room) && games[socket.room]) {
          delete games[socket.room];
        }

        // Emit updated rooms
        io.emit("rooms", roomService.getPublicRooms());
      }
    }

    console.log("User disconnected:", socket.id);
    gameHistoryService.clearGameHistory(socket.room);


  } catch (error) {
    console.error('Disconnect cleanup failed:', error);
    
    // Force cleanup to prevent memory leaks
    if (socket.room) {
      roomService.leaveRoom(socket.room, socket.id);
      if (games[socket.room]) {
        delete games[socket.room];
      }
    }
  }
};

export const handleSocketLeaveRegularRoom = async (io: IOServer, socket: CustomSocket) => {
  if (!socket.room) return;
  const roomId = socket.room;
  const room = roomService.getRoom(roomId);
  if (!room || room.sandboxMode) return;
  roomService.markRegularSeatDisconnected(roomId, socket.id);
  socket.leave(roomId);
  socket.room = undefined;
  if (!roomService.hasConnectedRegularOpponent(roomId)) {
    roomService.removeRoom(roomId);
    delete games[roomId];
  } else {
    io.to(roomId).emit("roomEvent", roomService.toRoomStateForMembers(room));
    io.to(roomId).emit("gameEvent", { type: GAME_EVENT.startGame, data: games[roomId] });
  }
  io.emit("rooms", roomService.getPublicRooms());
};
