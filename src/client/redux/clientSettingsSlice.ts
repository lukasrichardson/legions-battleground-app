import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState: {
  hoverMenu: boolean;
  legacyMenu: boolean;
  transparentOnBlur: boolean;
  deckbuild_groupedView: boolean;
  openHand: boolean;
} = {
  hoverMenu: true,
  legacyMenu: true,
  transparentOnBlur: false,
  deckbuild_groupedView: false,
  openHand: false
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
    },
    setOpenHand: (state, action: PayloadAction<boolean>) => {
      state.openHand = action.payload;
    }
  }
});

export const { setHoverMenu, setLegacyMenu, setTransparentOnBlur, setDeckbuildGroupedView, setOpenHand } = clientSettingsSlice.actions;

export default clientSettingsSlice.reducer;