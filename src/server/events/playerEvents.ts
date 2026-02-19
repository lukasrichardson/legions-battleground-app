import { MoveCardActionInterface, decreaseCardCooldown } from "./cardEvents";
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { PreGamePhase, NextPhaseP1Wins, NextPhaseP2Wins, GamePhase } from "../enums/Phases";
import { games } from "../game/game";
import { p1WinsRPS, p2WinsRPS, drawCardP1, drawCardP2, resolveFirstItemInSequence, emitCurrentState, addSequenceItem } from "../utils/game.util";
import { addGameLog } from "../utils/generateGameLog";
import { Server } from "socket.io";

// Simple RPS logic
const RPS_BEATS = { Rock: "Scissors", Paper: "Rock", Scissors: "Paper" };
const checkRpsWinner = (p1: string, p2: string) =>
  p1 === p2 ? "tie" : RPS_BEATS[p1] === p2 ? "p1" : "p2";


//gameActions
export const setRpsChoice = (roomId: string, action: "Rock" | "Paper" | "Scissors", player: { name: string; p1: boolean }, io: Server) => {
  if (!games[roomId]) return;
  if (games[roomId].currentPhase === PreGamePhase.RPS) {
    if (action) {
      if (player.p1) {
        games[roomId].p1RPSChoice = action;
        if (games[roomId].p2RPSChoice) {
          // Both players have made their choices, determine the winner
          const winner = checkRpsWinner(games[roomId].p1RPSChoice, games[roomId].p2RPSChoice);
          if (winner === "tie") {
            games[roomId].gameLog = addGameLog(games[roomId].gameLog, "RPS Tie: Both players chose " + action);
            games[roomId].p1RPSChoice = null;
            games[roomId].p2RPSChoice = null;
          } else if (winner === "p1") {
            games[roomId].gameLog = addGameLog(games[roomId].gameLog, "P1 Wins RPS: " + games[roomId].p1RPSChoice + " beats " + games[roomId].p2RPSChoice);
            p1WinsRPS(roomId, io);
          } else {
            games[roomId].gameLog = addGameLog(games[roomId].gameLog, "P2 Wins RPS: " + games[roomId].p2RPSChoice + " beats " + games[roomId].p1RPSChoice);
            p2WinsRPS(roomId, io);
          }
        }
      } else {
        games[roomId].p2RPSChoice = action;
        if (games[roomId].p1RPSChoice) {
          // Both players have made their choices, determine the winner
          const winner = checkRpsWinner(games[roomId].p1RPSChoice, games[roomId].p2RPSChoice);
          if (winner === "tie") {
            games[roomId].gameLog = addGameLog(games[roomId].gameLog, "RPS Tie: Both players chose " + action);
          } else if (winner === "p1") {
            games[roomId].gameLog = addGameLog(games[roomId].gameLog, "P1 Wins RPS: " + games[roomId].p1RPSChoice + " beats " + games[roomId].p2RPSChoice);
            p1WinsRPS(roomId, io);
          } else {
            games[roomId].gameLog = addGameLog(games[roomId].gameLog, "P2 Wins RPS: " + games[roomId].p2RPSChoice + " beats " + games[roomId].p1RPSChoice);
            p2WinsRPS(roomId, io);
          }
        }
      }
    }
  }
}

export const playerInput = (roomId: string, action: { selected: MoveCardActionInterface[] }, player: { name: string; p1: boolean }, io: Server) => {
  if (games[roomId].resolving) {
    if (games[roomId].sequences.length > 0) {
      const currentSequence = games[roomId].sequences[0];
      if (currentSequence.items.length > 0) {
        const firstItem = currentSequence.items[0];
        if (firstItem?.effect[0].waitingForInput && firstItem?.effect[0].waitingForInput[player.p1 ? "p1" : "p2"]) {
          // handle the player input here
          firstItem.effect[0].selected = action.selected;
          firstItem.effect[0].waitingForInput[player.p1 ? "p1" : "p2"] = false;
          if (!firstItem.effect[0].waitingForInput.p1 && !firstItem.effect[0].waitingForInput.p2) {
            resolveFirstItemInSequence(roomId, io);
          }
        }
      }
    }
  } else {
    // No sequence is currently being resolved - removed console.warn
  }
}

export const goNextPhase = (roomId: string, action: object, player: { name?: string; p1?: boolean }, io: Server) => {
  if (!games[roomId]) return;
  const nextPhaseMap = games[roomId].rpsWinner === "p1" ? NextPhaseP1Wins : NextPhaseP2Wins;
  const nextPhase = nextPhaseMap[games[roomId].currentPhase];
  if (nextPhase) {
    games[roomId].currentPhase = nextPhase;
    if (games[roomId].sandboxMode) {
      if (nextPhase === GamePhase.P1Countdown || nextPhase === GamePhase.P2Countdown) {
        games[roomId].turnNumber++;
      }
      return;
    } // In sandbox mode, stop auto-progression after setting the next phase
    switch (nextPhase) {
      case PreGamePhase.P1Mulligan:
        emitCurrentState(roomId, io);

        break;
      case PreGamePhase.P2Mulligan:
        emitCurrentState(roomId, io);
        break;
      case GamePhase.P1Countdown:
        games[roomId].playerConscripted = false;
        games[roomId].turnNumber++;
        decreaseCardCooldown(roomId, { cardTarget: CARD_TARGET.P1_PLAYER_VEIL_REALM, cardIndex: 0, zoneIndex: null });
        if (games[roomId].p1PlayerVeilRealm[0]?.cooldown === 0 && games[roomId].p1PlayerVeilRealm[0]?.effect) {
          // if the veil realm has an effect, we resolve it
          addSequenceItem(roomId, {
            type: CARD_TYPE.VEIL_REALM,
            cost: [],
            effect: games[roomId].p1PlayerVeilRealm[0]?.effect,
            name: games[roomId].p1PlayerVeilRealm[0]?.name,
          });
          resolveFirstItemInSequence(roomId, io);

        } else {
          goNextPhase(roomId, action, player, io);
          emitCurrentState(roomId, io);
        }
        break;
      case GamePhase.P2Countdown:
        games[roomId].turnNumber++;
        games[roomId].playerConscripted = false;
        decreaseCardCooldown(roomId, { cardTarget: CARD_TARGET.P2_PLAYER_VEIL_REALM, cardIndex: 0, zoneIndex: null });
        if (games[roomId].p2PlayerVeilRealm[0]?.cooldown === 0 && games[roomId].p2PlayerVeilRealm[0]?.effect) {
          // if the veil realm has an effect, we resolve it
          addSequenceItem(roomId, {
            type: CARD_TYPE.VEIL_REALM,
            cost: [],
            effect: games[roomId].p2PlayerVeilRealm[0]?.effect,
            name: games[roomId].p2PlayerVeilRealm[0]?.name,
          });
          resolveFirstItemInSequence(roomId, io);

        } else {
          goNextPhase(roomId, action, player, io);
          emitCurrentState(roomId, io);
        }
        break;
      case PreGamePhase.PostMulliganDraw:
        if (games[roomId].p1Mulligan) {
          drawCardP2(roomId, { name: "P2", p1: false }, 0);
        }
        if (games[roomId].p2Mulligan) {
          drawCardP1(roomId, { name: "P1", p1: true }, 0);
        }
        goNextPhase(roomId, action, player, io);
        emitCurrentState(roomId, io);
        break;
      case PreGamePhase.P1Guardian:
        if (games[roomId].p1PlayerGuardian[0]?.preGameEffect) {
          addSequenceItem(roomId, {
            type: CARD_TYPE.GUARDIAN,
            cost: [],
            effect: games[roomId].p1PlayerGuardian[0]?.preGameEffect,
            name: games[roomId].p1PlayerGuardian[0]?.name,
          });
          resolveFirstItemInSequence(roomId, io);
        }
        emitCurrentState(roomId, io);
        break;
      case PreGamePhase.P2Guardian:
        if (games[roomId].p2PlayerGuardian[0]?.preGameEffect) {
          addSequenceItem(roomId, {
            type: CARD_TYPE.GUARDIAN,
            cost: [],
            effect: games[roomId].p2PlayerGuardian[0]?.preGameEffect,
            name: games[roomId].p2PlayerGuardian[0]?.name,
          });
          resolveFirstItemInSequence(roomId, io);
        }
        emitCurrentState(roomId, io);
        break;
      case PreGamePhase.P1PreGame:
        goNextPhase(roomId, action, player, io);
        emitCurrentState(roomId, io);
        break;
      case PreGamePhase.P2PreGame:
        goNextPhase(roomId, action, player, io);
        emitCurrentState(roomId, io);
        break;
      case GamePhase.P1Reinforce:
        if (games[roomId].turnNumber > 1) {
          drawCardP1(roomId, { name: "P1", p1: true }, 0);
        }
        goNextPhase(roomId, {}, { name: "P1", p1: true }, io); // auto advance from reinforce to war
        emitCurrentState(roomId, io);
        break;
      case GamePhase.P2Reinforce:
        if (games[roomId].turnNumber > 1) {
          drawCardP2(roomId, { name: "P2", p1: false }, 0);
        }
        goNextPhase(roomId, {}, { name: "P2", p1: false }, io); // auto advance from reinforce to war
        emitCurrentState(roomId, io);
        break;
      case GamePhase.P1War:
        //   // do nothing for now
        //   goNextPhase(roomId, {}, player, io); // auto advance from war to end of war
        break;
      case GamePhase.P2War:
        //   // do nothing for now
        //   goNextPhase(roomId, {}, player, io); // auto advance from war to end of war
        break;

      // case GamePhase.P1EndOfWar:
      //   // do nothing for now
      //   goNextPhase(roomId, {}, player, io); // auto advance from end of war to end of turn
      //   break;
      // case GamePhase.P2EndOfWar:
      //   // do nothing for now
      //   goNextPhase(roomId, {}, player, io); // auto advance from end of war to end of turn
      //   break;
      // case GamePhase.P1EndOfTurn:
      //   // do nothing for now
      //   goNextPhase(roomId, {}, player, io); // auto advance from end of turn to end of game
      //   break;
      // case GamePhase.P2EndOfTurn:
      //   // do nothing for now
      //   goNextPhase(roomId, {}, player, io); // auto advance from end of turn to end of game
      //   break;
      // case GamePhase.P1End:
      //   // do nothing for now
      //   goNextPhase(roomId, {}, player, io); // auto advance from end of game to next phase
      //   break;
      // case GamePhase.P2End:
      // do nothing for now
      // goNextPhase(roomId, {}, player, io); // auto advance from end of game to next phase
      // reset
      // break;
      default:
        goNextPhase(roomId, {}, { name: "P1", p1: true }, io); // default to P1 for fallback
        emitCurrentState(roomId, io);
        break;
    }
  } else {
    // No next phase defined for current phase - removed console.warn
  }

}