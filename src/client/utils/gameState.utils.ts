import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { CardInterface } from "@/client/interfaces/CardInterface";
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

export const focusCard_reducer = (state, action) => {
  state.previousCardInFocus = action.payload;
  state.cardInFocus = action.payload;
}

export const clearCardInFocus_reducer = (state) => {
  state.cardInFocus = null;
}

export const setPileInView_reducer = (state, action) => {
  state.pileInViewTarget = action.payload.cardTarget;
  state.pileInViewLimit = action.payload.limit || null;
  if (action.payload.targetIndex != undefined) {
    state.pileInViewIndex = action.payload.targetIndex;
    if (action.payload.limit) {
      if (action.payload.bottom) {
        const pile = state.game[action.payload.cardTarget][action.payload.targetIndex] as CardInterface[] | undefined;
        state.topXCards = pile ? pile.slice(-action.payload.limit) as CardInterface[] : null;
      } else {
        state.topXCards = state.game[action.payload.cardTarget][action.payload.targetIndex].slice(0, action.payload.limit) as CardInterface[];
      }
    }
  } else {
    if (action.payload.limit) {
      if (action.payload.bottom) {
        const pile = state.game[action.payload.cardTarget] as CardInterface[] | undefined;
        state.topXCards = pile ? pile.slice(-action.payload.limit) as CardInterface[] : null;
      } else {
        state.topXCards = state.game[action.payload.cardTarget].slice(0, action.payload.limit) as CardInterface[];
      }
    }
  }
}

export const clearPileInView_reducer = (state) => {
  state.pileInViewTarget = null;
  state.pileInViewIndex = null;
  state.pileInViewLimit = null;
  state.topXCards = null;
}

export const switchSide_reducer = (state) => {
  state.side = state.side === "p2" ? "p1" : "p2";
}

export const setSide_reducer = (state, action) => {
  state.side = action.payload;
}

export const moveCard_reducer = (state, action) => {
  const { id, from, target, targetIndex }: { id: string, from: CARD_TARGET, target: CARD_TARGET, targetIndex?: number } = action.payload;
  let { bottom = false }: { bottom?: boolean } = action.payload;

  if ([CARD_TARGET.P2_PLAYER_DECK, CARD_TARGET.P1_PLAYER_DECK].includes(target)) bottom = !bottom;
  let removedToAdd: CardInterface | null = null;
  //remove card from "from" array
  if ([CARD_TARGET.P2_PLAYER_FORTIFIED,
  CARD_TARGET.P2_PLAYER_UNIFIED,
  CARD_TARGET.P2_PLAYER_WARRIOR,
  CARD_TARGET.P1_PLAYER_FORTIFIED,
  CARD_TARGET.P1_PLAYER_UNIFIED,
  CARD_TARGET.P1_PLAYER_WARRIOR
  ].includes(from)) {
    const fromColumnIndex = state.game[from].findIndex(item => (item as CardInterface[]).find(item => item.id == id));
    const cardIndexToRemove = (state.game[from][fromColumnIndex] as CardInterface[]).findIndex(item => item?.id == id);
    const newStateFrom: CardInterface[] = [...state.game[from][fromColumnIndex as number] as CardInterface[]];
    removedToAdd = newStateFrom.splice(cardIndexToRemove, 1)[0];
    state.game[from][fromColumnIndex as number] = [...newStateFrom];
  } else {
    const index = state.game[from].findIndex(item => (item as CardInterface)?.id == id);
    if (index > -1) { // only splice array when item is found
      const newStateFrom: CardInterface[] = [...state.game[from]] as CardInterface[];
      removedToAdd = newStateFrom.splice(index, 1)[0]; // 2nd parameter means remove one item only
      state.game[from] = [...newStateFrom] as CardInterface[];
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
        // (state.game[target][targetIndex] as CardInterface[]).unshift(removedToAdd);
        (state.game[target][targetIndex] as CardInterface[]) = [removedToAdd, ...(state.game[target][targetIndex] as CardInterface[])];
      } else {
        // (state.game[target][targetIndex] as CardInterface[]).push(removedToAdd);
        (state.game[target][targetIndex] as CardInterface[]) = [...(state.game[target][targetIndex] as CardInterface[]), removedToAdd];
      }

    } else { //otherwise we are adding to a regular array
      if (bottom) {
        const newStateTarget: CardInterface[] = [removedToAdd, ...state.game[target]] as CardInterface[];
        state.game[target] = [...newStateTarget] as CardInterface[];
      } else {
        const newStateTarget: CardInterface[] = [...state.game[target], removedToAdd] as CardInterface[];
        state.game[target] = [...newStateTarget] as CardInterface[];
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
    (state.game[cardTarget][zoneIndex] as CardInterface[])[cardIndex].faceUp = !(state.game[cardTarget][zoneIndex] as CardInterface[])[cardIndex].faceUp;
  } else {
    (state.game[cardTarget][cardIndex] as CardInterface).faceUp = !(state.game[cardTarget][cardIndex] as CardInterface).faceUp;
  }
}
export const increaseAttackModifier_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardInterface[])[cardIndex].attackModifier += 1;
  } else {
    (state.game[cardTarget][cardIndex] as CardInterface).attackModifier += 1;
  }
}
export const decreaseAttackModifier_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardInterface[])[cardIndex].attackModifier -= 1;
  } else {
    (state.game[cardTarget][cardIndex] as CardInterface).attackModifier -= 1;
  }
}

export const increaseOtherModifier_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardInterface[])[cardIndex].otherModifier += 1;
  } else {
    (state.game[cardTarget][cardIndex] as CardInterface).otherModifier += 1;
  }
}
export const decreaseOtherModifier_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardInterface[])[cardIndex].otherModifier -= 1;
  } else {
    (state.game[cardTarget][cardIndex] as CardInterface).otherModifier -= 1;
  }
}

export const increaseCooldown_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardInterface[])[cardIndex].cooldown += 1;
  } else {
    (state.game[cardTarget][cardIndex] as CardInterface).cooldown += 1;
  }
}

export const decreaseCooldown_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state.game[cardTarget][zoneIndex] as CardInterface[])[cardIndex].cooldown -= 1;
  } else {
    (state.game[cardTarget][cardIndex] as CardInterface).cooldown -= 1;
  }
}