import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export enum PreGamePhase {
  RPS = "Rock Paper Scissors",
  P1Mulligan = "Player 1 Mulligan",
  P2Mulligan = "Player 2 Mulligan",
  PostMulliganDraw = "Post Mulligan Draw(s)",
  P1Guardian = "P1 Guardian Effect",
  P2Guardian = "P2 Guardian Effect",
  P1PreGame = "P1 Pre Game Effect(s)",
  P2PreGame = "P2 Pre Game Effect(s)",
}
export enum GamePhase {
  P1Countdown = "Player 1 Countdown",
  P1Reinforce = "Player 1 Reinforce",
  P1War = "Player 1 War",
  P1EndOfWar = "Player 1 EndOfWar",
  P1End = "Player 1 End",
  P1EndOfTurn = "Player 1 EndOfTurn",
  P2Countdown = "Player 2 Countdown",
  P2Reinforce = "Player 2 Reinforce",
  P2War = "Player 2 War",
  P2EndOfWar = "Player 2 EndOfWar",
  P2End = "Player 2 End",
  P2EndOfTurn = "Player 2 EndOfTurn",
}

export const NextPhaseP1Wins: Record<PreGamePhase | GamePhase, PreGamePhase | GamePhase> = {
  [PreGamePhase.RPS]: PreGamePhase.P1Mulligan,
  [PreGamePhase.P1Mulligan]: PreGamePhase.P2Mulligan,
  [PreGamePhase.P2Mulligan]: PreGamePhase.PostMulliganDraw,
  [PreGamePhase.PostMulliganDraw]: PreGamePhase.P1Guardian,
  [PreGamePhase.P1Guardian]: PreGamePhase.P2Guardian,
  [PreGamePhase.P2Guardian]: PreGamePhase.P1PreGame,
  [PreGamePhase.P1PreGame]: PreGamePhase.P2PreGame,
  [PreGamePhase.P2PreGame]: GamePhase.P1Countdown,

  [GamePhase.P1Countdown]: GamePhase.P1Reinforce,
  [GamePhase.P1Reinforce]: GamePhase.P1War,
  [GamePhase.P1War]: GamePhase.P1EndOfWar,
  [GamePhase.P1EndOfWar]: GamePhase.P1End,
  [GamePhase.P1End]: GamePhase.P1EndOfTurn,
  [GamePhase.P1EndOfTurn]: GamePhase.P2Countdown,

  [GamePhase.P2Countdown]: GamePhase.P2Reinforce,
  [GamePhase.P2Reinforce]: GamePhase.P2War,
  [GamePhase.P2War]: GamePhase.P2EndOfWar,
  [GamePhase.P2EndOfWar]: GamePhase.P2End,
  [GamePhase.P2End]: GamePhase.P2EndOfTurn,
  [GamePhase.P2EndOfTurn]: GamePhase.P1Countdown,
}
export const NextPhaseP2Wins: Record<PreGamePhase | GamePhase, PreGamePhase | GamePhase> = {
  [PreGamePhase.RPS]: PreGamePhase.P2Mulligan,
  [PreGamePhase.P2Mulligan]: PreGamePhase.P1Mulligan,
  [PreGamePhase.P1Mulligan]: PreGamePhase.PostMulliganDraw,
  [PreGamePhase.PostMulliganDraw]: PreGamePhase.P2Guardian,
  [PreGamePhase.P2Guardian]: PreGamePhase.P1Guardian,
  [PreGamePhase.P1Guardian]: PreGamePhase.P2PreGame,
  [PreGamePhase.P2PreGame]: PreGamePhase.P1PreGame,
  [PreGamePhase.P1PreGame]: GamePhase.P2Countdown,

  [GamePhase.P2Countdown]: GamePhase.P2Reinforce,
  [GamePhase.P2Reinforce]: GamePhase.P2War,
  [GamePhase.P2War]: GamePhase.P2EndOfWar,
  [GamePhase.P2EndOfWar]: GamePhase.P2End,
  [GamePhase.P2End]: GamePhase.P2EndOfTurn,
  [GamePhase.P2EndOfTurn]: GamePhase.P1Countdown,

  [GamePhase.P1Countdown]: GamePhase.P1Reinforce,
  [GamePhase.P1Reinforce]: GamePhase.P1War,
  [GamePhase.P1War]: GamePhase.P1EndOfWar,
  [GamePhase.P1EndOfWar]: GamePhase.P1End,
  [GamePhase.P1End]: GamePhase.P1EndOfTurn,
  [GamePhase.P1EndOfTurn]: GamePhase.P2Countdown,
}

interface PhaseState {
  currentPhase: PreGamePhase | GamePhase;
  turnNumber: number;
  rpsWinner: "p1" | "p2" | null;
  p1RPSChoice: string | null;
  p2RPSChoice: string | null;
}

const initialState: PhaseState = {
  currentPhase: PreGamePhase.RPS,
  turnNumber: 0,
  rpsWinner: null,
  p1RPSChoice: null,
  p2RPSChoice: null
}

const PhaseSlice = createSlice({
  name: 'phaseState',
  initialState,
  reducers: {
    // nextPhase: (state) => {
    //   const nextPhaseMap = state.rpsWinner === "p1" ? NextPhaseP1Wins : NextPhaseP2Wins;
    //   const nextPhase = nextPhaseMap[state.currentPhase];
    //   if (nextPhase) {
    //     state.currentPhase = nextPhase;
    //     if (nextPhase === GamePhase.P1Countdown || nextPhase === GamePhase.P2Countdown) {
    //       state.turnNumber++;
    //     }
    //   } else {
    //     console.warn("No next phase defined for current phase:", state.currentPhase);
    //   }
    // },
    // p1WinsRPS: (state) => {
    //   if (state.currentPhase === PreGamePhase.RPS) {
    //     state.rpsWinner = "p1";
    //     state.currentPhase = PreGamePhase.P1Mulligan;
    //   } else {
    //     console.warn("p1WinsRPS called in non-RPS phase");
    //   }
    // },
    // p2WinsRPS: (state) => {
    //   if (state.currentPhase === PreGamePhase.RPS) {
    //     state.rpsWinner = "p2";
    //     state.currentPhase = PreGamePhase.P2Mulligan;
    //   } else {
    //     console.warn("p1WinsRPS called in non-RPS phase");
    //   }
    // },
    // setRpsChoice: (state, action: PayloadAction<string>) => {
    //   if (state.currentPhase === PreGamePhase.RPS) {
    //     if (action.payload) {
    //       if (action.payload === "Rock") {
    //         PhaseSlice.caseReducers.p1WinsRPS(state);
    //       } else {
    //         state.rpsWinner = "p2";
    //         PhaseSlice.caseReducers.p2WinsRPS(state);
    //       }
    //     }

    //   } else {
    //     console.warn("setRpsChoice called in non-RPS phase");
    //   }
    // },
    setPhaseState: (state, action: PayloadAction<Partial<PhaseState>>) => {
      state.currentPhase = action.payload.currentPhase;
      state.turnNumber = action.payload.turnNumber;
      state.rpsWinner = action.payload.rpsWinner;

    }
  },
});

export const {
  // setRpsChoice, nextPhase, 
  setPhaseState
} = PhaseSlice.actions;

export default PhaseSlice.reducer;