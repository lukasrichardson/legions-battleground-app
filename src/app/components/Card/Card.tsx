import IMenuItem, { INewMenuItem } from '@/client/interfaces/IMenuItem';
import { useCallback, useMemo, useState } from 'react';
import { CardInterface } from "@/shared/interfaces/CardInterface";
import { CARD_TARGET } from '@/shared/enums/CardTarget';
import { useAppDispatch, useAppSelector } from '@/client/redux/hooks';
import { moveCard, flipCard } from '@/client/redux/gameStateSlice';
import { setPileInView } from '@/client/redux/clientGameStateSlice';

import { cardMenuItems, deckMenuItems, newCardMenuItems } from '@/client/constants/cardMenu.constants';
import { GAME_EVENT } from '@/client/enums/GameEvent';
import { emitGameEvent } from '@/client/utils/emitEvent';
import MenuItemAction from '@/client/enums/MenuItemAction';
import CardInner from './CardInner';
import { openPlunderModal } from '@/client/redux/modalsSlice';
import useHandleCardEvents from '@/client/hooks/useHandleCardEvents';

export default function Card({ card, cardTarget, index, inPileView = false, zoneIndex, hidden = false }: { card: CardInterface, cardTarget: CARD_TARGET, index?: number, inPileView?: boolean, zoneIndex?: number, hidden?: boolean }) {
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const gameState = useAppSelector((state) => state.gameState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const { side, cardInFocus } = clientGameState;
  const { selectedCard } = gameState;
  const dispatch = useAppDispatch();
  const { legacyMenu } = useAppSelector((state) => state.clientSettings);

  const handlePopoverVisibleChange = () => {
    if (hidden) return;
    setIsPopoverVisible(!isPopoverVisible);
  }
  const closePopover = () => {
    setIsPopoverVisible(false);
  }
  const newonMenuItemClick = useCallback((items: INewMenuItem[], key: string | number) => {
    const menuItemClicked: INewMenuItem | undefined = items?.find((item) => item.key === key || item.children?.find((child) => child.key === key || child.children?.find((subChild) => subChild.key === key)));
    switch (menuItemClicked?.target) {
      case CARD_TARGET.CONTROLLER_HAND:
        dispatch(moveCard({
          id: card.id,
          target: side === "p1" ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND,
          from: cardTarget,
        }));
        emitGameEvent({
          type: GAME_EVENT.moveCard, data: {
            id: card.id,
            target: side === "p1" ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND,
            from: { target: cardTarget, targetIndex: zoneIndex },
          }
        });
        break;
      case CARD_TARGET.CONTROLLER_DISCARD:
        dispatch(moveCard({
          id: card.id,
          target: side === "p1" ? CARD_TARGET.P1_PLAYER_DISCARD : CARD_TARGET.P2_PLAYER_DISCARD,
          from: cardTarget,
        }));
        emitGameEvent({
          type: GAME_EVENT.moveCard, data: {
            id: card.id,
            target: side === "p1" ? CARD_TARGET.P1_PLAYER_DISCARD : CARD_TARGET.P2_PLAYER_DISCARD,
            from: { target: cardTarget, targetIndex: zoneIndex },
          }
        });
        break;
      case CARD_TARGET.CONTROLLER_ERADICATION:
        dispatch(moveCard({
          id: card.id,
          target: side === "p1" ? CARD_TARGET.P1_PLAYER_ERADICATION : CARD_TARGET.P2_PLAYER_ERADICATION,
          from: cardTarget,
        }));
        emitGameEvent({
          type: GAME_EVENT.moveCard, data: {
            id: card.id,
            target: side === "p1" ? CARD_TARGET.P1_PLAYER_ERADICATION : CARD_TARGET.P2_PLAYER_ERADICATION,
            from: { target: cardTarget, targetIndex: zoneIndex },
          }
        });
        break;
      case CARD_TARGET.CONTROLLER_REVEALED:
        dispatch(moveCard({
          id: card.id,
          target: side === "p1" ? CARD_TARGET.P1_PLAYER_REVEALED : CARD_TARGET.P2_PLAYER_REVEALED,
          from: cardTarget,
        }));
        emitGameEvent({
          type: GAME_EVENT.moveCard, data: {
            id: card.id,
            target: side === "p1" ? CARD_TARGET.P1_PLAYER_REVEALED : CARD_TARGET.P2_PLAYER_REVEALED,
            from: { target: cardTarget, targetIndex: zoneIndex },
          }
        });
        break;
      case CARD_TARGET.CONTROLLER_DECK:
        if (menuItemClicked?.label?.includes("Bottom")) {
          dispatch(moveCard({
            id: card.id,
            target: side === "p1" ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK,
            from: cardTarget,
            targetIndex: undefined,
            bottom: true
          }));
          emitGameEvent({
            type: GAME_EVENT.moveCard, data: {
              id: card.id,
              target: side === "p1" ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK,
              from: { target: cardTarget, targetIndex: zoneIndex },
              bottom: true
            }
          });
        } else {

          dispatch(moveCard({
            id: card.id,
            target: side === "p1" ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK,
            from: cardTarget,
          }));
          emitGameEvent({
            type: GAME_EVENT.moveCard, data: {
              id: card.id,
              target: side === "p1" ? CARD_TARGET.P1_PLAYER_DECK : CARD_TARGET.P2_PLAYER_DECK,
              from: { target: cardTarget, targetIndex: zoneIndex },
            }
          });
        }
        break;
      default:
        break;
    }
  }, [card, cardTarget, dispatch, zoneIndex, side]);

  const legacyonMenuItemClick = useCallback((items: IMenuItem[], key: string | number) => {
    const menuItemClicked: IMenuItem | undefined = items?.find((item) => item.key === key || item.children?.find((child) => child.key === key || child.children?.find((subChild) => subChild.key === key)));
    switch (menuItemClicked?.menuAction) {
      case MenuItemAction.MOVE:
        const child = menuItemClicked?.children?.find((child) => child.key === key || child.children?.find((subChild) => subChild.key === key));
        const subChild = child?.children?.find((subChild) => subChild.key === key);
        let bottom = false;
        let targetIndex = subChild?.title;
        if (subChild?.label.includes("Deck")) {
          targetIndex = undefined;
          if (subChild?.label.includes("(bottom)")) bottom = true;
        }
        subChild?.label.includes("(bottom)")
        dispatch(moveCard({
          id: card.id,
          target: child?.title,
          from: cardTarget,
          targetIndex,
          bottom
        }));
        emitGameEvent({
          type: GAME_EVENT.moveCard, data: {
            id: card.id,
            target: child?.title,
            from: { target: cardTarget, targetIndex: zoneIndex },
            targetIndex,
            bottom
          }
        });
        break;
      case MenuItemAction.VIEW:
        emitGameEvent({ type: side === "p1" ? GAME_EVENT.setP1Viewing : GAME_EVENT.setP2Viewing, data: { cardTarget, limit: null } })
        dispatch(setPileInView({ cardTarget, targetIndex: zoneIndex }));
        closePopover();
        break;
      case MenuItemAction.VIEW_TOP_X:
        const viewXChild = menuItemClicked?.children?.find((child) => child.key === key || child.children?.find((subChild) => subChild.key === key));
        emitGameEvent({ type: side === "p1" ? GAME_EVENT.setP1Viewing : GAME_EVENT.setP2Viewing, data: { cardTarget, limit: viewXChild?.title } })
        dispatch(setPileInView({ cardTarget, targetIndex: zoneIndex, limit: viewXChild?.title }));
        closePopover();
        break;
      case MenuItemAction.VIEW_BOTTOM_X:
        const viewBottomXChild = menuItemClicked?.children?.find((child) => child.key === key || child.children?.find((subChild) => subChild.key === key));
        emitGameEvent({ type: side === "p1" ? GAME_EVENT.setP1Viewing : GAME_EVENT.setP2Viewing, data: { cardTarget, limit: viewBottomXChild?.title, bottom: true } })
        dispatch(setPileInView({ cardTarget, targetIndex: zoneIndex, limit: viewBottomXChild?.title, bottom: true }));
        closePopover();
        break;
      case MenuItemAction.SHUFFLE:
        emitGameEvent({ type: GAME_EVENT.shuffleTargetPile, data: { cardTarget, targetIndex: zoneIndex } });
        closePopover();
        break;
      case MenuItemAction.FLIP:
        dispatch(flipCard({ cardTarget, cardIndex: index, zoneIndex }));
        emitGameEvent(({ type: GAME_EVENT.flipCard, data: { cardTarget, cardIndex: index, zoneIndex } }));
        closePopover();
        break;
      case MenuItemAction.PLUNDER:
        dispatch(openPlunderModal())
        closePopover();
        break;
      default:
        break;
    }
  }, [card, cardTarget, dispatch, index, zoneIndex, side]);

  const newcardMenuItemsFiltered = useMemo(() => {
    const filteredMenuItems = [...newCardMenuItems];
    return filteredMenuItems;
  }, []);

  const legacycardMenuItemsFiltered = useMemo(() => {
    let filteredMenuItems = [...cardMenuItems];
    if (inPileView) filteredMenuItems = filteredMenuItems.filter(item => item.menuAction != MenuItemAction.VIEW);
    if (cardTarget.includes("Deck")) filteredMenuItems = [...filteredMenuItems, ...deckMenuItems];
    return filteredMenuItems;
  }, [inPileView, cardTarget]);

  const faceUp = useMemo(() => {
    if (hidden) return false;
    if (!inPileView && (cardTarget == CARD_TARGET.P1_PLAYER_DECK || cardTarget == CARD_TARGET.P2_PLAYER_DECK)) {
      return false;
    }
    return card.faceUp === undefined ? true : card.faceUp;
  }, [card, hidden, cardTarget, inPileView]);

  const selected = useMemo(() => {
    return selectedCard?.id === card.id;
  }, [selectedCard?.id, card.id]);
  const focused = cardInFocus?.id === card.id;

  const { handleDecreaseCooldown,
    handleIncreaseCooldown,
    handleIncreaseAttackModifier,
    handleDecreaseAttackModifier,
    handleIncreaseOtherModifier,
    handleDecreaseOtherModifier,
    handleCardRightClick,
    handleCardHover,
    handleCardBlur
  } = useHandleCardEvents(card, cardTarget, hidden, inPileView, index, zoneIndex);

  return (
    <CardInner
      card={card}
      selected={selected}
      faceUp={faceUp}
      cardTarget={cardTarget}
      cardMenuItems={legacyMenu ? legacycardMenuItemsFiltered : newcardMenuItemsFiltered}
      isPopoverVisible={isPopoverVisible}
      inPileView={inPileView}
      hidden={hidden}
      focused={focused}
      index={index}
      zoneIndex={zoneIndex}
      handlePopoverVisibleChange={handlePopoverVisibleChange}
      onMenuItemClick={legacyMenu ? legacyonMenuItemClick : newonMenuItemClick}
      handleCardBlur={handleCardBlur}
      handleCardHover={handleCardHover}
      handleCardRightClick={handleCardRightClick}
      handleIncreaseAttackModifier={handleIncreaseAttackModifier}
      handleDecreaseAttackModifier={handleDecreaseAttackModifier}
      handleIncreaseOtherModifier={handleIncreaseOtherModifier}
      handleDecreaseOtherModifier={handleDecreaseOtherModifier}
      handleIncreaseCooldown={handleIncreaseCooldown}
      handleDecreaseCooldown={handleDecreaseCooldown}
    />
  );
}