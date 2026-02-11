import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { emitGameEvent } from "../utils/emitEvent";
import { MouseEventHandler, useCallback } from "react";
import { clearCardInFocus, clearSelectedCard, decreaseAttackModifier, decreaseCooldown, decreaseOtherModifier, focusCard, increaseAttackModifier, increaseCooldown, increaseOtherModifier, selectCard } from "../redux/gameStateSlice";
import { GAME_EVENT } from "../enums/GameEvent";
import { CardInterface } from "../interfaces/CardInterface";

export default function useHandleCardEvents(card: CardInterface, cardTarget: CARD_TARGET, hidden: boolean, inPileView: boolean, index?: number, zoneIndex?: number) {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.gameState);
  const { selectedCard } = state.game;

  const handleDecreaseCooldown = useCallback(() => {
    dispatch(decreaseCooldown({ cardTarget, cardIndex: index, zoneIndex }));
    emitGameEvent({
      type: GAME_EVENT.decreaseCardCooldown, data: {
        cardTarget,
        cardIndex: index,
        zoneIndex
      }
    });
  }, [cardTarget, index, zoneIndex, dispatch]);

  const handleIncreaseCooldown = useCallback(() => {
    dispatch(increaseCooldown({ cardTarget, cardIndex: index, zoneIndex }));
    emitGameEvent({
      type: GAME_EVENT.increaseCardCooldown, data: {
        cardTarget,
        cardIndex: index,
        zoneIndex
      }
    });
  }, [cardTarget, index, zoneIndex, dispatch]);

  const handleIncreaseAttackModifier = useCallback(() => {
    dispatch(increaseAttackModifier({ cardTarget, cardIndex: index, zoneIndex }));
    emitGameEvent({
      type: GAME_EVENT.increaseCardAttackModifier, data: {
        cardTarget,
        cardIndex: index,
        zoneIndex
      }
    });
  }, [cardTarget, index, zoneIndex, dispatch]);

  const handleDecreaseAttackModifier = useCallback(() => {
    dispatch(decreaseAttackModifier({ cardTarget, cardIndex: index, zoneIndex }));
    emitGameEvent({
      type: GAME_EVENT.decreaseCardAttackModifier, data: {
        cardTarget,
        cardIndex: index,
        zoneIndex
      }
    });
  }, [cardTarget, index, zoneIndex, dispatch]);

  const handleIncreaseOtherModifier = useCallback(() => {
    dispatch(increaseOtherModifier({ cardTarget, cardIndex: index, zoneIndex }));
    emitGameEvent({
      type: GAME_EVENT.increaseCardOtherModifier, data: {
        cardTarget,
        cardIndex: index,
        zoneIndex
      }
    });
  }, [cardTarget, index, zoneIndex, dispatch]);

  const handleDecreaseOtherModifier = useCallback(() => {
    dispatch(decreaseOtherModifier({ cardTarget, cardIndex: index, zoneIndex }));
    emitGameEvent({
      type: GAME_EVENT.decreaseCardOtherModifier, data: {
        cardTarget,
        cardIndex: index,
        zoneIndex
      }
    });
  }, [cardTarget, index, zoneIndex, dispatch]);

  const handleCardRightClick: MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (selectedCard?.id === card.id) {
      dispatch(clearSelectedCard());
      emitGameEvent({ type: GAME_EVENT.clearSelectedCard, data: null });
    } else {
      dispatch(selectCard(card));
      emitGameEvent({ type: GAME_EVENT.selectCard, data: card });
    }
  }

  const handleCardHover = () => {
    if (hidden) return;
    if ([CARD_TARGET.P1_PLAYER_DECK, CARD_TARGET.P2_PLAYER_DECK].includes(cardTarget) && !inPileView) return;
    dispatch(focusCard(card));
  }

  const handleCardBlur = () => {
    dispatch(clearCardInFocus());
  }

  return {
    handleDecreaseCooldown,
    handleIncreaseCooldown,
    handleIncreaseAttackModifier,
    handleDecreaseAttackModifier,
    handleIncreaseOtherModifier,
    handleDecreaseOtherModifier,
    handleCardRightClick,
    handleCardHover,
    handleCardBlur
  }
}