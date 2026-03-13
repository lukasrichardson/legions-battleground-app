import { useCallback, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/client/redux/hooks';
import { moveCard, flipCard } from '@/client/redux/gameStateSlice';
import { setPileInView } from '@/client/redux/clientGameStateSlice';
import { openPlunderModal } from '@/client/redux/modalsSlice';
import IMenuItem, { INewMenuItem } from '@/client/interfaces/IMenuItem';
import { CARD_TARGET } from '@/shared/enums/CardTarget';
import { GAME_EVENT } from '@/shared/enums/GameEvent';
import MenuItemAction from '@/client/enums/MenuItemAction';
import { CardProps, CardModifierHandlers, CardInteractionHandlers } from './Card.types';
import CardInner from './CardInner';
import useHandleCardEvents from '@/client/hooks/useHandleCardEvents';
import useMenuItemClick from '@/client/hooks/useMenuItemClick';
import { emitGameEvent } from '@/client/utils/emitEvent';
import { getMenuItemsForCard, getMenuItemsForCardLegacy } from '@/client/utils/cardMenu.utils';

export default function Card({ 
  card, 
  cardTarget, 
  index, 
  inPileView = false, 
  zoneIndex, 
  hidden = false 
}: CardProps) {
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

  const closePopover = useCallback(() => {
    setIsPopoverVisible(false);
  }, []);

  const handleNewMenuClick = useCallback((items: INewMenuItem[], key: string | number) => {
    const selectedMenuItem: INewMenuItem | undefined = items?.find((item) => 
      item.key === key || item.children?.find((child) => 
        child.key === key || child.children?.find((subChild) => subChild.key === key)
      )
    );
    
    switch (selectedMenuItem?.menuAction) {
      case MenuItemAction.MOVE:
        handleMove(items, String(key));
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
        dispatch(openPlunderModal());
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
  }, [handleMove, handleShuffle, handleView, handleConscript, handleActivate, handleSet, handleFlip, handleWisdom, dispatch, closePopover]);

  const handleLegacyMenuClick = useCallback((items: IMenuItem[], key: string | number) => {
    const selectedMenuItem: IMenuItem | undefined = items?.find((item) => 
      item.key === key || item.children?.find((child) => 
        child.key === key || child.children?.find((subChild) => subChild.key === key)
      )
    );
    
    switch (selectedMenuItem?.menuAction) {
      case MenuItemAction.MOVE:
        const child = selectedMenuItem?.children?.find((child) => 
          child.key === key || child.children?.find((subChild) => subChild.key === key)
        );
        const subChild = child?.children?.find((subChild) => subChild.key === key);
        let bottom = false;
        let targetIndex = subChild?.title;
        
        if (subChild?.label.includes("Deck")) {
          targetIndex = undefined;
          if (subChild?.label.includes("(bottom)")) bottom = true;
        }
        
        dispatch(moveCard({
          id: card.id,
          target: child?.title,
          from: cardTarget,
          targetIndex,
          bottom
        }));
        
        emitGameEvent({
          type: GAME_EVENT.moveCard, 
          data: {
            id: card.id,
            target: child?.title,
            from: { target: cardTarget, targetIndex: zoneIndex },
            targetIndex,
            bottom
          }
        });
        break;
        
      case MenuItemAction.VIEW:
        emitGameEvent({ 
          type: p1 ? GAME_EVENT.setP1Viewing : GAME_EVENT.setP2Viewing, 
          data: { cardTarget, limit: null } 
        });
        dispatch(setPileInView({ cardTarget, targetIndex: zoneIndex }));
        closePopover();
        break;
        
      case MenuItemAction.VIEW_TOP_X:
        const viewXChild = selectedMenuItem?.children?.find((child) => 
          child.key === key || child.children?.find((subChild) => subChild.key === key)
        );
        emitGameEvent({ 
          type: p1 ? GAME_EVENT.setP1Viewing : GAME_EVENT.setP2Viewing, 
          data: { cardTarget, limit: viewXChild?.title } 
        });
        dispatch(setPileInView({ 
          cardTarget, 
          targetIndex: zoneIndex, 
          limit: viewXChild?.title, 
          pile: cardPileZone 
        }));
        closePopover();
        break;
        
      case MenuItemAction.VIEW_BOTTOM_X:
        const viewBottomXChild = selectedMenuItem?.children?.find((child) => 
          child.key === key || child.children?.find((subChild) => subChild.key === key)
        );
        emitGameEvent({ 
          type: p1 ? GAME_EVENT.setP1Viewing : GAME_EVENT.setP2Viewing, 
          data: { cardTarget, limit: viewBottomXChild?.title, bottom: true } 
        });
        dispatch(setPileInView({ 
          cardTarget, 
          targetIndex: zoneIndex, 
          limit: viewBottomXChild?.title, 
          bottom: true, 
          pile: cardPileZone 
        }));
        closePopover();
        break;
        
      case MenuItemAction.SHUFFLE:
        emitGameEvent({ 
          type: GAME_EVENT.shuffleTargetPile, 
          data: { cardTarget, targetIndex: zoneIndex } 
        });
        closePopover();
        break;
        
      case MenuItemAction.FLIP:
        dispatch(flipCard({ cardTarget, cardIndex: index, zoneIndex }));
        emitGameEvent({ 
          type: GAME_EVENT.flipCard, 
          data: { cardTarget, cardIndex: index, zoneIndex } 
        });
        closePopover();
        break;
        
      case MenuItemAction.PLUNDER:
        dispatch(openPlunderModal());
        closePopover();
        break;
        
      default:
        break;
    }
  }, [card, cardTarget, dispatch, index, zoneIndex, p1, cardPileZone, closePopover]);

  const handleMenuClick = useCallback((items: INewMenuItem[] | IMenuItem[], key: string | number) => {
    if (legacyMenu) {
      return handleLegacyMenuClick(items as IMenuItem[], key);
    }
    return handleNewMenuClick(items as INewMenuItem[], key);
  }, [legacyMenu, handleLegacyMenuClick, handleNewMenuClick]);

  const cardMenuItems = useMemo(() => {
    return legacyMenu 
      ? getMenuItemsForCardLegacy(inPileView, cardTarget)
      : getMenuItemsForCard(card, cardTarget, inPileView);
  }, [legacyMenu, inPileView, cardTarget, card]);

  const faceUp = useMemo(() => {
    if (hidden) return false;
    if (!inPileView && (cardTarget == CARD_TARGET.P1_PLAYER_DECK || cardTarget == CARD_TARGET.P2_PLAYER_DECK)) {
      return false;
    }
    return card.faceUp === undefined ? true : card.faceUp;
  }, [card, hidden, cardTarget, inPileView]);

  const isOnPlayerSide = (cardTarget.includes("p1") && p1) || (cardTarget.includes("p2") && !p1);
  const isHidden = hidden || (!isOnPlayerSide && !faceUp);
  const isP1Selected = Boolean(p1SelectedCards?.find(c => c.id === card.id));
  const isP2Selected = Boolean(p2SelectedCards?.find(c => c.id === card.id));
  const focused = cardInFocus?.id === card.id;

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
  } = useHandleCardEvents(card, cardTarget, isHidden, inPileView, index, zoneIndex, faceUp, p1);

  // Group handlers for cleaner props passing
  const modifierHandlers: CardModifierHandlers = {
    handleIncreaseCooldown,
    handleDecreaseCooldown,
    handleIncreaseAttackModifier,
    handleDecreaseAttackModifier,
    handleIncreaseOtherModifier,
    handleDecreaseOtherModifier,
  };

  const interactionHandlers: CardInteractionHandlers = {
    handleCardRightClick,
    handleCardHover,
    handleCardBlur,
  };

  const handlePopoverVisibleChange = () => {
    if (isHidden) return;
    setIsPopoverVisible(!isPopoverVisible);
  };

  return (
    <CardInner
      card={card}
      p1Selected={isP1Selected}
      p2Selected={isP2Selected}
      faceUp={faceUp}
      cardTarget={cardTarget}
      cardMenuItems={cardMenuItems}
      isPopoverVisible={isPopoverVisible}
      inPileView={inPileView}
      hidden={isHidden}
      focused={focused}
      index={index}
      zoneIndex={zoneIndex}
      handlePopoverVisibleChange={handlePopoverVisibleChange}
      onMenuItemClick={handleMenuClick}
      {...interactionHandlers}
      {...modifierHandlers}
    />
  );
}