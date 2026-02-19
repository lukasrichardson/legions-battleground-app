import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { CardState } from "@/shared/interfaces/CardState";
import { current } from "@reduxjs/toolkit";

export const setState_reducer = (state, action) => {
  if (current(state).game.gameLog.length !== action.payload.gameLog.length) {
    const newLogs = [];
    for (let i = 0; i < action.payload.gameLog.length - state.game.gameLog.length; i++) {
      newLogs.push(action.payload.gameLog[action.payload.gameLog.length - i - 1]);
    }
  }
  state.game = { ...action.payload }
}

export const moveCard_reducer = (state, action) => {
  const { id, from, target, targetIndex }: { id: string, from: CARD_TARGET, target: CARD_TARGET, targetIndex?: number } = action.payload;
  let { bottom = false }: { bottom?: boolean } = action.payload;

  if ([CARD_TARGET.P2_PLAYER_DECK, CARD_TARGET.P1_PLAYER_DECK].includes(target)) bottom = !bottom;
  let removedToAdd: CardState | null = null;
  //remove card from "from" array
  if ([CARD_TARGET.P2_PLAYER_FORTIFIED,
  CARD_TARGET.P2_PLAYER_UNIFIED,
  CARD_TARGET.P2_PLAYER_WARRIOR,
  CARD_TARGET.P1_PLAYER_FORTIFIED,
  CARD_TARGET.P1_PLAYER_UNIFIED,
  CARD_TARGET.P1_PLAYER_WARRIOR
  ].includes(from)) {
    const fromColumnIndex = state.game[from].findIndex(item => (item as CardState[]).find(item => item.id == id));
    const cardIndexToRemove = (state.game[from][fromColumnIndex] as CardState[]).findIndex(item => item?.id == id);
    const newStateFrom: CardState[] = [...state.game[from][fromColumnIndex as number] as CardState[]];
    removedToAdd = newStateFrom.splice(cardIndexToRemove, 1)[0];
    state.game[from][fromColumnIndex as number] = [...newStateFrom];
  } else {
    const index = state.game[from].findIndex(item => (item as CardState)?.id == id);
    if (index > -1) { // only splice array when item is found
      const newStateFrom: CardState[] = [...state.game[from]] as CardState[];
      removedToAdd = newStateFrom.splice(index, 1)[0]; // 2nd parameter means remove one item only
      state.game[from] = [...newStateFrom] as CardState[];
    }
  }
  if (removedToAdd) {
    if (removedToAdd.type === CARD_TYPE.FORTIFIED && target.includes("Fortified") && from.includes("Hand")) {
      removedToAdd = { ...removedToAdd, faceUp: false };
    }
    //add removed card to "target" array
    if (targetIndex != undefined) {// if targetIndex is not undefined, it means we are adding to fortified, unified, or warrior (array of arrays)
      // if top then push if bottom then unshift
      if (bottom) {
        // (state.game[target][targetIndex] as CardState[]).unshift(removedToAdd);
        (state.game[target][targetIndex] as CardState[]) = [removedToAdd, ...(state.game[target][targetIndex] as CardState[])];
      } else {
        // (state.game[target][targetIndex] as CardState[]).push(removedToAdd);
        (state.game[target][targetIndex] as CardState[]) = [...(state.game[target][targetIndex] as CardState[]), removedToAdd];
      }

    } else { //otherwise we are adding to a regular array
      if (bottom) {
        const newStateTarget: CardState[] = [removedToAdd, ...state.game[target]] as CardState[];
        state.game[target] = [...newStateTarget] as CardState[];
      } else {
        const newStateTarget: CardState[] = [...state.game[target], removedToAdd] as CardState[];
        state.game[target] = [...newStateTarget] as CardState[];
      }
    }

    if (state.topXCards) {
      state.topXCards = state.topXCards.filter(card => card.id !== removedToAdd.id);
    }
  }
  // state.game.gameLog = addGameLog(state.game.gameLog, `${playerName} ` + "moved: " + removedToAdd.name + " from: " + from + " to: " + target + (targetIndex != undefined ? " at index: " + targetIndex : ""));
}
export const changeP2Health_reducer = (state, action) => {
  state.game.p2PlayerHealth += action.payload;
}
export const changeP1Health_reducer = (state, action) => {
  state.game.p1PlayerHealth += action.payload;
}
export const changeP2AP_reducer = (state, action) => {
  state.game.p2PlayerAP += action.payload;
}

export const changeP1AP_reducer = (state, action) => {
  state.game.p1PlayerAP += action.payload;
}
export const selectCard_reducer = (state, action) => {
  state.game.selectedCard = action.payload;
}
export const clearSelectedCard_reducer = (state) => {
  state.game.selectedCard = null;
}
export const flipCard_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardState[])[cardIndex].faceUp = !(state.game[cardTarget][zoneIndex] as CardState[])[cardIndex].faceUp;
  } else {
    (state.game[cardTarget][cardIndex] as CardState).faceUp = !(state.game[cardTarget][cardIndex] as CardState).faceUp;
  }
}
export const increaseAttackModifier_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardState[])[cardIndex].attackModifier += 1;
  } else {
    (state.game[cardTarget][cardIndex] as CardState).attackModifier += 1;
  }
}
export const decreaseAttackModifier_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardState[])[cardIndex].attackModifier -= 1;
  } else {
    (state.game[cardTarget][cardIndex] as CardState).attackModifier -= 1;
  }
}

export const increaseOtherModifier_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardState[])[cardIndex].otherModifier += 1;
  } else {
    (state.game[cardTarget][cardIndex] as CardState).otherModifier += 1;
  }
}
export const decreaseOtherModifier_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardState[])[cardIndex].otherModifier -= 1;
  } else {
    (state.game[cardTarget][cardIndex] as CardState).otherModifier -= 1;
  }
}

export const increaseCooldown_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardState[])[cardIndex].cooldown += 1;
  } else {
    (state.game[cardTarget][cardIndex] as CardState).cooldown += 1;
  }
}

export const decreaseCooldown_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardState[])[cardIndex].cooldown -= 1;
  } else {
    (state.game[cardTarget][cardIndex] as CardState).cooldown -= 1;
  }
}