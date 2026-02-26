import Modal from "./Modal";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { openSetDecksModal } from "@/client/redux/modalsSlice";
import useClientSettings from "@/client/hooks/useClientSettings";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import AppIcon, { AppIconName } from "../AppIcon";
import { Tooltip } from "antd";

const ModalConstants = {
  ModalHeaderText: "Tools & Settings",
  ToolsSectionText: "Tools",
  SettingsSectionText: "Settings",
  CloseButtonText: "Close",
  ChangeDeckButtonText: "Change Deck(s)",
  EditDeckButtonText: "Edit Deck",
  ResetGameButtonText: "Reset Game",
  HoverMenuText: "Show Menu On Hover",
  LegacyMenuText: "Use Legacy Menu",
  TransparentCardModalsText: "Transparent Card Modals",
  OpenHandText: "Open Hand",
};

const renderToolButton = (text: string, icon: AppIconName, onClick: () => void, className = "") => (
  <button
    type="button"
    className={`w-full text-[12px] font-bold px-2 py-1.5 cursor-pointer text-white rounded-lg border border-white/10 transition-all duration-150 ${className}`}
    onClick={onClick}
  >
    <Tooltip title={text} placement="top" mouseEnterDelay={0.2}>
      <span className="flex items-center justify-center gap-1.5">
        <AppIcon name={icon} size={14} />
        <span>{text}</span>
      </span>
    </Tooltip>
  </button>
);

export default function ToolsSettingsModal({ closeModal }: { closeModal: () => void }) {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.gameState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const { toolsSettingsModalOpen } = useAppSelector((state) => state.modalsState);
  const { p2DeckFromServer, p1DeckFromServer } = gameState;
  const { side } = clientGameState;
  const p1 = side === "p1";
  const {
    hoverMenu,
    setHoverMenu,
    legacyMenu,
    setLegacyMenu,
    transparentOnBlur,
    setTransparentOnBlur,
    openHand,
    setOpenHand
  } = useClientSettings();

  const {
    ModalHeaderText,
    ToolsSectionText,
    SettingsSectionText,
    CloseButtonText,
    ChangeDeckButtonText,
    EditDeckButtonText,
    ResetGameButtonText,
    HoverMenuText,
    LegacyMenuText,
    TransparentCardModalsText,
    OpenHandText
  } = ModalConstants;

  const handleEditDeck = () => {
    window.open(`/decks/${p1 ? p1DeckFromServer?._id : p2DeckFromServer?._id}`, "_blank");
  };

  if (!toolsSettingsModalOpen) return null;

  return (
    <Modal
      open={toolsSettingsModalOpen}
      closeModal={closeModal}
      modalHeader={<span>{ModalHeaderText}</span>}
      modalContent={
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">{ToolsSectionText}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {renderToolButton(ChangeDeckButtonText, "change-decks", () => dispatch(openSetDecksModal()), "bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-500 hover:to-cyan-600")}
              {renderToolButton(EditDeckButtonText, "edit-deck", handleEditDeck, "bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600")}
              {renderToolButton(ResetGameButtonText, "reset-game", () => emitGameEvent({ type: GAME_EVENT.resetGame, data: { p2DeckId: p2DeckFromServer?.id, p1DeckId: p1DeckFromServer?.id } }), "bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600")}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">{SettingsSectionText}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs">
                <span>{HoverMenuText}</span>
                <input name="hoverMenu" type="checkbox" checked={hoverMenu} onChange={() => setHoverMenu(!hoverMenu)} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs">
                <span>{LegacyMenuText}</span>
                <input name="legacyMenu" type="checkbox" checked={legacyMenu} onChange={() => setLegacyMenu(!legacyMenu)} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs">
                <span>{TransparentCardModalsText}</span>
                <input name="transparentOnBlur" type="checkbox" checked={transparentOnBlur} onChange={() => setTransparentOnBlur(!transparentOnBlur)} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs">
                <span>{OpenHandText}</span>
                <input name="openHand" type="checkbox" checked={openHand} onChange={() => setOpenHand(!openHand)} />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-[12px] font-bold px-3 py-1.5 cursor-pointer bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-white/10 transition-colors"
              onClick={closeModal}
            >
              {CloseButtonText}
            </button>
          </div>
        </div>
      }
    />
  );
}
