import { rooms } from '../../network/socketHandler';
import { PublicRoomInfo, PublicRoomsCollection, RoomInfo } from '@/shared/interfaces/RoomInterface';
import IPlayer from './interfaces/IPlayer';

export class RoomService {

  createRoom(roomId: string, options: { sandboxMode?: boolean; passwordHash?: string } = {}) {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        players: {},
        sandboxMode: options.sandboxMode ?? true,
        passwordHash: options.passwordHash
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

  getPublicRoom(room: RoomInfo): PublicRoomInfo {
    return {
      id: room.id,
      players: room.players,
      sandboxMode: room.sandboxMode,
      requiresPassword: Boolean(room.passwordHash),
    };
  }

  getRooms(): PublicRoomsCollection {
    return Object.fromEntries(
      Object.entries(rooms).map(([roomId, room]) => [roomId, this.getPublicRoom(room)])
    );
  }

  getRoom(roomId: string) {
    return rooms[roomId] || null;
  }

  switchSide(roomId: string, player: { id: string; p1: boolean }): PublicRoomInfo {
    rooms[roomId].players[player.id].p1 = !rooms[roomId].players[player.id].p1;
    return this.getPublicRoom(rooms[roomId]);
  }

}
