import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { useDrop } from "react-dnd";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/client/redux/hooks";
import { moveCard } from "@/client/redux/gameStateSlice";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { MatchStatus } from "@/shared/enums/Match";
import { gameViewingLabel, gameZoneLabel } from "@/client/utils/gameZoneLabel";
import useIsMobile from "@/client/hooks/useIsMobile";

export default function Hand({children, cardTarget, compact = false}: {children: ReactNode, cardTarget: CARD_TARGET, compact?: boolean}) {
  const compactScreen = useIsMobile(1101);
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.gameState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const { side, room } = clientGameState;
  const { p1Viewing, p2Viewing } = gameState;
  const [settled, setSettled] = useState(false);
  const [dropAnnouncement, setDropAnnouncement] = useState("");
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);
  const p1Side = side === "p1";
  const viewing = cardTarget.includes("p1") ? p1Viewing : p2Viewing;
  const [{isOver, canDrop}, drop] = useDrop(
    () => ({
      accept: ["card"],
      canDrop: () => gameState.matchStatus !== MatchStatus.Completed,
      drop: (
        cardToDrop: {id: string, cardTarget: CARD_TARGET, zoneIndex?: number}
      ) => {
        // dispatch(moveCard({
        //   id: cardToDrop.id,
        //   from: {target: cardToDrop.cardTarget, targetIndex: null},
        //   target: cardTarget 
        // }))
        // emitGameEvent({ type: GAME_EVENT.moveCard, data: {
        //   id: cardToDrop.id,
        //   from: {target: cardToDrop.cardTarget, targetIndex: null},
        //   target: cardTarget
        // }})
        dispatch(moveCard({
          id: cardToDrop.id,
          from: cardToDrop.cardTarget,
          target: cardTarget,
          targetIndex: null
        }));
        emitGameEvent({ type: GAME_EVENT.moveCard, data: {
          id: cardToDrop.id,
          from: {target: cardToDrop.cardTarget, targetIndex: cardToDrop.zoneIndex},
          target: cardTarget,
          targetIndex: null
        }});
        setDropAnnouncement(`Card moved to ${gameZoneLabel(cardTarget, side).toLowerCase()}.`);
        setSettled(true);
        if (settleTimer.current) clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(() => setSettled(false), 550);
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop()
      })
    }),
    [cardTarget, viewing, gameState.matchStatus, side]
  )
  const playerHand = (p1Side && cardTarget === CARD_TARGET.P1_PLAYER_HAND) || (!p1Side && cardTarget === CARD_TARGET.P2_PLAYER_HAND);
  const p1Name = Object.values(room?.players || {})?.find(player => player.p1)?.name || "Player 1";
  const p2Name = Object.values(room?.players || {})?.find(player => !player.p1)?.name || "Player 2";
  const handBelongsToP1 = (p1Side && playerHand) || (!p1Side && !playerHand);
  const seatLabel = handBelongsToP1 ? "P1" : "P2";
  const playerName = handBelongsToP1 ? p1Name : p2Name;
  return (
      <div ref={(node) => { drop(node); }} data-zone-drop-state={isOver && canDrop ? "release" : canDrop ? "available" : settled ? "settled" : undefined} className={[
        "game-hand relative flex justify-center w-full transition-[border-color,background-color,box-shadow,transform] duration-150",
        compact ? "h-full" : "h-[10%]",
        !compact && !playerHand ? "-translate-y-[20%]" : "",
        isOver && canDrop ? "border border-cyan-200 bg-cyan-300/20 scale-[1.01] ring-2 ring-cyan-200/70 shadow-[0_0_20px_rgba(103,232,249,.25)]" : "",
        isOver && !canDrop ? "border-red-400 bg-red-400/10" : "",
        canDrop && !isOver ? "border border-cyan-300/45 bg-cyan-300/[.04]" : "",
        settled ? "border border-cyan-100 bg-cyan-200/15 ring-2 ring-cyan-100/50" : "",
      ].join(" ")}
      >
        {isOver && canDrop && <span className="pointer-events-none absolute left-1/2 top-1/2 z-[1100] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded border border-cyan-100/45 bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-cyan-50 shadow-lg">Release to move</span>}
        {(viewing && viewing != "null") && (
          <div className="absolute inset-x-0 bottom-[25%] z-[1000] mx-auto w-1/2 h-1/2 pointer-events-none flex items-center justify-center bg-[rgba(76,76,76,0.7)] text-white">
            Viewing {gameViewingLabel(viewing, side)}
          </div>
        )}
        {compactScreen ? <div data-player-identity className="flex h-full w-20 shrink-0 items-center justify-center px-1 text-[10px]" aria-label={`${seatLabel}, ${playerName}`} title={`${seatLabel} · ${playerName}`}><span className="w-full truncate text-center">{seatLabel} · {playerName}</span></div> : <div className="w-1/8 h-full flex items-center justify-center text-3xl">{seatLabel}</div>}
        <div
          data-mobile-overflow-exempt={compact && playerHand ? "hand-tray" : undefined}
          data-mobile-horizontal-scroll-affordance={compact && playerHand ? true : undefined}
          className={"relative w-6/8 h-full flex justify-center max-[1100px]:min-w-0 max-[1100px]:flex-1" + (compact && !playerHand ? " items-end overflow-hidden" : "") + (compact && playerHand ? " overflow-x-auto justify-start px-1 hand-scrollbar" : "")}
        >
        <div className={compact && playerHand ? "flex min-w-max items-end gap-1 pr-7" : "flex justify-center"}>{children}</div>
        {compact && playerHand && <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-full w-7 bg-gradient-to-l from-slate-950/90 to-transparent text-right text-[9px] font-semibold text-cyan-100/80">›</span>}
        </div>
        {!compactScreen && <div className="w-1/8 h-full flex items-center justify-center text-xl overflow-hidden"><span className="w-full max-h-full wrap-anywhere text-center" title={playerName}>{playerName}</span></div>}
        <span className="sr-only" role="status" aria-live="polite">{dropAnnouncement}</span>
      </div>
  )
}
