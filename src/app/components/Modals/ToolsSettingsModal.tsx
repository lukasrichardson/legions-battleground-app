import Modal from "./Modal";
import { useAppSelector } from "@/client/redux/hooks";
import useClientSettings from "@/client/hooks/useClientSettings";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import AppIcon, { AppIconName } from "../AppIcon";
import { Tooltip } from "antd";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/client/ui/select";
import { fetchDecks } from "@/client/utils/api.utils";
import { Button } from "@/client/ui/button";

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
  p2DeckLabel: "Player 2 Deck",
  p1DeckLabel: "Player 1 Deck",
  SubmitBtnText: "Submit",
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
  const [showDeckSelector, setShowDeckSelector] = useState(false);
  const [p2DeckId, setP2DeckId] = useState<string | null>(null);
  const [p1DeckId, setP1DeckId] = useState<string | null>(null);
  const [decks, setDecks] = useState<{ name: string, _id: string }[]>([]);
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
    OpenHandText,
    p2DeckLabel,
    p1DeckLabel,
    SubmitBtnText
  } = ModalConstants;

  const getDecks = async () => {
    fetchDecks((param: { name: string, _id: string }[]) => { setDecks(param) });
  };

  useEffect(() => {
    if (!toolsSettingsModalOpen) return;
    getDecks();
    setP1DeckId(p1DeckFromServer?._id?.toString() || "");
    setP2DeckId(p2DeckFromServer?._id?.toString() || "");
    setShowDeckSelector(false);
  }, [p1DeckFromServer?._id, p2DeckFromServer?._id, toolsSettingsModalOpen]);

  const handleEditDeck = () => {
    window.open(`/decks/${p1 ? p1DeckFromServer?._id : p2DeckFromServer?._id}`, "_blank");
  };

  const handleSetDecks = () => {
    emitGameEvent({ type: GAME_EVENT.resetGame, data: { p2DeckId, p1DeckId } });
    closeModal();
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
              {renderToolButton(ChangeDeckButtonText, "change-decks", () => setShowDeckSelector((prev) => !prev), "bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-500 hover:to-cyan-600")}
              {renderToolButton(EditDeckButtonText, "edit-deck", handleEditDeck, "bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600")}
              {renderToolButton(ResetGameButtonText, "reset-game", () => emitGameEvent({ type: GAME_EVENT.resetGame, data: { p2DeckId: p2DeckFromServer?.id, p1DeckId: p1DeckFromServer?.id } }), "bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600")}
            </div>
            {showDeckSelector && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/30 p-2">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    {p1DeckLabel}
                  </label>
                  <Select value={p1DeckId || ""} onValueChange={setP1DeckId}>
                    <SelectTrigger className="h-8 w-full text-xs bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select deck" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {decks.map((deckOption, index) => (
                          <SelectItem key={deckOption._id + `${index}`} value={deckOption._id}>
                            {deckOption.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    {p2DeckLabel}
                  </label>
                  <Select value={p2DeckId || ""} onValueChange={setP2DeckId}>
                    <SelectTrigger className="h-8 w-full text-xs bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select deck" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {decks.map((deckOption, index) => (
                          <SelectItem key={deckOption._id + `${index}`} value={deckOption._id}>
                            {deckOption.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    className="w-full h-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-xs rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={handleSetDecks}
                  >
                    <span>{SubmitBtnText}</span>
                  </Button>
                </div>
              </div>
            )}
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
