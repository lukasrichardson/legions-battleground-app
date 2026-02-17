import { moveCard, MoveCardActionInterface, decreaseCardCooldown } from "./cardEvents";
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { PreGamePhase, NextPhaseP1Wins, NextPhaseP2Wins, GamePhase } from "../enums/Phases";
import { games } from "../game/game";
import { DeckResponse } from "../../shared/interfaces/DeckResponse";
import { resetPlayersCards, fetchPlayerDeckById, p1WinsRPS, p2WinsRPS, drawCardP1, drawCardP2, resolveFirstItemInSequence, emitCurrentState, addSequenceItem, STARTING_HAND_SIZE } from "../utils/game.util";
import { addGameLog } from "../utils/generateGameLog";

// Simple RPS logic
const RPS_BEATS = { Rock: "Scissors", Paper: "Rock", Scissors: "Paper" };
const checkRpsWinner = (p1: string, p2: string) => 
  p1 === p2 ? "tie" : RPS_BEATS[p1] === p2 ? "p1" : "p2";

export const resetGame = async (roomId: string, action?: { p2DeckId?: string; p1DeckId?: string }) => {
  if (!games[roomId]) return;
  // Preserve sandboxMode when resetting
  const currentSandboxMode = games[roomId]?.sandboxMode;
  
  games[roomId].gameLog = addGameLog([], "Game Started");
  games[roomId].p2PlayerAP = 0;
  games[roomId].p1PlayerAP = 0;
  games[roomId].p2PlayerHealth = 0;
  games[roomId].p1PlayerHealth = 0;
  if (action) {
    const { p2DeckId, p1DeckId } = action;
    if (p2DeckId && games[roomId].p2DeckFromServer?.id !== p2DeckId) games[roomId].p2DeckFromServer = await fetchPlayerDeckById({ deckId: p2DeckId });
    if (p1DeckId && games[roomId].p1DeckFromServer?.id !== p1DeckId) games[roomId].p1DeckFromServer = await fetchPlayerDeckById({ deckId: p1DeckId });
  }
  resetPlayersCards(roomId, games[roomId].p1DeckFromServer as DeckResponse, games[roomId].p2DeckFromServer as DeckResponse);

  games[roomId].gameLog = addGameLog(games[roomId].gameLog, "Game Restarted");
  games[roomId].currentPhase = PreGamePhase.RPS;
  games[roomId].turnNumber = 0;
  games[roomId].rpsWinner = null;
  games[roomId].p1RPSChoice = null;
  games[roomId].p2RPSChoice = null;
  games[roomId].p1Mulligan = null;
  games[roomId].p2Mulligan = null;
  //
  games[roomId].sequences = [];
  games[roomId].resolving = false;
  // Restore sandboxMode
  games[roomId].sandboxMode = currentSandboxMode;

}

//gameActions
import { Server } from "socket.io";
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

export const mulligan = (roomId: string, action: object, player: { name: string; p1: boolean }, io: Server) => {
  if (!games[roomId]) return;
  if (player.p1) {
    games[roomId].p1Mulligan = true;
    [...games[roomId].p1PlayerHand].forEach(cardToMove => {
      moveCard(roomId, {
        id: cardToMove.id,
        from: { target: CARD_TARGET.P1_PLAYER_HAND, targetIndex: null },
        target: CARD_TARGET.P1_PLAYER_DECK, bottom: true
      },
        player,
        io,
        false
      );
    })
    for (let i = 0; i < STARTING_HAND_SIZE; i++) {
      drawCardP1(roomId, player);
    }
  } else {
    games[roomId].p2Mulligan = true;

    [...games[roomId].p2PlayerHand].forEach(cardToMove => {
      moveCard(roomId, {
        id: cardToMove.id,
        from: { target: CARD_TARGET.P2_PLAYER_HAND, targetIndex: null },
        target: CARD_TARGET.P2_PLAYER_DECK, bottom: true
      },
        player,
        io,
        false
      );
    })
    for (let i = 0; i < STARTING_HAND_SIZE; i++) {
      drawCardP2(roomId, player);
    }
  }
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, `${player.name} (${player.p1 ? "P1" : "P2"}) ` + "mulliganed their hand.");
  goNextPhase(roomId, {}, {}, io);
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

export const rollDie = (roomId: string, action: { side: "p1" | "p2" }) => {
  if (!games[roomId]) return;
  const { side } = action;
  const result = Math.floor(Math.random() * 6) + 1;
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, side + " player rolled a " + result);
}

export const sendChatMessage = (roomId: string, action: { message: string; side: "p1" | "p2" }) => {
  if (!games[roomId]) return;
  const { message, side } = action;
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, side + " player says: '" + message + "'");
}

export const setP1Vieweing = (roomId: string, action: { cardTarget: CARD_TARGET, limit: number | null, bottom?: boolean }) => {
  if (!games[roomId]) return;
  games[roomId].p1Viewing = (action.limit ? (action.bottom ? "bottom " : "top ") + action.limit + " of " : "") + action.cardTarget;
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, "p1 viewing " + (action.limit ? (action.bottom ? "bottom " : "top ") + action.limit + " of " : "") + action.cardTarget);
}

export const setP2Viewing = (roomId: string, action: { cardTarget: CARD_TARGET; limit: number | null, bottom?: boolean }) => {
  if (!games[roomId]) return;
  games[roomId].p2Viewing = (action.limit ? (action.bottom ? "bottom " : "top ") + action.limit + " of " : "") + action.cardTarget;
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, "p2 viewing " + (action.limit ? (action.bottom ? "bottom " : "top ") + action.limit + " of " : "") + action.cardTarget);

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