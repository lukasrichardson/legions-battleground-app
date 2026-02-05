import { useDrop } from "react-dnd";
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { moveCard } from "@/client/redux/gameStateSlice";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from "@/client/enums/GameEvent";
import { GamePhase } from "@/client/redux/phaseSlice";


export default function GridItem({ children, cardTarget, targetIndex }: { children: ReactNode, cardTarget: CARD_TARGET, targetIndex?: number }) {
  const gameState = useAppSelector((state) => state.gameState);
  const phaseState = useAppSelector((state) => state.phaseState);
  const sequenceState = useAppSelector((state) => state.sequenceState);
  const { sequences, resolving } = sequenceState;
  const { currentPhase, turnNumber } = phaseState;
  const dispatch = useAppDispatch();
  const { side, game: { playerConscripted, sandboxMode } } = gameState;

  const canDropCard = (target: CARD_TARGET, side: string, card: { type: CARD_TYPE, cardTarget: CARD_TARGET }) => {
    
    if (sandboxMode) return true;

    const p1 = side === "p1";
    const { type, cardTarget: currentTarget } = card;
    if (!sequences.length) {
      if (!resolving){
        //conscriptions
        if (target.includes("p1") && p1 && currentPhase === GamePhase.P1War) {
          if ( currentTarget === CARD_TARGET.P1_PLAYER_HAND) {
            if (type === CARD_TYPE.WARRIOR && cardTarget === CARD_TARGET.P1_PLAYER_WARRIOR) {
              if (!playerConscripted) {
                return true;
              }
            }
          }
        };
        if (target.includes("p2") && !p1 && currentPhase === GamePhase.P2War) {
          if ( currentTarget === CARD_TARGET.P2_PLAYER_HAND) {
            if (type === CARD_TYPE.WARRIOR && cardTarget === CARD_TARGET.P2_PLAYER_WARRIOR) {
              if (!playerConscripted) {
                return true;
              }
            }
          }
        };
      }
    }

    return false;
  };
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ["card"],
      canDrop: (card) => canDropCard(cardTarget, side, card),
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
        emitGameEvent({ type: GAME_EVENT.moveCard, data: {
          id: cardToDrop.id,
          from: {target: cardToDrop.cardTarget, targetIndex: cardToDrop.zoneIndex},
          target: cardTarget,
          targetIndex
        }})
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop()
      })
    }),
    [cardTarget, side, sequences, resolving, currentPhase, turnNumber, targetIndex] // dependencies for the drop hook
  )
  // const isP2PlayerCards = cardTarget.includes("p2");
  return (
    drop(
      <div
        className={[
          "relative flex items-center justify-center rounded md:rounded-lg border transition-all duration-200",
          "border-gray-300",
          "hover:scale-[1.02]",
          "mx-1",
          isOver && canDrop ? "border-green-400 bg-green-400/10 scale-[1.02]" : "",
          isOver && !canDrop ? "border-red-400 bg-red-400/10" : "",
          canDrop && !isOver ? "border-blue-400/50" : "",
          // !isP2PlayerCards ? "bg-[#1d1e18] text-white" : "",
        ].join(" ")}
      >
        {children}
      </div>
    )
  )

}