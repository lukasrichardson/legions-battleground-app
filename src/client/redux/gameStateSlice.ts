import { createSlice } from "@reduxjs/toolkit";
import { initialGameState } from "@/shared/constants/initialGameState";

import {
  changeP1AP_reducer,
  changeP1Health_reducer,
  changeP2AP_reducer,
  changeP2Health_reducer,
  decreaseAttackModifier_reducer,
  decreaseCooldown_reducer,
  decreaseOtherModifier_reducer,
  flipCard_reducer,
  increaseAttackModifier_reducer,
  increaseCooldown_reducer,
  increaseOtherModifier_reducer,
  moveCard_reducer,
  setState_reducer } from "@/client/utils/gameState.utils";
import { selectCardHelper, multiSelectCardHelper } from "@/shared/utils";

const gameStateSlice = createSlice({
  name: "gameState",
  initialState: initialGameState,
  reducers: {
    setState: (state, action) => setState_reducer(state, action),
    resetState: () => initialGameState,

    //move card, change health and ap, select card, clear selected card, flip card, icnrease atk, inc/dec counter, ===doing it on client first and then syncing to server to reduce visual lag
    moveCard: (state, action) => moveCard_reducer(state, action),
    changeP2Health: (state, action) => changeP2Health_reducer(state, action),
    changeP1Health: (state, action) => changeP1Health_reducer(state, action),
    changeP2AP: (state, action) => changeP2AP_reducer(state, action),
    changeP1AP: (state, action) => changeP1AP_reducer(state, action),
    selectCard: (state, action) => {
      const {card, side} = action.payload;
      const p1 = side === "p1";
      if (p1) {
        state.p1SelectedCards = selectCardHelper(state.p1SelectedCards, card);
      } else {
        state.p2SelectedCards = selectCardHelper(state.p2SelectedCards, card);
      }
    },
    flipCard: (state, action) => flipCard_reducer(state, action),
    increaseAttackModifier: (state, action) => increaseAttackModifier_reducer(state, action),
    decreaseAttackModifier: (state, action) => decreaseAttackModifier_reducer(state, action),
    increaseOtherModifier: (state, action) => increaseOtherModifier_reducer(state, action),
    decreaseOtherModifier: (state, action) => decreaseOtherModifier_reducer(state, action),
    increaseCooldown: (state, action) => increaseCooldown_reducer(state, action),
    decreaseCooldown: (state, action) => decreaseCooldown_reducer(state, action),
    multiSelectCard: (state, action) => {
      const {card, side} = action.payload;
      const p1 = side === "p1";
      if (p1) {
        state.p1SelectedCards = multiSelectCardHelper(state.p1SelectedCards, card);
      } else {
        state.p2SelectedCards = multiSelectCardHelper(state.p2SelectedCards, card);
      }
    }
  }
})

export const {
  setState,
  resetState,
  // below are also done on server
  moveCard,
  changeP2Health,
  changeP1Health,
  changeP1AP,
  changeP2AP,
  selectCard,
  flipCard,
  increaseAttackModifier,
  decreaseAttackModifier,
  increaseOtherModifier,
  decreaseOtherModifier,
  increaseCooldown,
  decreaseCooldown,
  multiSelectCard

} = gameStateSlice.actions;

export default gameStateSlice.reducer;