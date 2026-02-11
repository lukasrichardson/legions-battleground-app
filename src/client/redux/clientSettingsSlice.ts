import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState: {
  hoverMenu: boolean;
  legacyMenu: boolean;
  transparentOnBlur: boolean;
} = {
  hoverMenu: true,
  legacyMenu: true,
  transparentOnBlur: false
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
    },
    setTransparentOnBlur: (state, action: PayloadAction<boolean>) => {
      state.transparentOnBlur = action.payload;
    }
  }
});

export const { setHoverMenu, setLegacyMenu, setTransparentOnBlur } = clientSettingsSlice.actions;

export default clientSettingsSlice.reducer;