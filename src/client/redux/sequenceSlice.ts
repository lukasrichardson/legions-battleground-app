import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";


export interface MoveCardActionInterface { id: string, from: {target: CARD_TARGET, targetIndex: number | null}, target: CARD_TARGET, targetIndex?: number }


export enum Triggers {
  Conscript, Keyword, Unified, Fortified, Bloodbourne, AP
}

export enum StepType {
  ChooseCards,
  MoveCard,
  ChangeHealth,
  ChangeAP,
  DrawCard,
  SelectCard,
  Shuffle,
  None
}

export interface EffectStep {
  type: StepType,
  selectMin?: number | null, // Minimum number of cards to select
  selectMax?: number | null, // Maximum number of cards to select
  from?: {target: CARD_TARGET, targetIndex: number | null}[], // e.g. "P1_PLAYER_HAND", "P2_PLAYER_DECK", etc.
  to?: {target: CARD_TARGET, targetIndex: number | null}[], // e.g. "P1_PLAYER_DECK", "P2_PLAYER_HAND", etc.
  selected?: MoveCardActionInterface[], // Array of selected card IDs
  quantity?: string, // e.g. "selected", "all", etc.
  waitingForInput?: {p1: boolean, p2: boolean, controller: boolean}, // Indicates if the step is waiting for player input
}

export interface SequenceItem {
  name: string,
  cost: EffectStep[],
  effect: EffectStep[],
  type: string, // e.g. "moveCards", "changeHealth", etc.
}

export interface Sequence {
  items: SequenceItem[],
}

export interface SequenceState {
  sequences: Sequence[],
  resolving: boolean,
}

const initialState: SequenceState = {
  sequences: [],
  resolving: false,
}

const SequenceSlice = createSlice({
  name: 'sequenceState',
  initialState,
  reducers: {
  //   addSequenceItem: (state, action: PayloadAction<SequenceItem>) => {
  //     if (state.sequences.length === 0) {
  //       state.sequences.push({ items: [action.payload] });
  //     } else state.sequences[state.sequences.length - 1].items.push(action.payload);
  //   },
  //   resolveAllSequences: (state) => {
  //     if (state.sequences.length === 0) {
  //       console.log("No sequences to resolve");
  //       return;
  //     }
  //     state.resolving = true;
  //     state.resolvingSequenceIndex = state.sequences.length - 1;
  //     state.sequences = [];
  //     state.resolving = false;
  //     state.resolvingSequenceIndex = -1;
  //   },
  //   resolveLastItem: state => {
  //     if (state.sequences.length === 0) {
  //       console.log("No sequences to resolve");
  //       return;
  //     }
  //     if (state.resolvingSequenceIndex === -1) {
  //       const lastSequenceIndex = state.sequences.length - 1;
  //       state.resolvingSequenceIndex = lastSequenceIndex;
  //       const lastSequence = state.sequences[lastSequenceIndex];
  //       if (lastSequence.items.length > 0) {
  //         lastSequence.items.pop();
  //       }
  //       if (lastSequence.items.length === 0) {
  //         state.sequences.pop();
  //         state.resolvingSequenceIndex --;
  //       }
  //     } else {
  //       const currentSequence = state.sequences[state.resolvingSequenceIndex];
  //       if (currentSequence.items.length > 0) {
  //         currentSequence.items.pop();
  //       }
  //       if (currentSequence.items.length === 0) {
  //         state.sequences.pop();
  //         state.resolvingSequenceIndex --;
  //       }
  //     }
  //   }
  // },
  setState: (state, action: PayloadAction<SequenceState>) => {
      state.sequences = action.payload.sequences;
      state.resolving = action.payload.resolving;
    }
  }
});

export const {
  // addSequenceItem,
  // resolveAllSequences,
  // resolveLastItem,
  setState
} = SequenceSlice.actions;

export default SequenceSlice.reducer;