
import { openHelpModal,
  openSetDecksModal
} from "@/client/redux/modalsSlice";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { GAME_EVENT } from '@/client/enums/GameEvent';
import { emitGameEvent, emitRoomEvent } from "@/client/utils/emitEvent";
import { useRouter } from "next/navigation";
import { ROOM_EVENT } from "@/client/enums/RoomEvent";
import { resetState } from "@/client/redux/gameStateSlice";
import { useEffect, useRef } from "react";
import CardPreview from "../Card/CardPreview";
import useClientSettings from "@/client/hooks/useClientSettings";

const ToolbarConstants = {
  GameLogHeaderText: "Game Log",
  ChangeDeckButtonText: "Change Deck(s)",
  SwitchSideButtonText: "Switch to ",
  RollDieButtonText: "Roll Die",
  ResetGameButtonText: "Reset Game",
  LeaveGameButtonText: "Leave Game",
  HelpButtonText: "Help/Instructions",
  MulliganText: "Mulligan",
  EditDeckButtonText: "Edit Deck"
}

const renderToolbarButton = (text: string, onClick: () => void) => (
  <button className="self-end text-[12px] font-bold px-1 py-0.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-white/10" onClick={onClick}>{text}</button>
)

export default function Toolbar({ }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.gameState);
  const sequenceState = useAppSelector((state) => state.sequenceState);
  const { hoverMenu, setHoverMenu, legacyMenu, setLegacyMenu, transparentOnBlur, setTransparentOnBlur } = useClientSettings();
  const gameLogRef = useRef<HTMLDivElement>(null);
  const { side } = gameState;
  const p1 = side === "p1";
  const { p2DeckFromServer, p1DeckFromServer, gameLog } = gameState.game;

  const onChatSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      emitGameEvent({ type: GAME_EVENT.sendChatMessage, data: { message: e.currentTarget.value, side } });
      (e.target as HTMLTextAreaElement).value = "";
    }
  }

  const {
    // GameLogHeaderText,
    ChangeDeckButtonText,
    SwitchSideButtonText,
    RollDieButtonText,
    ResetGameButtonText,
    LeaveGameButtonText,
    HelpButtonText,
    MulliganText,
    EditDeckButtonText
  } = ToolbarConstants;

  const handleSwitchSide = () => {
    emitRoomEvent({ type: ROOM_EVENT.switchSide, data: null });
  }

  const handleLeaveGame = () => {
    router.push(`/`);
    dispatch(resetState());
  }

  const handleEditDeck = () => {
    window.open(`/decks/${p1 ? p1DeckFromServer?._id : p2DeckFromServer?._id}`, "_blank");
  }

  useEffect(() => {
    gameLogRef.current?.scrollTo(0, gameLogRef.current.scrollHeight);
  }, [gameState.game.gameLog.length]);

  return (
    <div className="h-[100%] w-[20%] flex flex-col items-center text-white p-[8px] bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur border-r border-white/10">
      <CardPreview />

      {gameState.game.sandboxMode ?
      <div className="relative w-full h-[25%] overflow-y-auto bg-black/50 text-white rounded-md p-1 mb-1 border border-white/10" ref={gameLogRef}>
        {gameLog.length ? (
          <>
            <div className="text-sm text-center text-white/80 sticky top-0 bg-black/90">Logs</div>
            {gameLog.map((log, index) => (
              <div key={index} className="border border-white/10 rounded mb-1 p-1 flex flex-col-reverse">
                <div key={index} className="text-xs text-white/80">{log}</div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-sm text-white/70">No sequences</div>
        )}
      </div>
      :
      <div className="w-full h-[25%] overflow-y-auto bg-black/50 text-white rounded-md p-2 mb-4 border border-white/10">
        {sequenceState.sequences.length ? (
          <div>
            <div className="mb-2 text-sm text-white/80">Sequences State</div>
            {sequenceState.sequences.map((seq, index) => (
              <div key={index} className="border border-white/10 rounded mb-1 p-1">
                <div className="text-xs">sequence: {index + 1}</div>
                {seq.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="text-xs text-white/80">{item.name}</div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-white/70">No sequences</div>
        )}
      </div>
      }

      <textarea
        placeholder="Type to chat"
        className="w-full max-h-[2.5%] text-xs overflow-y-auto bg-black/50 text-white rounded-md mb-4 border border-white/10 resize-none"
        onKeyDown={onChatSubmit}
      />

      <div className="mt-auto w-full flex flex-wrap gap-1 justify-between">
        {renderToolbarButton(ChangeDeckButtonText, () => dispatch(openSetDecksModal()))}
        {renderToolbarButton(SwitchSideButtonText + (p1 ? "P2" : "P1"), handleSwitchSide)}
        {renderToolbarButton(RollDieButtonText, () => emitGameEvent({ type: GAME_EVENT.rollDie, data: { side } }))}
        {renderToolbarButton(ResetGameButtonText, () => emitGameEvent({ type: GAME_EVENT.resetGame, data: { p2DeckId: p2DeckFromServer?.id, p1DeckId: p1DeckFromServer?.id } }))}
        {renderToolbarButton(LeaveGameButtonText, handleLeaveGame)}
        {renderToolbarButton(HelpButtonText, () => dispatch(openHelpModal()))}
        {renderToolbarButton(MulliganText, () => emitGameEvent({ type: GAME_EVENT.mulligan, data: null }))}
        {renderToolbarButton(EditDeckButtonText, handleEditDeck)}
        <div>
          <label htmlFor="hoverMenu" className="text-xs mr-1">Show Menu On Hover:</label>
          <input name="hoverMenu" type="checkbox" checked={hoverMenu} onChange={() => setHoverMenu(!hoverMenu)}/>
        </div>
        <div>
          <label htmlFor="legacyMenu" className="text-xs mr-1">Use Legacy Menu:</label>
          <input name="legacyMenu" type="checkbox" checked={legacyMenu} onChange={() => setLegacyMenu(!legacyMenu)}/>
        </div>
        <div>
          <label htmlFor="transparentOnBlur" className="text-xs mr-1">Transparent Card Modals:</label>
          <input name="transparentOnBlur" type="checkbox" checked={transparentOnBlur} onChange={() => setTransparentOnBlur(!transparentOnBlur)}/>
        </div>
      </div>
    </div>
  )
}