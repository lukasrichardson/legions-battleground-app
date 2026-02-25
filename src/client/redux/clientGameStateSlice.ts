import { createSlice } from "@reduxjs/toolkit";
import { CardState } from "@/shared/interfaces/CardState";
import { moveCard } from "./gameStateSlice";

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
      console.log("Setting pile in view with payload:", action.payload);
      state.pileInViewTarget = cardTarget;
      state.pileInViewLimit = limit || null;
      state.pileInViewIndex = targetIndex || null;
      if (!pile) return;
      if (targetIndex !== undefined && targetIndex !== null) {
        if (limit) {
          if (bottom) {
            state.topXCards = pile[targetIndex] ? pile[targetIndex].slice(-limit) as CardState[] : null;
          } else {
            state.topXCards = pile[targetIndex] ? pile[targetIndex].slice(0, limit) as CardState[] : null;
          }
        }
      } else {
        if (limit) {
          if (bottom) {
            state.topXCards = pile ? pile.slice(-limit) as CardState[] : null;
          } else {
            state.topXCards = pile ? pile.slice(0, limit) as CardState[] : null;
          }
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder.addMatcher(moveCard.match, (state, action) => {
      // remove card from topXCards if its move anywhere
      const { id }: { id: string } = action.payload;
      if (state.topXCards) {
        state.topXCards = state.topXCards.filter(card => card.id !== id);
      }
    })
  }
})

export const {
  setCardInFocus,
  clearCardInFocus,
  setTopXCards,
  setSide,
  clearPileInView,
  setPileInView
} = clientGameStateSlice.actions;
export default clientGameStateSlice.reducer;