import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState: {
  hoverMenu: boolean;
} = {
  hoverMenu: true
}

const clientSettingsSlice = createSlice({
  name: 'clientSettings',
  initialState,
  reducers: {
    setHoverMenu: (state, action: PayloadAction<boolean>) => {
      state.hoverMenu = action.payload;
    }
  }
});

export const { setHoverMenu } = clientSettingsSlice.actions;

export default clientSettingsSlice.reducer;