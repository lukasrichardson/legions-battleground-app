import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { useDrop } from "react-dnd";
import { ReactNode } from "react";
import { useAppSelector, useAppDispatch } from "@/client/redux/hooks";
import { moveCard } from "@/client/redux/gameStateSlice";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from "@/shared/enums/GameEvent";

export default function Hand({children, cardTarget}: {children: ReactNode, cardTarget: CARD_TARGET}) {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.gameState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const { side, room } = clientGameState;
  const { p1Viewing, p2Viewing, sandboxMode} = gameState;
  const p1Side = side === "p1";
  const viewing = cardTarget.includes("p1") ? p1Viewing : p2Viewing;
  const [{isOver, canDrop}, drop] = useDrop(
    () => ({
      accept: ["card"],
      canDrop: () => sandboxMode,
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
    [cardTarget, viewing]
  )
  const playerHand = (p1Side && cardTarget === CARD_TARGET.P1_PLAYER_HAND) || (!p1Side && cardTarget === CARD_TARGET.P2_PLAYER_HAND);
  const p1Name = Object.values(room?.players || {})?.find(player => player.p1)?.name || "Player 1";
  const p2Name = Object.values(room?.players || {})?.find(player => !player.p1)?.name || "Player 2";
  return (
    drop(
      <div className={[
        "relative flex justify-center w-full",
        "h-[10%]",
        !playerHand ? "-translate-y-[20%]" : "",
        isOver && canDrop ? "border-green-400 bg-green-400/50 scale-[1.02]" : "",
        isOver && !canDrop ? "border-red-400 bg-red-400/10" : "",
        canDrop && !isOver ? "border border-green-400/50 bg-blue-400/10" : "",
      ].join(" ")}
      >
        {(viewing && viewing != "null") && (
          <div className="absolute inset-x-0 bottom-[25%] z-[1000] mx-auto w-1/2 h-1/2 pointer-events-none flex items-center justify-center bg-[rgba(76,76,76,0.7)] text-white">
            viewing {viewing}
          </div>
        )}
        <div className="w-1/8 h-full flex items-center justify-center text-3xl">
          {(p1Side && playerHand) || (!p1Side && !playerHand) ? "P1" : "P2"}
        </div>
        <div className="w-6/8 h-full flex justify-center">
        {children}
        </div>
        <div className="w-1/8 h-full flex items-center justify-center text-xl overflow-hidden">
        <span className="w-full max-h-full wrap-anywhere text-center">
          {(p1Side && playerHand) || (!p1Side && !playerHand) ? p1Name : p2Name}
        </span>
        </div>
      </div>
    )
  )
}
