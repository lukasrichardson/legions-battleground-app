import { GameEventPayload } from "@/server/interfaces/SocketTypes";

export interface GameEventLog {
    p1: boolean;
    playerName: string;
    event: GameEventPayload;
  }