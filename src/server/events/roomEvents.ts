import { games } from "../game/game";
import { rooms } from "../network/socketHandler";

//room
export const switchSide = (roomId: string, player: { id: string; p1: boolean }) => {
  rooms[roomId].players[player.id].p1 = !rooms[roomId].players[player.id].p1;
}

//room
export const playerLeft = (roomId: string, player: { id: string; p1: boolean }) => {
  if (player.p1) {
    games[roomId].p1Viewing = null;
  } else {
    games[roomId].p2Viewing = null;
  }
}