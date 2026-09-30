
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { games } from "../game/game";
import { StepType } from "../interfaces/SequenceInterfaces";
import { addSequenceItem, drawCardP1, drawCardP2, resolveFirstItemInSequence } from "../utils/game.util";
import { addGameLog } from "../utils/generateGameLog";
import { renderNumberthSuffix } from "../utils/string.utils";
import { Server } from "socket.io";
import { validateForSandbox } from "../utils/sandboxValidator.util";
import { changeCardModifierInState, moveCardInState } from "@/shared/gameStateMutations";
import type { MoveCardAction as MoveCardActionInterface } from "@/shared/interfaces/GameCommands";

export type { MoveCardAction as MoveCardActionInterface } from "@/shared/interfaces/GameCommands";

export const moveCard = (
  roomId: string,
  action: MoveCardActionInterface,
  player: {
    name: string,
    p1: boolean
  },
  io: Server,
  shouldLog: boolean = true
) => {
  const cardToAdd = moveCardInState(games[roomId], action);
  if (shouldLog) {
    games[roomId].gameLog = addGameLog(
      games[roomId].gameLog,
      `${player.name} (${player.p1 ? "P1" : "P2"}) moved: ${cardToAdd?.name ?? "a card"} from: ${action.from.target} to: ${action.target}${action.targetIndex != undefined ? " at index: " + action.targetIndex : ""}`
    );
  }
}

export const conscript = (roomId: string, action: MoveCardActionInterface, player: { name: string, p1: boolean }, io: Server) => {
  const isValid = validateForSandbox(roomId, () => {
    // Existing validation logic
    if (games[roomId].playerConscripted) {
      console.warn("Player has already conscripted this turn");
      return false;
    }
    return true;
  });
  
  if (!isValid) {
    return;
  }
  
  addSequenceItem(roomId, {
    type: CARD_TYPE.WARRIOR,
    cost: [],
    effect: [{
      type: StepType.Conscript,
      selected: [
        {
          id: action.id,
          from: { target: player.p1 ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND, targetIndex: null },
          target: player.p1 ? CARD_TARGET.P1_PLAYER_WARRIOR : CARD_TARGET.P2_PLAYER_WARRIOR,
          keywords: action.keywords || []
        }
      ]
    }],
    name: "Conscript"
  });
  // games[roomId].playerConscripted = true;
  moveCard(roomId, action, player, io, true);
  //assume no response to conscription for now
  resolveFirstItemInSequence(roomId, io);
  
}

export const decreaseCardCooldown = (roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }) => {
  const { cardTarget, zoneIndex } = action;
  changeCardModifierInState(games[roomId], action, "cooldown", -1);
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, "decreased card cooldown in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
}

export const plunder = (roomId: string, action: { number: number }, player: { name: string, p1: boolean }) => {
  if (player.p1) {
    drawCardP1(roomId, player, action.number - 1);
  } else {
    drawCardP2(roomId, player, action.number - 1);
  }
  games[roomId].gameLog = addGameLog(games[roomId].gameLog, `${player.name} (${player.p1 ? "P1" : "P2"}) ` + "plundered: " + action.number + renderNumberthSuffix(action.number) + " card from their deck. ");

}
