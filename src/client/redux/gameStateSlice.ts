import { createSlice } from "@reduxjs/toolkit";
import { initialGameState } from "@/shared/constants/initialGameState";

import {
  changeP1AP_reducer,
  changeP1Health_reducer,
  changeP2AP_reducer,
  changeP2Health_reducer,
  clearSelectedCard_reducer,
  decreaseAttackModifier_reducer,
  decreaseCooldown_reducer,
  decreaseOtherModifier_reducer,
  flipCard_reducer,
  increaseAttackModifier_reducer,
  increaseCooldown_reducer,
  increaseOtherModifier_reducer,
  moveCard_reducer,
  selectCard_reducer,
  setState_reducer } from "@/client/utils/gameState.utils";

const gameStateSlice = createSlice({
  name: "gameState",
  initialState: initialGameState,
  reducers: {
    setState: (state, action) => setState_reducer(state, action),
    resetState: () => initialGameState,

    //move card, change health and ap, select card, clear selected card, flip card, icnrease atk, inc/dec counter, ===doing it on client first and then sycing to server to reduce lag
    moveCard: (state, action) => moveCard_reducer(state, action),
    changeP2Health: (state, action) => changeP2Health_reducer(state, action),
    changeP1Health: (state, action) => changeP1Health_reducer(state, action),
    changeP2AP: (state, action) => changeP2AP_reducer(state, action),
    changeP1AP: (state, action) => changeP1AP_reducer(state, action),
    selectCard: (state, action) => selectCard_reducer(state, action),
    clearSelectedCard: (state) => clearSelectedCard_reducer(state),
    flipCard: (state, action) => flipCard_reducer(state, action),
    increaseAttackModifier: (state, action) => increaseAttackModifier_reducer(state, action),
    decreaseAttackModifier: (state, action) => decreaseAttackModifier_reducer(state, action),
    increaseOtherModifier: (state, action) => increaseOtherModifier_reducer(state, action),
    decreaseOtherModifier: (state, action) => decreaseOtherModifier_reducer(state, action),
    increaseCooldown: (state, action) => increaseCooldown_reducer(state, action),
    decreaseCooldown: (state, action) => decreaseCooldown_reducer(state, action),
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
  clearSelectedCard,
  flipCard,
  increaseAttackModifier,
  decreaseAttackModifier,
  increaseOtherModifier,
  decreaseOtherModifier,
  increaseCooldown,
  decreaseCooldown,

} = gameStateSlice.actions;

export default gameStateSlice.reducer;