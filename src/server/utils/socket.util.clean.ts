import { CustomSocket, GameEventPayload, IOServer, JoinGamePayload, RoomEventPayload } from "../interfaces/SocketTypes";
import { games, users } from "../game/game";
import { setDeck } from "./game.util";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { GameService } from "../services/GameService";
import { RoomService } from "../services/RoomService";
import { EventHandler } from "../services/EventHandler";
import { ROOM_EVENT } from "@/shared/enums/RoomEvent";
import ValidatorService from "../services/ValidatorService";

// Create service instances
const gameService = new GameService();
const roomService = new RoomService();
const eventHandler = new EventHandler();
const validatorService = new ValidatorService();

export const handleSocketJoinGame = async (
  io: IOServer,
  socket: CustomSocket,
  data: JoinGamePayload
) => {
  try {
    // Validate input
    const validation = validatorService.validateJoinGame(data);
    if (!validation.valid) {
      socket.emit('error', { message: validation.error });
      return;
    }

    const { roomName, playerName, deckId, p2DeckId } = data;

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
    io.emit("rooms", roomService.getRooms());
    io.to(roomName).emit("roomEvent", joinResult.room);
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
      
      if (room && room.players[socket.id]) {
        // Trigger player left event
        gameService.playerLeft(socket.room, room.players[socket.id]);
        
        // Remove player from room (this also cleans up empty rooms)
        roomService.leaveRoom(socket.room, socket.id);

        // Clean up game state if room is empty
        if (!roomService.getRoom(socket.room) && games[socket.room]) {
          delete games[socket.room];
        }

        // Emit updated rooms
        io.emit("rooms", roomService.getRooms());
      }
    }

    console.log("User disconnected:", socket.id);

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