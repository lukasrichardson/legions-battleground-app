export interface PlayerInfo {
  id: string;
  name: string;
  p1: boolean;
}

export interface PublicRoomInfo {
  id: string;
  hostName: string | null;
  playerCount: number;
  sandboxMode: boolean;
  isLocked: boolean;
}

export type PublicRoomsCollection = Record<string, PublicRoomInfo>;

export interface RoomStateForMembers {
  id: string;
  players: Record<string, PlayerInfo>;
  sandboxMode: boolean;
}
