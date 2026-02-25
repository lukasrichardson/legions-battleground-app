import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { CardState } from "@/shared/interfaces/CardState";

export const setState_reducer = (_, action) => {
  return { ...action.payload };
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
    const fromColumnIndex = state[from].findIndex(item => (item as CardState[]).find(item => item.id == id));
    const cardIndexToRemove = (state[from][fromColumnIndex] as CardState[]).findIndex(item => item?.id == id);
    const newStateFrom: CardState[] = [...state[from][fromColumnIndex as number] as CardState[]];
    removedToAdd = newStateFrom.splice(cardIndexToRemove, 1)[0];
    state[from][fromColumnIndex as number] = [...newStateFrom];
  } else {
    const index = state[from].findIndex(item => (item as CardState)?.id == id);
    if (index > -1) { // only splice array when item is found
      const newStateFrom: CardState[] = [...state[from]] as CardState[];
      removedToAdd = newStateFrom.splice(index, 1)[0]; // 2nd parameter means remove one item only
      state[from] = [...newStateFrom] as CardState[];
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
        // (state[target][targetIndex] as CardState[]).unshift(removedToAdd);
        (state[target][targetIndex] as CardState[]) = [removedToAdd, ...(state[target][targetIndex] as CardState[])];
      } else {
        // (state[target][targetIndex] as CardState[]).push(removedToAdd);
        (state[target][targetIndex] as CardState[]) = [...(state[target][targetIndex] as CardState[]), removedToAdd];
      }

    } else { //otherwise we are adding to a regular array
      if (bottom) {
        const newStateTarget: CardState[] = [removedToAdd, ...state[target]] as CardState[];
        state[target] = [...newStateTarget] as CardState[];
      } else {
        const newStateTarget: CardState[] = [...state[target], removedToAdd] as CardState[];
        state[target] = [...newStateTarget] as CardState[];
      }
    }
  }
}

export const changeP2Health_reducer = (state, action) => {
  state.p2PlayerHealth += action.payload;
}

export const changeP1Health_reducer = (state, action) => {
  state.p1PlayerHealth += action.payload;
}

export const changeP2AP_reducer = (state, action) => {
  state.p2PlayerAP += action.payload;
}

export const changeP1AP_reducer = (state, action) => {
  state.p1PlayerAP += action.payload;
}

export const flipCard_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state[cardTarget][zoneIndex] as CardState[])[cardIndex].faceUp = !(state[cardTarget][zoneIndex] as CardState[])[cardIndex].faceUp;
  } else {
    (state[cardTarget][cardIndex] as CardState).faceUp = !(state[cardTarget][cardIndex] as CardState).faceUp;
  }
}

export const increaseAttackModifier_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state[cardTarget][zoneIndex] as CardState[])[cardIndex].attackModifier += 1;
  } else {
    (state[cardTarget][cardIndex] as CardState).attackModifier += 1;
  }
}

export const decreaseAttackModifier_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state[cardTarget][zoneIndex] as CardState[])[cardIndex].attackModifier -= 1;
  } else {
    (state[cardTarget][cardIndex] as CardState).attackModifier -= 1;
  }
}

export const increaseOtherModifier_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state[cardTarget][zoneIndex] as CardState[])[cardIndex].otherModifier += 1;
  } else {
    (state[cardTarget][cardIndex] as CardState).otherModifier += 1;
  }
}

export const decreaseOtherModifier_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state[cardTarget][zoneIndex] as CardState[])[cardIndex].otherModifier -= 1;
  } else {
    (state[cardTarget][cardIndex] as CardState).otherModifier -= 1;
  }
}

export const increaseCooldown_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state[cardTarget][zoneIndex] as CardState[])[cardIndex].cooldown += 1;
  } else {
    (state[cardTarget][cardIndex] as CardState).cooldown += 1;
  }
}

export const decreaseCooldown_reducer = (state, action) => {
  const { cardTarget, cardIndex, zoneIndex }: { cardTarget: CARD_TARGET, cardIndex: number, zoneIndex: number } = action.payload;
  if (zoneIndex != undefined) {
    (state[cardTarget][zoneIndex] as CardState[])[cardIndex].cooldown -= 1;
  } else {
    (state[cardTarget][cardIndex] as CardState).cooldown -= 1;
  }
}