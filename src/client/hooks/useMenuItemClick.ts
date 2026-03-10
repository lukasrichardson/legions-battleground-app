import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { CardState } from "@/shared/interfaces/CardState";
import { INewMenuItem } from "../interfaces/IMenuItem";
import { setPileInView, setSelectingZone, setCardForSelectingZone, setWisdoming } from "../redux/clientGameStateSlice";
import { flipCard, moveCard } from "../redux/gameStateSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { emitGameEvent } from "../utils/emitEvent";
import { useCallback } from "react";

export default function useMenuItemClick(card: CardState, cardTarget: CARD_TARGET, zoneIndex: number, index?: number) {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.gameState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const cardPileZone = gameState[cardTarget];
  const { side } = clientGameState;
  const p1 = side === "p1";

  const handleMove = useCallback((items: INewMenuItem[], key: string) => {
    const menuItemClicked: INewMenuItem | undefined = items?.find((item) => item.key === key || item.children?.find((child) => child.key === key || child.children?.find((subChild) => subChild.key === key)));
    switch (menuItemClicked?.target) {
      case CARD_TARGET.CONTROLLER_HAND:
        dispatch(moveCard({
          id: card.id,
          target: p1 ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND,
          from: cardTarget,
        }));
        emitGameEvent({
          type: GAME_EVENT.moveCard, data: {
            id: card.id,
            target: p1 ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND,
            from: { target: cardTarget, targetIndex: zoneIndex },
          }
        });
        break;
      case CARD_TARGET.CONTROLLER_DISCARD:
        dispatch(moveCard({
          id: card.id,
          target: p1 ? CARD_TARGET.P1_PLAYER_DISCARD : CARD_TARGET.P2_PLAYER_DISCARD,
          from: cardTarget,
        }));
        emitGameEvent({
          type: GAME_EVENT.moveCard, data: {
            id: card.id,
            target: p1 ? CARD_TARGET.P1_PLAYER_DISCARD : CARD_TARGET.P2_PLAYER_DISCARD,
            from: { target: cardTarget, targetIndex: zoneIndex },
          }
        });
        break;
      case CARD_TARGET.CONTROLLER_ERADICATION:
        dispatch(moveCard({
          id: card.id,
          target: p1 ? CARD_TARGET.P1_PLAYER_ERADICATION : CARD_TARGET.P2_PLAYER_ERADICATION,
          from: cardTarget,
        }));
        emitGameEvent({
          type: GAME_EVENT.moveCard, data: {
            id: card.id,
            target: p1 ? CARD_TARGET.P1_PLAYER_ERADICATION : CARD_TARGET.P2_PLAYER_ERADICATION,
            from: { target: cardTarget, targetIndex: zoneIndex },
          }
        });
        break;
      case CARD_TARGET.CONTROLLER_REVEALED:
        dispatch(moveCard({
          id: card.id,
          target: p1 ? CARD_TARGET.P1_PLAYER_REVEALED : CARD_TARGET.P2_PLAYER_REVEALED,
          from: cardTarget,
        }));
        emitGameEvent({
          type: GAME_EVENT.moveCard, data: {
            id: card.id,
            target: p1 ? CARD_TARGET.P1_PLAYER_REVEALED : CARD_TARGET.P2_PLAYER_REVEALED,
            from: { target: cardTarget, targetIndex: zoneIndex },
          }
        });
        break;
      case CARD_TARGET.CONTROLLER_DECK:
        if (menuItemClicked?.label?.includes("Bottom")) {
          dispatch(moveCard({
            id: card.id,
            target: p1 ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK,
            from: cardTarget,
            targetIndex: undefined,
            bottom: true
          }));
          emitGameEvent({
            type: GAME_EVENT.moveCard, data: {
              id: card.id,
              target: p1 ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK,
              from: { target: cardTarget, targetIndex: zoneIndex },
              bottom: true
            }
          });
        } else {

          dispatch(moveCard({
            id: card.id,
            target: p1 ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK,
            from: cardTarget,
          }));
          emitGameEvent({
            type: GAME_EVENT.moveCard, data: {
              id: card.id,
              target: p1 ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK,
              from: { target: cardTarget, targetIndex: zoneIndex },
            }
          });
        }
        break;
      default:
        break;
    }
  }, [card, cardTarget, dispatch, zoneIndex, p1]);
  const handleShuffle = useCallback(() => {
    emitGameEvent({ type: GAME_EVENT.shuffleTargetPile, data: { cardTarget, targetIndex: zoneIndex } });
  }, [cardTarget, zoneIndex]);
  const handleView = useCallback(() => {
    emitGameEvent({ type: p1 ? GAME_EVENT.setP1Viewing : GAME_EVENT.setP2Viewing, data: { cardTarget, limit: null } })
    dispatch(setPileInView({ cardTarget, targetIndex: zoneIndex }));
  }, [cardTarget, zoneIndex, dispatch, p1]);

  const handleConscript = useCallback(() => {
    dispatch(setSelectingZone(CARD_TYPE.WARRIOR))
    dispatch(setCardForSelectingZone({
      id: card.id,
      cardTarget,
      type: card.type,
      name: card.name,
      zoneIndex
    }))
  }, [card.id, cardTarget, card.type, card.name, zoneIndex, dispatch])

  const handleActivate = useCallback(() => {
    dispatch(setSelectingZone(CARD_TYPE.UNIFIED))
    dispatch(setCardForSelectingZone({
      id: card.id,
      cardTarget,
      type: card.type,
      name: card.name,
      zoneIndex
    }))
  }, [card.id, cardTarget, card.type, card.name, zoneIndex, dispatch])

  const handleSet = useCallback(() => {
    dispatch(setSelectingZone(CARD_TYPE.FORTIFIED))
    dispatch(setCardForSelectingZone({
      id: card.id,
      cardTarget,
      type: card.type,
      name: card.name,
      zoneIndex
    }))
  }, [card.id, cardTarget, card.type, card.name, zoneIndex, dispatch])

  const handleFlip = useCallback(() => {
    dispatch(flipCard({ cardTarget, cardIndex: index, zoneIndex }));
    emitGameEvent(({ type: GAME_EVENT.flipCard, data: { cardTarget, cardIndex: index, zoneIndex } }));
  }, [cardTarget, index, zoneIndex, dispatch]);

  const handleWisdom = useCallback(() => {
    dispatch(setWisdoming(true));
    emitGameEvent({ type: p1 ? GAME_EVENT.setP1Viewing : GAME_EVENT.setP2Viewing, data: { cardTarget, limit: 2 } })
    dispatch(setPileInView({ cardTarget, targetIndex: zoneIndex, limit: 2, pile: cardPileZone }));
  }, [cardTarget, zoneIndex, dispatch, p1, cardPileZone]);

  return {
    handleMove,
    handleShuffle,
    handleView,
    handleConscript,
    handleActivate,
    handleSet,
    handleFlip,
    handleWisdom
  }
}