import IMenuItem, { INewMenuItem } from '@/client/interfaces/IMenuItem';
import { useCallback, useMemo, useState } from 'react';
import { CardState } from "@/shared/interfaces/CardState";
import { CARD_TARGET } from '@/shared/enums/CardTarget';
import { useAppDispatch, useAppSelector } from '@/client/redux/hooks';
import { moveCard, flipCard } from '@/client/redux/gameStateSlice';
import { setPileInView } from '@/client/redux/clientGameStateSlice';
import { GAME_EVENT } from '@/shared/enums/GameEvent';
import { emitGameEvent } from '@/client/utils/emitEvent';
import MenuItemAction from '@/client/enums/MenuItemAction';
import CardInner from './CardInner';
import { openPlunderModal } from '@/client/redux/modalsSlice';
import useHandleCardEvents from '@/client/hooks/useHandleCardEvents';
import { getMenuItemsForCard, getMenuItemsForCardLegacy } from '@/client/utils/cardMenu.utils';
import useMenuItemClick from '@/client/hooks/useMenuItemClick';

interface CardProps {
  card: CardState;
  cardTarget: CARD_TARGET;
  index?: number;
  inPileView?: boolean;
  zoneIndex?: number;
  hidden?: boolean;
}

export default function Card({ card, cardTarget, index, inPileView = false, zoneIndex, hidden = false }: CardProps) {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.gameState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const { legacyMenu } = useAppSelector((state) => state.clientSettings);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const { side, cardInFocus } = clientGameState;
  const { p1SelectedCards, p2SelectedCards } = gameState;
  const p1 = side === "p1";
  const cardPileZone = gameState[cardTarget];

  const {
    handleMove,
    handleShuffle,
    handleView,
    handleConscript,
    handleActivate,
    handleSet,
    handleFlip,
    handleWisdom
  } = useMenuItemClick(card, cardTarget, zoneIndex, index);

  const newonMenuItemClick = useCallback((items: INewMenuItem[], key: string) => {
    const menuItemClicked: INewMenuItem | undefined = items?.find((item) => item.key === key || item.children?.find((child) => child.key === key || child.children?.find((subChild) => subChild.key === key)));
    switch (menuItemClicked?.menuAction) {
      case MenuItemAction.MOVE:
        handleMove(items, key);
        break;
      case MenuItemAction.SHUFFLE:
        handleShuffle();
        closePopover();
        break;
      case MenuItemAction.VIEW:
        handleView();
        closePopover();
        break;
      case MenuItemAction.PLUNDER:
        dispatch(openPlunderModal())
        closePopover();
        break;
      case MenuItemAction.CONSCRIPT:
        handleConscript();
        closePopover();
        break;
      case MenuItemAction.ACTIVATE:
        handleActivate();
        closePopover();
        break;
      case MenuItemAction.SET:
        handleSet();
        closePopover();
        break;
      case MenuItemAction.FLIP:
        handleFlip();
        closePopover();
        break;
      case MenuItemAction.WISDOM:
        handleWisdom();
        closePopover();
        break;
      default:
        break;
    }
  }, [handleMove, handleShuffle, handleView, handleConscript, handleActivate, handleSet, handleFlip, handleWisdom, dispatch]);

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
        emitGameEvent({ type: p1 ? GAME_EVENT.setP1Viewing : GAME_EVENT.setP2Viewing, data: { cardTarget, limit: null } })
        dispatch(setPileInView({ cardTarget, targetIndex: zoneIndex }));
        closePopover();
        break;
      case MenuItemAction.VIEW_TOP_X:
        const viewXChild = menuItemClicked?.children?.find((child) => child.key === key || child.children?.find((subChild) => subChild.key === key));
        emitGameEvent({ type: p1 ? GAME_EVENT.setP1Viewing : GAME_EVENT.setP2Viewing, data: { cardTarget, limit: viewXChild?.title } })
        dispatch(setPileInView({ cardTarget, targetIndex: zoneIndex, limit: viewXChild?.title, pile: cardPileZone }));
        closePopover();
        break;
      case MenuItemAction.VIEW_BOTTOM_X:
        const viewBottomXChild = menuItemClicked?.children?.find((child) => child.key === key || child.children?.find((subChild) => subChild.key === key));
        emitGameEvent({ type: p1 ? GAME_EVENT.setP1Viewing : GAME_EVENT.setP2Viewing, data: { cardTarget, limit: viewBottomXChild?.title, bottom: true } })
        dispatch(setPileInView({ cardTarget, targetIndex: zoneIndex, limit: viewBottomXChild?.title, bottom: true, pile: cardPileZone }));
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
  }, [card, cardTarget, dispatch, index, zoneIndex, p1, cardPileZone]);

  const newcardMenuItemsFiltered = useMemo(() => getMenuItemsForCard(card, cardTarget), [card, cardTarget]);

  const legacycardMenuItemsFiltered = useMemo(() => getMenuItemsForCardLegacy(inPileView, cardTarget), [inPileView, cardTarget]);

  const faceUp = useMemo(() => {
    if (hidden) return false;
    if (!inPileView && (cardTarget == CARD_TARGET.P1_PLAYER_DECK || cardTarget == CARD_TARGET.P2_PLAYER_DECK)) {
      return false;
    }
    return card.faceUp === undefined ? true : card.faceUp;
  }, [card, hidden, cardTarget, inPileView]);

  const isP1Selected = useMemo(() => {
    return p1SelectedCards?.find(c => c.id === card.id) ? true : false;
  }, [p1SelectedCards, card.id]);

  const isP2Selected = useMemo(() => {
    return p2SelectedCards?.find(c => c.id === card.id) ? true : false;
  }, [p2SelectedCards, card.id]);

  const focused = useMemo(() => cardInFocus?.id === card.id, [cardInFocus, card.id]);

  const {
    handleDecreaseCooldown,
    handleIncreaseCooldown,
    handleIncreaseAttackModifier,
    handleDecreaseAttackModifier,
    handleIncreaseOtherModifier,
    handleDecreaseOtherModifier,
    handleCardRightClick,
    handleCardHover,
    handleCardBlur
  } = useHandleCardEvents(card, cardTarget, hidden, inPileView, index, zoneIndex, faceUp, p1);

  const handlePopoverVisibleChange = () => {
    if (hidden) return;
    setIsPopoverVisible(!isPopoverVisible);
  }
  const closePopover = () => {
    setIsPopoverVisible(false);
  }

  return (
    <CardInner
      card={card}
      p1Selected={isP1Selected}
      p2Selected={isP2Selected}
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