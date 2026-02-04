import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface ModalsState {
  createRoomModalOpen: boolean;
  joinRoomModalOpen: string;
  setDecksModalOpen: boolean;
  helpModalOpen: boolean;
  plunderModalOpen: boolean;
  previewDeckModalOpen: boolean;
  importDeckModalOpen: boolean;
}

const initialState: ModalsState = {
  createRoomModalOpen: false,
  joinRoomModalOpen: null,
  setDecksModalOpen: false,
  helpModalOpen: false,
  plunderModalOpen: false,
  previewDeckModalOpen: false,
  importDeckModalOpen: false
}

const modalsSlice = createSlice({
  name: 'modals',
  initialState,
  reducers: {
    setCreateRoomModalOpen: (state, action: PayloadAction<boolean>) => {
      state.createRoomModalOpen = action.payload;
    },
    setJoinRoomModalOpen: (state, action: PayloadAction<string|null>) => {
      state.joinRoomModalOpen = action.payload;
    },
    closeSetDecksModal(state) {
      state.setDecksModalOpen = false;
    },
    openSetDecksModal(state) {
      state.setDecksModalOpen = true;
    },
    openHelpModal(state) {
      state.helpModalOpen = true;
    },
    closeHelpModal(state) {
      state.helpModalOpen = false;
    },
    openPlunderModal(state) {
      state.plunderModalOpen = true;
    },
    closePlunderModal(state) {
      state.plunderModalOpen = false;
    },
    openPreviewDeckModal(state) {
      state.previewDeckModalOpen = true;
    },
    closePreviewDeckModal(state) {
      state.previewDeckModalOpen = false;
    },
    openImportDeckModal(state) {
      state.importDeckModalOpen = true;
    },
    closeImportDeckModal(state) {
      state.importDeckModalOpen = false;
    }
  },
});

export const {
  setCreateRoomModalOpen,
  setJoinRoomModalOpen,
  closeSetDecksModal,
  openSetDecksModal,
  openHelpModal,
  closeHelpModal,
  openPlunderModal,
  closePlunderModal,
  openPreviewDeckModal,
  closePreviewDeckModal,
  openImportDeckModal,
  closeImportDeckModal
} = modalsSlice.actions;

export default modalsSlice.reducer;