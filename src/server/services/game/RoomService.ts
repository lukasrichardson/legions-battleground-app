import { PrivateRoomInfo, PrivateRoomsCollection, rooms } from '../../network/roomRegistry';
import { PublicRoomInfo, PublicRoomsCollection, RoomStateForMembers } from '@/shared/interfaces/RoomInterface';
import IPlayer from './interfaces/IPlayer';
import { hashRoomPassword, matchesRoomPassword } from './roomPassword';

export class RoomService {

  async createRoom(roomId: string, options: { sandboxMode?: boolean; password?: string } = {}) {
    if (rooms[roomId]) throw new Error(`Room ${roomId} already exists`);
    rooms[roomId] = {
      id: roomId,
      players: {},
      sandboxMode: options.sandboxMode ?? true,
      passwordHash: options.password ? await hashRoomPassword(options.password) : undefined,
    };
    return rooms[roomId];
  }

  joinRoom(roomId: string, player: { id: string; name: string }) {
    const room = this.getRoom(roomId);
    if (!room) return { success: false as const };

    if (room.players[player.id]) {
      return { success: true, room };
    }

    const playerCount = Object.values(room.players).length;
    const hasP1 = Object.values(room.players).some((p: IPlayer) => p.p1);
    const isP1 = playerCount === 0 || !hasP1;

    room.players[player.id] = { ...player, p1: isP1 };

    return { success: true, room };
  }

  leaveRoom(roomId: string, playerId: string) {
    if (!rooms[roomId]) return;

    delete rooms[roomId].players[playerId];

    // Clean up empty room
    if (Object.keys(rooms[roomId].players).length === 0) {
      delete rooms[roomId];
    }
  }

  getRooms(): PrivateRoomsCollection {
    return rooms;
  }

  getRoom(roomId: string) {
    return rooms[roomId] || null;
  }

  async mayJoin(roomId: string, suppliedPassword: unknown): Promise<boolean> {
    const room = this.getRoom(roomId);
    return Boolean(room) && matchesRoomPassword(room.passwordHash, suppliedPassword);
  }

  toPublicRoom(room: PrivateRoomInfo): PublicRoomInfo {
    const players = Object.values(room.players);
    const host = players.find((player) => player.p1);
    return {
      id: room.id,
      hostName: host?.name ?? null,
      playerCount: players.length,
      sandboxMode: room.sandboxMode,
      isLocked: Boolean(room.passwordHash),
    };
  }

  getPublicRooms(): PublicRoomsCollection {
    return Object.fromEntries(Object.values(rooms).map((room) => [room.id, this.toPublicRoom(room)]));
  }

  toRoomStateForMembers(room: PrivateRoomInfo): RoomStateForMembers {
    return { id: room.id, players: room.players, sandboxMode: room.sandboxMode };
  }

  switchSide(roomId: string, player: { id: string; p1: boolean }) {
    rooms[roomId].players[player.id].p1 = !rooms[roomId].players[player.id].p1;
    return this.getRoom(roomId);
  }

}
