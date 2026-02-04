import { games } from "../game/game";
import { addGameLog } from "../utils/generateGameLog";

//health and ap
export const changeP2Health = (roomId: string, action: number) => {
  games[roomId].p2PlayerHealth += action;
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, "p2 player health changed by " + action);
}

export const changeP1Health = (roomId: string, action: number) => {
  games[roomId].p1PlayerHealth += action;
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, "p1 player health changed by " + action);
}

export const changeP2AP = (roomId: string, action: number) => {
  games[roomId].p2PlayerAP += action;
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, "p2 player AP changed by " + action);
}
export const changeP1AP = (roomId: string, action: number) => {
  games[roomId].p1PlayerAP += action;
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, "p1 player AP changed by " + action);
}