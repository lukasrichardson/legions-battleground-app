
import {
  openHelpModal,
  openToolsSettingsModal
} from "@/client/redux/modalsSlice";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { GAME_EVENT } from '@/shared/enums/GameEvent';
import { emitGameEvent, emitRoomEvent } from "@/client/utils/emitEvent";
import { useRouter } from "next/navigation";
import { ROOM_EVENT } from "@/shared/enums/RoomEvent";
import { resetState } from "@/client/redux/gameStateSlice";
import { useEffect, useRef } from "react";
import CardPreview from "../Card/CardPreview";
import AppIcon, { AppIconName } from "../AppIcon";
import { Tooltip } from "antd";

const ToolbarConstants = {
  GameLogHeaderText: "Game Log",
  ToolsSettingsButtonText: "Tools & Settings",
  SwitchSideButtonText: "Switch to ",
  RollDieButtonText: "Roll D6",
  LeaveGameButtonText: "Leave Game",
  HelpButtonText: "Help",
  MulliganText: "Mulligan"
}

const renderToolbarButton = ({
  text,
  icon,
  onClick,
  className = "",
  iconOnly = false,
  ariaLabel
}: {
  text?: string;
  icon?: AppIconName;
  onClick: () => void;
  className?: string;
  iconOnly?: boolean;
  ariaLabel?: string;
}) => (
  <button
    type="button"
    className={`text-[12px] font-bold px-2 py-1.5 cursor-pointer text-white rounded-lg border border-white/10 transition-all duration-150 ${className}`}
    onClick={onClick}
    aria-label={ariaLabel || text}
  >
    <Tooltip title={ariaLabel || text} placement="top" mouseEnterDelay={0.2}>
      <div>
        {iconOnly && icon ? (
          <div className="flex items-center justify-center">
            <AppIcon name={icon} size={16} />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5">
            {icon ? <AppIcon name={icon} size={14} /> : null}
            <span>{text}</span>
          </div>
        )}
      </div>
    </Tooltip>
  </button>
)

export default function Toolbar({ }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.gameState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const sequenceState = useAppSelector((state) => state.sequenceState);
  const gameLogRef = useRef<HTMLDivElement>(null);
  const { side } = clientGameState;
  const p1 = side === "p1";
  const { gameLog } = gameState;

  const onChatSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      emitGameEvent({ type: GAME_EVENT.sendChatMessage, data: { message: e.currentTarget.value, side } });
      (e.target as HTMLTextAreaElement).value = "";
    }
  }

  const {
    // GameLogHeaderText,
    ToolsSettingsButtonText,
    SwitchSideButtonText,
    RollDieButtonText,
    LeaveGameButtonText,
    HelpButtonText,
    MulliganText
  } = ToolbarConstants;

  const handleSwitchSide = () => {
    emitRoomEvent({ type: ROOM_EVENT.switchSide, data: null });
  }

  const handleLeaveGame = () => {
    router.push(`/`);
    dispatch(resetState());
  }

  useEffect(() => {
    gameLogRef.current?.scrollTo(0, gameLogRef.current.scrollHeight);
  }, [gameState.gameLog.length]);

  return (
    <div className="h-[100%] w-[20%] flex flex-col items-center text-white p-[8px] bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur border-r border-white/10">
      <CardPreview />

      {gameState.sandboxMode ?
      <div className="relative w-full h-[25%] overflow-y-auto sidebar-scrollbar bg-black/50 text-white rounded-md p-1 mb-1 border border-white/10" ref={gameLogRef}>
        {gameLog.length ? (
          <>
            <div className="text-sm text-center text-white/80 sticky top-0 bg-black/90">Logs</div>
            {gameLog.map((log, index) => (
              <div key={index} className="border border-white/10 rounded mb-1 p-1 flex flex-col-reverse">
                <div key={index} className="text-[11px] text-white/80">{log}</div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-sm text-white/70">No sequences</div>
        )}
      </div>
      :
      <div className="w-full h-[25%] overflow-y-auto sidebar-scrollbar bg-black/50 text-white rounded-md p-2 mb-4 border border-white/10">
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
        className="w-full min-h-[56px] max-h-[96px] px-3 py-2 text-sm leading-5 overflow-y-auto sidebar-scrollbar bg-black/55 text-white rounded-lg mb-4 border border-white/15 resize-none placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-blue-400/60 focus:border-blue-400/50"
        onKeyDown={onChatSubmit}
      />

      <div className="mt-auto w-full space-y-2">
        <div className="grid grid-cols-3 gap-1">
          {renderToolbarButton({
            icon: "tools",
            iconOnly: true,
            ariaLabel: ToolsSettingsButtonText,
            onClick: () => dispatch(openToolsSettingsModal()),
            className: "w-full h-9 px-0 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600"
          })}
          {renderToolbarButton({
            icon: "roll-d6",
            iconOnly: true,
            ariaLabel: RollDieButtonText,
            onClick: () => emitGameEvent({ type: GAME_EVENT.rollDie, data: { side } }),
            className: "w-full h-9 px-0 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500"
          })}
          {renderToolbarButton({
            icon: "help",
            iconOnly: true,
            ariaLabel: HelpButtonText,
            onClick: () => dispatch(openHelpModal()),
            className: "w-full h-9 px-0 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600"
          })}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {renderToolbarButton({
            text: MulliganText,
            icon: "mulligan",
            onClick: () => emitGameEvent({ type: GAME_EVENT.mulligan, data: null }),
            className: "w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600"
          })}
          {renderToolbarButton({
            text: `${SwitchSideButtonText}${p1 ? "P2" : "P1"}`,
            icon: "switch-player",
            onClick: handleSwitchSide,
            className: "w-full bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600"
          })}
        </div>
        {renderToolbarButton({
          text: LeaveGameButtonText,
          icon: "leave-game",
          onClick: handleLeaveGame,
          className: "w-full bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600"
        })}
      </div>
    </div>
  )
}