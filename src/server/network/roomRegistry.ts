import { PlayerInfo } from "@/shared/interfaces/RoomInterface";

export interface PrivateRoomInfo {
  id: string;
  players: Record<string, PlayerInfo>;
  sandboxMode: boolean;
  passwordHash?: string;
}

export type PrivateRoomsCollection = Record<string, PrivateRoomInfo>;

export const rooms: PrivateRoomsCollection = {};
