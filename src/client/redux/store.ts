import { configureStore } from '@reduxjs/toolkit';
import gameStateSlice from '@/client/redux/gameStateSlice';
import modalsSlice from '@/client/redux/modalsSlice';
import sequenceSlice from './sequenceSlice';
import phaseSlice from './phaseSlice';
import clientSettingsSlice from './clientSettingsSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      gameState: gameStateSlice,
      modalsState: modalsSlice,
      sequenceState: sequenceSlice,
      phaseState: phaseSlice,
      clientSettings: clientSettingsSlice
    }
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']