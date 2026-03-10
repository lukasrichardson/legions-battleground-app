import { createSlice } from "@reduxjs/toolkit";
import { CardState } from "@/shared/interfaces/CardState";
import { moveCard } from "./gameStateSlice";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { GameEventLog } from "@/shared/interfaces/GameEventLog";
interface GameRoom {
    id: string;
    password: string;
    players: {[id: string]: {
      id: string;
      name: string;
      p1: boolean;
    }};
    sandboxMode: boolean;
  }

interface ClientGameState {
  cardInFocus: CardState | null;
  previousCardInFocus: CardState | null;
  pileInViewTarget: string | null;
  pileInViewIndex: number | null;
  pileInViewLimit: number | null;
  topXCards: CardState[] | null;
  side: "p1" | "p2";
  selectingZone: CARD_TYPE | null;
  cardForSelectingZone: {
    id: string;
    cardTarget: CARD_TARGET;
    type: CARD_TYPE;
    name: string;
    zoneIndex?: number;
  } | null;
  wisdoming: boolean;
  room?: GameRoom;
  gameHistory: GameEventLog[];
  undoneHistory: GameEventLog[];
}

const initialState: ClientGameState =
{
  cardInFocus: null,
  previousCardInFocus: null,
  pileInViewLimit: null,
  pileInViewTarget: null,
  pileInViewIndex: null,
  topXCards: [],
  side: "p1",
  selectingZone: null,
  cardForSelectingZone: null,
  wisdoming: false,
  gameHistory: [],
  undoneHistory: []
}

const clientGameStateSlice = createSlice({
  name: "clientGameState",
  initialState,
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
    },
    setSelectingZone: (state, action) => {
      state.selectingZone = action.payload;
    },
    setCardForSelectingZone: (state, action) => {
      state.cardForSelectingZone = action.payload;
    },
    setWisdoming: (state, action) => {
      state.wisdoming = action.payload;
    },
    setRoom: (state, action) => {
      state.room = action.payload;
    },
    setHistoryState: (state, action) => {
      state.gameHistory = action.payload.gameHistory;
      state.undoneHistory = action.payload.undoneHistory;
    }
  },
  extraReducers: (builder) => {
    builder.addMatcher(moveCard.match, (state, action) => {
      // remove card from topXCards if its moved anywhere
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
  setPileInView,
  setSelectingZone,
  setCardForSelectingZone,
  setWisdoming,
  setRoom,
  setHistoryState
} = clientGameStateSlice.actions;
export default clientGameStateSlice.reducer;