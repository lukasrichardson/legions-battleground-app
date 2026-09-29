export type PlayerSide = "p1" | "p2";

export enum MatchStatus {
  ReadyCheck = "readyCheck",
  Rps = "rps",
  Mulligans = "mulligans",
  PreGame = "preGame",
  InProgress = "inProgress",
  Completed = "completed",
}

export type MatchResult =
  | { kind: "concession"; winner: PlayerSide; concededBy: PlayerSide }
  | { kind: "draw"; offeredBy: PlayerSide; acceptedBy: PlayerSide };

export interface DrawOffer {
  offeredBy: PlayerSide;
}
