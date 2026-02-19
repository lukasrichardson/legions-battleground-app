import { createSlice } from "@reduxjs/toolkit";
import { CardInterface } from "@/shared/interfaces/CardInterface";

const clientGameStateSlice = createSlice({
  name: "clientGameState",
  initialState: {
    cardInFocus: null,
    previousCardInFocus: null,
    pileInViewLimit: null,
    pileInViewTarget: null,
    pileInViewIndex: null,
    topXCards: [],
    side: "p1",
  },
  reducers: {
    setCardInFocus: (state, action) => {
      state.cardInFocus = action.payload;
      state.previousCardInFocus = action.payload;
    },
    clearCardInFocus: (state) => {
      state.cardInFocus = null;
    },
    setPileInViewLimit: (state, action) => {
      state.pileInViewLimit = action.payload;
    },
    setTopXCards: (state, action) => {
      state.topXCards = action.payload;
    },
    setSide: (state, action) => {
      state.side = action.payload;
    },
    clearPileInView: (state) => {
      state.pileInViewTarget = null;
      state.pileInViewIndex = null;
      state.pileInViewLimit = null;
      state.topXCards = null;
    },
    setPileInView: (state, action) => {
      const { cardTarget, targetIndex, limit, bottom, pile } = action.payload;
      state.pileInViewTarget = cardTarget;
      state.pileInViewLimit = limit || null;
      if (targetIndex != undefined) {
        state.pileInViewIndex = targetIndex;
        if (limit) {
          if (bottom) {
            state.topXCards = pile ? pile.slice(-limit) as CardInterface[] : null;
          } else {
            state.topXCards = pile ? pile.slice(0, limit) as CardInterface[] : null;
          }
        }
      } else {
        if (limit) {
          if (bottom) {
            state.topXCards = pile ? pile.slice(-limit) as CardInterface[] : null;
          } else {
            state.topXCards = pile ? pile.slice(0, limit) as CardInterface[] : null;
          }
        }
      }
    }
  }
})

export const {
  setCardInFocus,
  clearCardInFocus,
  setPileInViewLimit,
  setTopXCards,
  setSide,
  clearPileInView,
  setPileInView
} = clientGameStateSlice.actions;
export default clientGameStateSlice.reducer;