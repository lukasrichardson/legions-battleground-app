import { PrivateRoomInfo, PrivateRoomsCollection, rooms } from '../../network/roomRegistry';
import { PlayerSide } from '@/shared/enums/Match';
import { RoomAdmissionGrant } from '../../network/roomAdmissionTicket';
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

  joinOrResumeRegularRoom(roomId: string, grant: RoomAdmissionGrant, socketId: string): PlayerSide {
    const room = this.getRoom(roomId);
    if (!room || room.sandboxMode) throw new Error("Regular room not found");
    const seats = room.regularSeats ?? {};
    const existing = (Object.entries(seats) as [PlayerSide, NonNullable<typeof seats.p1>][])
      .find(([, seat]) => seat.userId === grant.userId);
    if (existing) {
      const [side, seat] = existing;
      if (seat.connected && seat.socketId !== socketId) throw new Error("This regular-match seat is already connected");
      seat.socketId = socketId;
      seat.connected = true;
      room.players[socketId] = { id: socketId, name: seat.name, p1: side === "p1" };
      return side;
    }
    if (seats.p1 && seats.p2) throw new Error("Room is full");
    const side: PlayerSide = seats.p1 ? "p2" : "p1";
    seats[side] = { userId: grant.userId, name: grant.playerName, deckId: grant.deckId, socketId, connected: true };
    room.regularSeats = seats;
    room.players[socketId] = { id: socketId, name: grant.playerName, p1: side === "p1" };
    return side;
  }

  markRegularSeatDisconnected(roomId: string, socketId: string): void {
    const room = this.getRoom(roomId);
    if (!room?.regularSeats) return;
    const seat = Object.values(room.regularSeats).find((candidate) => candidate?.socketId === socketId);
    if (!seat) return;
    seat.socketId = null;
    seat.connected = false;
    delete room.players[socketId];
  }

  hasConnectedRegularOpponent(roomId: string): boolean {
    return Object.values(this.getRoom(roomId)?.regularSeats ?? {}).some((seat) => seat?.connected);
  }

  removeRoom(roomId: string): void {
    delete rooms[roomId];
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
      hostName: host?.name ?? room.regularSeats?.p1?.name ?? null,
      playerCount: room.sandboxMode ? players.length : Object.keys(room.regularSeats ?? {}).length,
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
