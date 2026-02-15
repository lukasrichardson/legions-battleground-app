import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState: {
  hoverMenu: boolean;
  legacyMenu: boolean;
  transparentOnBlur: boolean;
  deckbuild_groupedView: boolean;
} = {
  hoverMenu: true,
  legacyMenu: true,
  transparentOnBlur: false,
  deckbuild_groupedView: false
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
    },
    setDeckbuildGroupedView: (state, action: PayloadAction<boolean>) => {
      state.deckbuild_groupedView = action.payload;
    }
  }
});

export const { setHoverMenu, setLegacyMenu, setTransparentOnBlur, setDeckbuildGroupedView } = clientSettingsSlice.actions;

export default clientSettingsSlice.reducer;