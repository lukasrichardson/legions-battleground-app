import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState: {
  hoverMenu: boolean;
  legacyMenu: boolean;
} = {
  hoverMenu: true,
  legacyMenu: true
}

const clientSettingsSlice = createSlice({
  name: 'clientSettings',
  initialState,
  reducers: {
    setHoverMenu: (state, action: PayloadAction<boolean>) => {
      state.hoverMenu = action.payload;
    },
    setLegacyMenu: (state, action: PayloadAction<boolean>) => {
      state.legacyMenu = action.payload;
    }
  }
});

export const { setHoverMenu, setLegacyMenu } = clientSettingsSlice.actions;

export default clientSettingsSlice.reducer;