import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { IOServer } from "../../interfaces/SocketTypes";
import { MoveCardActionInterface } from "../../events/cardEvents";
import { games } from "../../game/game";
import { CardState } from "../../../shared/interfaces/CardState";
import { addGameLog } from "../../utils/generateGameLog";
import { drawCardP1, drawCardP2, STARTING_HAND_SIZE } from "../../utils/game.util";
import { goNextPhase } from "../../events/playerEvents";
import { GameStateData } from "@/shared/interfaces/GameState";
import { multiSelectCardHelper, selectCardHelper } from "@/shared/utils";
import {
  changeCardModifierInState,
  flipCardInState,
  moveCardInState,
  shuffleZoneInState,
} from "@/shared/gameStateMutations";

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
    const cardToAdd = moveCardInState(games[roomId], action);
    if (shouldLog) {
      games[roomId].gameLog = addGameLog(
        games[roomId].gameLog,
        `${player.name} (${player.p1 ? "P1" : "P2"}) moved: ${cardToAdd?.faceUp ? cardToAdd.name : " a face-down card"} from: ${action.from.target} to: ${action.target}${action.targetIndex != undefined ? " at index: " + action.targetIndex : ""}`
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
    const { cardTarget, zoneIndex } = action;
    flipCardInState(games[roomId], action);
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "flipped card in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  increaseCardAttackModifier(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, zoneIndex } = action;
    changeCardModifierInState(games[roomId], action, "attackModifier", 1);
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "increased card attack modifier in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  decreaseCardAttackModifier(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, zoneIndex } = action;
    changeCardModifierInState(games[roomId], action, "attackModifier", -1);
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "decreased card attack modifier in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  increaseCardOtherModifier(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, zoneIndex } = action;
    changeCardModifierInState(games[roomId], action, "otherModifier", 1);
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "increased card other modifier in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  decreaseCardOtherModifier(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, zoneIndex } = action;
    changeCardModifierInState(games[roomId], action, "otherModifier", -1);
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "decreased card other modifier in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  increaseCardCooldown(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, zoneIndex } = action;
    changeCardModifierInState(games[roomId], action, "cooldown", 1);
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "increased card cooldown in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  decreaseCardCooldown(roomId: string, action: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex?: number }): GameStateData {
    const { cardTarget, zoneIndex } = action;
    changeCardModifierInState(games[roomId], action, "cooldown", -1);
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "decreased card cooldown in " + cardTarget + (zoneIndex != undefined ? " at index " + zoneIndex : ""));
    return games[roomId];
  }

  shuffleTargetPile(roomId: string, action: { cardTarget: CARD_TARGET, targetIndex?: number }): GameStateData {
    shuffleZoneInState(games[roomId], action);
    games[roomId].gameLog = addGameLog(games[roomId].gameLog, "shuffled " + action.cardTarget + (action.targetIndex != undefined ? " at index " + action.targetIndex : ""));
    return games[roomId];
  }

  mulligan(roomId: string, action: object, player: { name: string; p1: boolean }, io: IOServer, advancePhase = true): GameStateData {
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
    if (advancePhase) goNextPhase(roomId, {}, {}, io);
    return games[roomId];
  }

}
