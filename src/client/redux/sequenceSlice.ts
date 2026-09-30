import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { SequenceState } from "@/shared/interfaces/GameCommands";
export type { EffectStep, MoveCardAction as MoveCardActionInterface, Sequence, SequenceItem, SequenceState } from "@/shared/interfaces/GameCommands";
export { StepType, Triggers } from "@/shared/interfaces/GameCommands";

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
