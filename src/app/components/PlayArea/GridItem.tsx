import { useDrop } from "react-dnd";
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { moveCard } from "@/client/redux/gameStateSlice";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { setCardForSelectingZone, setSelectingZone, setSelectionFeedback } from "@/client/redux/clientGameStateSlice";
import { CardState } from "@/shared/interfaces/CardState";
import { MatchStatus } from "@/shared/enums/Match";
import { gameZoneLabel } from "@/client/utils/gameZoneLabel";


export default function GridItem({ children, cardTarget, targetIndex }: { children: ReactNode, cardTarget: CARD_TARGET, targetIndex?: number }) {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.gameState);
  const sequenceState = useAppSelector((state) => state.sequenceState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const { sequences, resolving } = sequenceState;
  const { side, selectingZone, cardForSelectingZone } = clientGameState;
  const [settled, setSettled] = useState(false);
  const [dropAnnouncement, setDropAnnouncement] = useState("");
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);
  const cardsInZone = (targetIndex || targetIndex === 0) ? gameState[cardTarget as keyof typeof gameState][targetIndex] as CardState[] : gameState[cardTarget as keyof typeof gameState] as CardState[];
  const canDropCard = () => gameState.matchStatus !== MatchStatus.Completed;
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ["card"],
      canDrop: () => canDropCard(),
      drop: (cardToDrop: { id: string, cardTarget: CARD_TARGET, name: string, type: CARD_TYPE, zoneIndex?: number }) => {
        // if (cardToDrop.type === CARD_TYPE.WARRIOR) {
        //   dispatch(moveCard({
        //     id: cardToDrop.id,
        //     from: cardToDrop.cardTarget,
        //     target: cardTarget,
        //     targetIndex
        //   }));
        //   emitGameEvent({
        //     type: GAME_EVENT.conscript, data: {
        //       id: cardToDrop.id,
        //       from: {target: cardToDrop.cardTarget, targetIndex: null},
        //       target: cardTarget,
        //       targetIndex,
        //       keywords: []
        //     }
        //   })

        // }
        // dispatch(addSequenceItem({
        //   name: cardToDrop.name,
        //   cost: [
        //     { type: StepType.MoveCard, action: {
        //         id: cardToDrop.id,
        //         from: cardToDrop.cardTarget,
        //         target: cardTarget,
        //         targetIndex
        //       },
        //       triggers: []
        //     }
        //   ],
        //   effect: [
        //     { type: StepType.None, action: {},
        //     triggers: []}
        //   ]
        // }));
        dispatch(moveCard({
          id: cardToDrop.id,
          from: cardToDrop.cardTarget,
          target: cardTarget,
          targetIndex
        }));
        emitGameEvent({
          type: GAME_EVENT.moveCard, data: {
            id: cardToDrop.id,
            from: { target: cardToDrop.cardTarget, targetIndex: cardToDrop.zoneIndex },
            target: cardTarget,
            targetIndex
          }
        });
        setDropAnnouncement(`${cardToDrop.name || "Card"} moved to ${gameZoneLabel(cardTarget, side, targetIndex).toLowerCase()}.`);
        setSettled(true);
        if (settleTimer.current) clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(() => setSettled(false), 550);
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop()
      })
    }),
    [cardTarget, side, sequences, resolving, targetIndex] // dependencies for the drop hook
  )
  const selecting = useMemo(() => {
    if (!selectingZone) return false;
    if (cardsInZone && cardsInZone.length) return false;
    if (selectingZone === CARD_TYPE.WARRIOR) {
      return (
        cardTarget === CARD_TARGET.P1_PLAYER_WARRIOR && side === "p1" ||
        cardTarget === CARD_TARGET.P2_PLAYER_WARRIOR && side === "p2"
      );
    }
    if (selectingZone === CARD_TYPE.UNIFIED) {
      return (
        cardTarget === CARD_TARGET.P1_PLAYER_UNIFIED && side === "p1" ||
        cardTarget === CARD_TARGET.P2_PLAYER_UNIFIED && side === "p2"
      );
    }
    if (selectingZone === CARD_TYPE.FORTIFIED) {
      return (
        cardTarget === CARD_TARGET.P1_PLAYER_FORTIFIED && side === "p1" ||
        cardTarget === CARD_TARGET.P2_PLAYER_FORTIFIED && side === "p2"
      );
    }
    return false;
  }, [selectingZone, cardTarget, side, cardsInZone]);

  const handleZoneSelect = () => {
    if (selecting) {
      if (cardForSelectingZone) {
        dispatch(moveCard({
          id: cardForSelectingZone.id,
          target: cardTarget,
          targetIndex,
          from: cardForSelectingZone.cardTarget,
        }));
        emitGameEvent({
          type: GAME_EVENT.moveCard, data: {
            id: cardForSelectingZone.id,
            target: cardTarget,
            targetIndex,
            from: {target: cardForSelectingZone.cardTarget, targetIndex: cardForSelectingZone.zoneIndex},
          }
        })
      }
      dispatch(setSelectingZone(null));
      dispatch(setCardForSelectingZone(null));
      dispatch(setSelectionFeedback(null));
      return;
    }
    if (selectingZone) {
      dispatch(setSelectionFeedback(`Choose an empty ${selectingZone} zone on your side.`));
    }
  }
  const handleCancelZoneSelect = (e: React.MouseEvent) => {
    if (selecting) {
      e.preventDefault();
      dispatch(setSelectingZone(null));
      dispatch(setCardForSelectingZone(null));
      dispatch(setSelectionFeedback(null));
    }
  }
  return (
      <div
        data-game-zone={cardTarget}
        data-zone-active={selecting || canDrop || isOver || undefined}
        data-zone-drop-state={isOver && canDrop ? "release" : canDrop ? "available" : settled ? "settled" : undefined}
        data-zone-index={targetIndex}
        role={selectingZone ? "button" : undefined}
        tabIndex={selectingZone ? 0 : undefined}
        aria-label={selectingZone ? `${cardTarget} zone ${targetIndex ?? ""}` : undefined}
        onKeyDown={(event) => { if (selectingZone && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); handleZoneSelect(); } }}
        ref={(node) => { drop(node); }}
        className={[
          "relative flex items-center justify-center rounded md:rounded-lg border transition-[border-color,background-color,box-shadow,transform] duration-150",
          "border-gray-300",
          "hover:scale-[1.02]",
          "mx-1",
          selecting ? "border-yellow-400 bg-yellow-400/50 hover:bg-yellow-300/80 cursor-pointer ring-2 ring-yellow-300/60" : "",
          isOver && canDrop ? "border-cyan-200 bg-cyan-300/20 scale-[1.02] ring-2 ring-cyan-200/70 shadow-[0_0_20px_rgba(103,232,249,.25)]" : "",
          isOver && !canDrop ? "border-red-400 bg-red-400/10" : "",
          canDrop && !isOver ? "border-cyan-300/45 bg-cyan-300/[.04]" : "",
          settled ? "border-cyan-100 bg-cyan-200/15 ring-2 ring-cyan-100/50" : "",
        ].join(" ")}
        onClick={handleZoneSelect}
        onContextMenu={handleCancelZoneSelect}
      >
        {isOver && canDrop && <span className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded border border-cyan-100/45 bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-cyan-50 shadow-lg">Release to move</span>}
        {children}
        <span className="sr-only" role="status" aria-live="polite">{dropAnnouncement}</span>
      </div>
  )

}
