import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { IOServer } from "../interfaces/SocketTypes";
import { MoveCardActionInterface } from "../events/cardEvents";
import { games } from "../game/game";
import { CardState } from "../../shared/interfaces/CardState";
import { removeCardFromZone, addCardToZone } from "../utils/cardZone.util";
import { addGameLog } from "../utils/generateGameLog";
import { shuffle } from "../utils/shuffleDeck.util";
import { drawCardP1, drawCardP2, STARTING_HAND_SIZE } from "../utils/game.util";
import { renderNumberthSuffix } from "../utils/string.utils";
import { goNextPhase } from "../events/playerEvents";
import { GameStateData } from "@/shared/interfaces/GameState";
import { multiSelectCardHelper, selectCardHelper } from "@/shared/utils";

export class CardService {

  async moveCard(
    roomId: string,
    action: MoveCardActionInterface,
    player: {
      name: string,
      p1: boolean
    },
    io: IOServer,
    shouldLog: boolean = true
  ): Promise<GameStateData> {
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
    return games[roomId];
  }

  selectCard(roomId: string, action: { card: CardState; side: "p1" | "p2" }): GameStateData {
    const { card, side } = action;
    const p1 = side === "p1";
    if (p1) {
      games[roomId].p1SelectedCards = selectCardHelper(games[roomId].p1SelectedCards, card);
    } else {
      games[roomId].p2SelectedCards = selectCardHelper(games[roomId].p2SelectedCards, card);
    }

    return games[roomId];
  }

  multiSelectCard(roomId: string, action: { card: CardState; side: "p1" | "p2" }): GameStateData {
    const { card, side } = action;
    const p1 = side === "p1";
    if (p1) {
      games[roomId].p1SelectedCards = multiSelectCardHelper(games[roomId].p1SelectedCards, card);
    } else {
      games[roomId].p2SelectedCards = multiSelectCardHelper(games[roomId].p2SelectedCards, card);
    }
    return games[roomId];
  }

  flipCard(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, cardIndex, zoneIndex } = action;
    if (zoneIndex != undefined) {
      (games[roomId][cardTarget][zoneIndex] as CardState[])[cardIndex].faceUp = !(games[roomId][cardTarget][zoneIndex] as CardState[])[cardIndex].faceUp;
    } else {
      (games[roomId][cardTarget][cardIndex] as CardState).faceUp = !(games[roomId][cardTarget][cardIndex] as CardState).faceUp;
    }
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "flipped card in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  increaseCardAttackModifier(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, cardIndex, zoneIndex } = action;
    if (zoneIndex != undefined) {
      (games[roomId][cardTarget][zoneIndex] as CardState[])[cardIndex].attackModifier += 1;
    } else {
      (games[roomId][cardTarget][cardIndex] as CardState).attackModifier += 1;
    }
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "increased card attack modifier in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  decreaseCardAttackModifier(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, cardIndex, zoneIndex } = action;
    if (zoneIndex != undefined) {
      (games[roomId][cardTarget][zoneIndex] as CardState[])[cardIndex].attackModifier -= 1;
    } else {
      (games[roomId][cardTarget][cardIndex] as CardState).attackModifier -= 1;
    }
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "decreased card attack modifier in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  increaseCardOtherModifier(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, cardIndex, zoneIndex } = action;
    if (zoneIndex != undefined) {
      (games[roomId][cardTarget][zoneIndex] as CardState[])[cardIndex].otherModifier += 1;
    } else {
      (games[roomId][cardTarget][cardIndex] as CardState).otherModifier += 1;
    }
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "increased card other modifier in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  decreaseCardOtherModifier(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, cardIndex, zoneIndex } = action;
    if (zoneIndex != undefined) {
      (games[roomId][cardTarget][zoneIndex] as CardState[])[cardIndex].otherModifier -= 1;
    } else {
      (games[roomId][cardTarget][cardIndex] as CardState).otherModifier -= 1;
    }
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "decreased card other modifier in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  increaseCardCooldown(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, cardIndex, zoneIndex } = action;
    if (zoneIndex != undefined) {
      (games[roomId][cardTarget][zoneIndex] as CardState[])[cardIndex].cooldown += 1;
    } else {
      (games[roomId][cardTarget][cardIndex] as CardState).cooldown += 1;
    }
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "increased card cooldown in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  decreaseCardCooldown(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, cardIndex, zoneIndex } = action;
    if (zoneIndex != undefined) {
      if ((games[roomId][cardTarget][zoneIndex] as CardState[])[cardIndex].cooldown > 0) {
        (games[roomId][cardTarget][zoneIndex] as CardState[])[cardIndex].cooldown -= 1;
      }
    } else {
      if ((games[roomId][cardTarget][cardIndex] as CardState).cooldown > 0) {
        (games[roomId][cardTarget][cardIndex] as CardState).cooldown -= 1;
      }
    }
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "decreased card cooldown in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  shuffleTargetPile(roomId: string, action: { cardTarget: CARD_TARGET, targetIndex?: number }): GameStateData {
    switch (action.cardTarget) {
      case CARD_TARGET.P2_PLAYER_WARRIOR:
      case CARD_TARGET.P2_PLAYER_UNIFIED:
      case CARD_TARGET.P2_PLAYER_FORTIFIED:
      case CARD_TARGET.P1_PLAYER_WARRIOR:
      case CARD_TARGET.P1_PLAYER_UNIFIED:
      case CARD_TARGET.P1_PLAYER_FORTIFIED:
        if (action.targetIndex != undefined) {
          const shuffled = shuffle([...games[roomId][action.cardTarget][action.targetIndex]]);
          games[roomId][action.cardTarget][action.targetIndex] = shuffled;
        }
        break;
      default:
        const shuffled = shuffle(games[roomId][action.cardTarget] as CardState[]);
        games[roomId][action.cardTarget] = shuffled;
        break;
    }
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "shuffled " + action.cardTarget + (action.targetIndex != undefined ? " at index " + action.targetIndex : ""));
    return games[roomId];
  }

  plunder(roomId: string, action: { number: number }, player: { name: string, p1: boolean }): GameStateData {
    if (player.p1) {
      drawCardP1(roomId, player, action.number - 1);
    } else {
      drawCardP2(roomId, player, action.number - 1);
    }
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, `${player.name} (${player.p1 ? "P1" : "P2"}) ` + "plundered: " + action.number + renderNumberthSuffix(action.number) + " card from their deck. ");
    return games[roomId];
  }

  mulligan(roomId: string, action: object, player: { name: string; p1: boolean }, io: IOServer): GameStateData {
    if (!games[roomId]) return;
    if (player.p1) {
      games[roomId].p1Mulligan = true;
      [...games[roomId].p1PlayerHand].forEach(cardToMove => {
        this.moveCard(roomId, {
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
        this.moveCard(roomId, {
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
    return games[roomId];
  }

}