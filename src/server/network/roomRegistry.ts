import { PlayerInfo } from "@/shared/interfaces/RoomInterface";
import { PlayerSide } from "@/shared/enums/Match";

export interface RegularSeat {
  userId: string;
  name: string;
  deckId: string;
  socketId: string | null;
  connected: boolean;
}

export interface PrivateRoomInfo {
  id: string;
  players: Record<string, PlayerInfo>;
  sandboxMode: boolean;
  passwordHash?: string;
  regularSeats?: Partial<Record<PlayerSide, RegularSeat>>;
}

export type PrivateRoomsCollection = Record<string, PrivateRoomInfo>;

export const rooms: PrivateRoomsCollection = {};
