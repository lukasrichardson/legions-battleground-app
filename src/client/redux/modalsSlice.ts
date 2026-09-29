import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface ModalsState {
  createRoomModalOpen: boolean;
  joinRoomModalOpen: string;
  helpModalOpen: boolean;
  toolsSettingsModalOpen: boolean;
  plunderModalOpen: boolean;
  previewDeckModalOpen: boolean;
  importDeckModalOpen: boolean;
  concedeModalOpen: boolean;
  leaveGameModalOpen: boolean;
}

const initialState: ModalsState = {
  createRoomModalOpen: false,
  joinRoomModalOpen: null,
  helpModalOpen: false,
  toolsSettingsModalOpen: false,
  plunderModalOpen: false,
  previewDeckModalOpen: false,
  importDeckModalOpen: false,
  concedeModalOpen: false,
  leaveGameModalOpen: false,
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
    openHelpModal(state) {
      state.helpModalOpen = true;
    },
    closeHelpModal(state) {
      state.helpModalOpen = false;
    },
    openToolsSettingsModal(state) {
      state.toolsSettingsModalOpen = true;
    },
    closeToolsSettingsModal(state) {
      state.toolsSettingsModalOpen = false;
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
    },
    openConcedeModal(state) { state.concedeModalOpen = true; },
    closeConcedeModal(state) { state.concedeModalOpen = false; },
    openLeaveGameModal(state) { state.leaveGameModalOpen = true; },
    closeLeaveGameModal(state) { state.leaveGameModalOpen = false; }
  },
});

export const {
  setCreateRoomModalOpen,
  setJoinRoomModalOpen,
  openHelpModal,
  closeHelpModal,
  openToolsSettingsModal,
  closeToolsSettingsModal,
  openPlunderModal,
  closePlunderModal,
  openPreviewDeckModal,
  closePreviewDeckModal,
  openImportDeckModal,
  closeImportDeckModal,
  openConcedeModal,
  closeConcedeModal,
  openLeaveGameModal,
  closeLeaveGameModal
} = modalsSlice.actions;

export default modalsSlice.reducer;
