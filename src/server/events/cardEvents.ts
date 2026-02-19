
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { games } from "../game/game";
import { CardInterface } from "../../shared/interfaces/CardInterface";
import { StepType } from "../interfaces/SequenceInterfaces";
import { addSequenceItem, drawCardP1, drawCardP2, resolveFirstItemInSequence } from "../utils/game.util";
import { addGameLog } from "../utils/generateGameLog";
import { renderNumberthSuffix } from "../utils/string.utils";
import { Server } from "socket.io";
import { removeCardFromZone, addCardToZone } from "../utils/cardZone.util";
import { validateForSandbox } from "../utils/sandboxValidator.util";

export interface MoveCardActionInterface { id: string, from: {target: CARD_TARGET, targetIndex: number | null}, target: CARD_TARGET, targetIndex?: number, keywords?: string[], bottom?: boolean }

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
  const { id, from, target, targetIndex }: MoveCardActionInterface = action;
  let { bottom = false }: { bottom?: boolean } = action;

  // if target is player deck, toggle bottom (because decks are usually drawn from the top)
  if ([CARD_TARGET.P2_PLAYER_DECK, CARD_TARGET.P1_PLAYER_DECK].includes(target)) bottom = !bottom;

  // Centralized removal
  const removedToAdd = removeCardFromZone(
    from.target,
    roomId,
    id,
    from.targetIndex
  );

  let cardToAdd = removedToAdd;
  if (cardToAdd) {
    if (cardToAdd.type === CARD_TYPE.FORTIFIED && target.includes("Fortified") && from.target.includes("Hand")) {
      cardToAdd = { ...cardToAdd, faceUp: false };
    }
    if (
      target === CARD_TARGET.P1_PLAYER_DECK ||
      target === CARD_TARGET.P1_PLAYER_DISCARD ||
      target === CARD_TARGET.P1_PLAYER_REVEALED ||
      target === CARD_TARGET.P1_PLAYER_HAND ||
      target === CARD_TARGET.P2_PLAYER_DECK ||
      target === CARD_TARGET.P2_PLAYER_DISCARD ||
      target === CARD_TARGET.P2_PLAYER_REVEALED ||
      target === CARD_TARGET.P2_PLAYER_HAND
    ) {
      cardToAdd = { ...cardToAdd, faceUp: true };
    }
    // Centralized addition
    addCardToZone(
      target,
      roomId,
      cardToAdd,
      targetIndex,
      bottom
    );
  }
  if (shouldLog) {
    games[roomId].gameLog = addGameLog(
      games[roomId].gameLog,
      `${player.name} (${player.p1 ? "P1" : "P2"}) moved: ${cardToAdd?.name} from: ${from.target} to: ${target}${targetIndex != undefined ? " at index: " + targetIndex : ""}`
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
  const { cardTarget, cardIndex, zoneIndex } = action;
  if (zoneIndex != undefined) {
    if ((games[roomId][cardTarget][zoneIndex] as CardInterface[])[cardIndex].cooldown > 0) {
      (games[roomId][cardTarget][zoneIndex] as CardInterface[])[cardIndex].cooldown -= 1;
    }
  } else {
    if ((games[roomId][cardTarget][cardIndex] as CardInterface).cooldown > 0) {
      (games[roomId][cardTarget][cardIndex] as CardInterface).cooldown -= 1;
    }
  }
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