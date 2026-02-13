import { rooms } from '../network/socketHandler';
import { RoomsCollection } from '../../shared/interfaces/RoomInterface';
import IPlayer from './interfaces/IPlayer';

export class RoomService {
  createRoom(roomId: string, options: { sandboxMode?: boolean; password?: string } = {}) {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        players: {},
        sandboxMode: options.sandboxMode ?? true,
        password: options.password ?? ""
      };
    }
    return rooms[roomId];
  }

  joinRoom(roomId: string, player: { id: string; name: string }) {
    const room = this.createRoom(roomId);
    
    if (rooms[roomId].players[player.id]) {
      return { success: true, room };
    }

    const playerCount = Object.values(rooms[roomId].players).length;
    const hasP1 = Object.values(rooms[roomId].players).some((p: IPlayer) => p.p1);
    const isP1 = playerCount === 0 || !hasP1;

    rooms[roomId].players[player.id] = { ...player, p1: isP1 };
    
    return { success: true, room: rooms[roomId] };
  }

  leaveRoom(roomId: string, playerId: string) {
    if (!rooms[roomId]) return;

    delete rooms[roomId].players[playerId];
    
    // Clean up empty room
    if (Object.keys(rooms[roomId].players).length === 0) {
      delete rooms[roomId];
    }
  }

  getRooms(): RoomsCollection {
    return rooms;
  }

  getRoom(roomId: string) {
    return rooms[roomId] || null;
  }
}