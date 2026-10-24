import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { useDrop } from "react-dnd";
import { ReactNode } from "react";
import { useAppSelector, useAppDispatch } from "@/client/redux/hooks";
import { moveCard } from "@/client/redux/gameStateSlice";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { MatchStatus } from "@/shared/enums/Match";
import { gameViewingLabel } from "@/client/utils/gameZoneLabel";

export default function Hand({children, cardTarget, compact = false}: {children: ReactNode, cardTarget: CARD_TARGET, compact?: boolean}) {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.gameState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const { side, room } = clientGameState;
  const { p1Viewing, p2Viewing } = gameState;
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
        }})
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop()
      })
    }),
    [cardTarget, viewing, gameState.matchStatus]
  )
  const playerHand = (p1Side && cardTarget === CARD_TARGET.P1_PLAYER_HAND) || (!p1Side && cardTarget === CARD_TARGET.P2_PLAYER_HAND);
  const p1Name = Object.values(room?.players || {})?.find(player => player.p1)?.name || "Player 1";
  const p2Name = Object.values(room?.players || {})?.find(player => !player.p1)?.name || "Player 2";
  return (
      <div ref={(node) => { drop(node); }} className={[
        "game-hand relative flex justify-center w-full",
        compact ? "h-full" : "h-[10%]",
        !compact && !playerHand ? "-translate-y-[20%]" : "",
        isOver && canDrop ? "border-green-400 bg-green-400/50 scale-[1.02]" : "",
        isOver && !canDrop ? "border-red-400 bg-red-400/10" : "",
        canDrop && !isOver ? "border border-green-400/50 bg-blue-400/10" : "",
      ].join(" ")}
      >
        {(viewing && viewing != "null") && (
          <div className="absolute inset-x-0 bottom-[25%] z-[1000] mx-auto w-1/2 h-1/2 pointer-events-none flex items-center justify-center bg-[rgba(76,76,76,0.7)] text-white">
            Viewing {gameViewingLabel(viewing, side)}
          </div>
        )}
        <div className="w-1/8 h-full flex items-center justify-center text-3xl max-[1100px]:w-9 max-[1100px]:shrink-0 max-[1100px]:text-xs">
          {(p1Side && playerHand) || (!p1Side && !playerHand) ? "P1" : "P2"}
        </div>
        <div
          data-mobile-overflow-exempt={compact && playerHand ? "hand-tray" : undefined}
          data-mobile-horizontal-scroll-affordance={compact && playerHand ? true : undefined}
          className={"relative w-6/8 h-full flex justify-center max-[1100px]:min-w-0 max-[1100px]:flex-1" + (compact && !playerHand ? " items-end overflow-hidden" : "") + (compact && playerHand ? " overflow-x-auto justify-start px-1 hand-scrollbar" : "")}
        >
        <div className={compact && playerHand ? "flex min-w-max items-end gap-1 pr-7" : "flex justify-center"}>{children}</div>
        {compact && playerHand && <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-full w-7 bg-gradient-to-l from-slate-950/90 to-transparent text-right text-[9px] font-semibold text-cyan-100/80">›</span>}
        </div>
        <div className="w-1/8 h-full flex items-center justify-center text-xl overflow-hidden max-[1100px]:w-16 max-[1100px]:shrink-0 max-[1100px]:px-1 max-[1100px]:text-[10px]">
        <span className="w-full max-h-full wrap-anywhere text-center max-[1100px]:truncate" title={(p1Side && playerHand) || (!p1Side && !playerHand) ? p1Name : p2Name}>
          {(p1Side && playerHand) || (!p1Side && !playerHand) ? p1Name : p2Name}
        </span>
        </div>
      </div>
  )
}
