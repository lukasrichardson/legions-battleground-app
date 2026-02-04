export interface PlayerInfo {
  id: string;
  name: string;
  p1: boolean;
}

export interface RoomInfo {
  id: string;
  players: { [socketId: string]: PlayerInfo };
  sandboxMode: boolean;
  password: string;
}

export interface RoomsCollection {
  [roomId: string]: RoomInfo;
}