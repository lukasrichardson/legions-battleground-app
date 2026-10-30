import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CardState } from "@/shared/interfaces/CardState";
import { Popover } from "antd";
import back_of_card from "PUBLIC/back_of_card.jpg";
import { FocusEvent, MouseEvent, MouseEventHandler, useEffect, useMemo, useState } from "react";
import { useDrag } from 'react-dnd';
import CardMenuComponent from '@/app/components/Card/CardMenu';
import IMenuItem from "@/client/interfaces/IMenuItem";
import { useAppSelector } from "@/client/redux/hooks";
import CardImage from "./CardImage";
import useHandlePlayerEvents from "@/client/hooks/useHandlePlayerEvents";
import { decodeHTMLEntities } from "@/client/utils/string.util";
import useIsMobile from "@/client/hooks/useIsMobile";
import MobileGameCardDialog from "./MobileGameCardDialog";

const PILE_OFFSETS = {
  LEFT: 15,
  TOP: -8,
} as const;

// Custom hook for game state selectors
const useCardGameState = (cardTarget: CARD_TARGET) => {
  const gameState = useAppSelector(state => state.gameState);
  const clientGameState = useAppSelector(state => state.clientGameState);
  const { side, cardForSelectingZone } = clientGameState;
  const { p1PlayerHealth, p2PlayerHealth, p1PlayerAP, p2PlayerAP } = gameState;
  const p1Card = cardTarget.includes("p1");
  return {
    ...gameState,
    p1Card,
    p1Side: side === "p1",
    playerHealth: {
      p1: p1PlayerHealth,
      p2: p2PlayerHealth,
    },
    playerAP: {
      p1: p1PlayerAP,
      p2: p2PlayerAP,
    },
    cardForSelectingZone
  };
};

interface CardInnerProps {
  card: CardState;
  faceUp: boolean;
  cardTarget: CARD_TARGET;
  cardMenuItems: IMenuItem[];
  isPopoverVisible: boolean;
  inPileView?: boolean;
  focused?: boolean;
  hidden?: boolean;
  index?: number;
  zoneIndex?: number;
  p1Selected?: boolean;
  p2Selected?: boolean;
  handlePopoverVisibleChange: (open: boolean) => void;
  onMenuItemClick?: (items: IMenuItem[], key: string | number) => void;
  handleCardHover?: () => void;
  handleCardBlur?: () => void;
  handleCardRightClick?: MouseEventHandler<HTMLDivElement>;
  handleIncreaseAttackModifier?: () => void;
  handleDecreaseAttackModifier?: () => void;
  handleIncreaseOtherModifier?: () => void;
  handleDecreaseOtherModifier?: () => void;
  handleIncreaseCooldown?: () => void;
  handleDecreaseCooldown?: () => void;
  handleHealthDecrease?: () => void;
  handleHealthIncrease?: () => void;
  handleAPDecrease?: () => void;
  handleAPIncrease?: () => void;
  compactHand?: boolean;
  compactOpponentHand?: boolean;
  interactionEnabled?: boolean;
  primaryActionKey?: string | number;
  onSelectForZone?: () => void;
  selectForZoneLabel?: string;
}

export default function CardInner({
  card,
  faceUp,
  cardTarget,
  cardMenuItems,
  isPopoverVisible,
  inPileView = false,
  hidden = false,
  focused,
  index,
  zoneIndex,
  p1Selected,
  p2Selected,
  handlePopoverVisibleChange,
  onMenuItemClick,
  handleCardHover,
  handleCardBlur,
  handleCardRightClick,
  handleIncreaseAttackModifier,
  handleDecreaseAttackModifier,
  handleIncreaseOtherModifier,
  handleDecreaseOtherModifier,
  handleIncreaseCooldown,
  handleDecreaseCooldown,
  compactHand = false,
  compactOpponentHand = false,
  interactionEnabled = true,
  primaryActionKey,
  onSelectForZone,
  selectForZoneLabel,
}: CardInnerProps) {
  const isCompact = useIsMobile(1101);
  const canInteract = interactionEnabled && !hidden;
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const gameState = useCardGameState(cardTarget);
  const clientSettings = useAppSelector(state => state.clientSettings);

  const { p1Side, p1Card, playerHealth, playerAP, cardForSelectingZone } = gameState;
  const pileOfCard = (zoneIndex || zoneIndex === 0) ? gameState[cardTarget as keyof typeof gameState][zoneIndex] as CardState[] | undefined : gameState[cardTarget as keyof typeof gameState] as CardState[] | undefined;
  const inPileOfMinTwo = pileOfCard && pileOfCard.length >= 2;
  const isBeingPlayed = cardForSelectingZone && cardForSelectingZone.id === card.id;


  const rotated = p1Side ? (!p1Card && !inPileView) : (p1Card && !inPileView);

  const { handleHealthDecrease, handleHealthIncrease, handleAPDecrease, handleAPIncrease } = useHandlePlayerEvents(p1Card);

  const imageSrc = useMemo(() => {
    return !faceUp ? back_of_card : card.img;
  }, [faceUp, card.img]);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "card",
    canDrag: canInteract,
    item: { ...card, cardTarget, zoneIndex: zoneIndex },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }), [card, cardTarget, zoneIndex, canInteract]);

  const cardVisibilitySettings = useMemo(() => ({
    cardInView: ![
      CARD_TARGET.P1_PLAYER_WARRIOR,
      CARD_TARGET.P2_PLAYER_WARRIOR,
      CARD_TARGET.P1_PLAYER_UNIFIED,
      CARD_TARGET.P2_PLAYER_UNIFIED,
      CARD_TARGET.P1_PLAYER_FORTIFIED,
      CARD_TARGET.P2_PLAYER_FORTIFIED,
      CARD_TARGET.P1_PLAYER_REVEALED,
      CARD_TARGET.P2_PLAYER_REVEALED
    ].includes(cardTarget),
    hasCooldown: cardTarget.includes("VeilRealm") ||
      cardTarget.includes("Warlord") ||
      cardTarget.includes("Synergy")
  }), [cardTarget]);

  const { cardInView, hasCooldown } = cardVisibilitySettings;
  const isOnPlayersSide = (p1Side && cardTarget.includes("p1")) || (!p1Side && cardTarget.includes("p2"));
  const isPlayerHandCard = (p1Side && cardTarget === CARD_TARGET.P1_PLAYER_HAND) || (!p1Side && cardTarget === CARD_TARGET.P2_PLAYER_HAND);

  const isWarlord = useMemo(() => {
    return cardTarget === CARD_TARGET.P1_PLAYER_WARLORD || cardTarget === CARD_TARGET.P2_PLAYER_WARLORD;
  }, [cardTarget]);
  const isGuardian = useMemo(() => {
    return cardTarget === CARD_TARGET.P1_PLAYER_GUARDIAN || cardTarget === CARD_TARGET.P2_PLAYER_GUARDIAN;
  }, [cardTarget]);

  const cardStyles = useMemo(() => {
    const baseStyle = {
      borderTop: (p1Selected && p2Selected) ? "thick green dashed" : p1Selected ? "thick green dashed" : p2Selected ? "thick red dashed" : "",
      borderRight: (p1Selected && p2Selected) ? "thick green dashed" : p1Selected ? "thick green dashed" : p2Selected ? "thick red dashed" : "",
      borderBottom: (p1Selected && p2Selected) ? "thick red dashed" : p1Selected ? "thick green dashed" : p2Selected ? "thick red dashed" : "",
      borderLeft: (p1Selected && p2Selected) ? "thick red dashed" : p1Selected ? "thick green dashed" : p2Selected ? "thick red dashed" : "",
      boxSizing: "content-box" as const,
      scale: rotated ? -1 : 1,
      ['--index' as string]: index,
    };
    if (!inPileView && !cardInView && typeof index === 'number') {
      return {
        ...baseStyle,
        marginLeft: `calc(${index} * ${PILE_OFFSETS.LEFT}px)`,
        marginTop: `calc(${index} * ${PILE_OFFSETS.TOP}px)`,
      };
    }
    return { ...baseStyle, marginLeft: 0, marginTop: 0 };
  }, [rotated, inPileView, cardInView, index, p1Selected, p2Selected]);

  const cardClasses = useMemo(() => [
    !inPileView ? "h-[100px]" : "h-[80px]",
    !inPileView ? "w-[75px]" : "w-[60px]",
    "card-inner",
    `group transform scale-100 transition-[transform,opacity] duration-150`,
    canInteract ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200" : "",
    cardInView || inPileView
      ? "relative"
      : "absolute",
    inPileOfMinTwo ? "left-0" : "",
    compactOpponentHand ? "bottom-0" : "",
    isPlayerHandCard ? (compactHand ? "[&:hover]:z-[1000] hover:transform hover:-translate-y-[40%]" : "[&:hover]:z-[1000] hover:transform hover:-translate-y-[40%] hover:scale-[1.5]") : "",
    isBeingPlayed ? "border-yellow-400 border-4 animate-bounce duration-800" : "",
    isDragging ? "opacity-45 grayscale-[35%]" : "",
  ].join(" "), [cardInView, inPileView, inPileOfMinTwo, isPlayerHandCard, isBeingPlayed, compactHand, compactOpponentHand, isDragging, canInteract]);

  const isDeck = !inPileView && (cardTarget === CARD_TARGET.P1_PLAYER_DECK || cardTarget === CARD_TARGET.P2_PLAYER_DECK);
  const dialogCard = !hidden && !isDeck ? card : { ...card, name: isDeck ? "Deck" : "Face-down card", img: back_of_card.src, text: "" };
  const interactionLabel = isDeck ? "Open deck actions" : `Inspect ${decodeHTMLEntities(dialogCard.name || "card")}`;
  const handleFocusWithin = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    handleCardHover?.();
  };
  const handleBlurWithin = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    handleCardBlur?.();
  };
  const compactActions = <>
    {onSelectForZone && <button type="button" aria-label={selectForZoneLabel} onClick={onSelectForZone} className="mb-2 min-h-11 w-full border border-yellow-200/50 bg-yellow-300/15 px-3 font-semibold text-yellow-100 touch-feedback">Play card</button>}
    <CardMenuComponent items={cardMenuItems} onMenuItemClick={onMenuItemClick} inline primaryItemKey={primaryActionKey} />
    {!hidden && <>
      {!cardInView && index === 0 && faceUp && <>
        <CounterControl label="Attack modifier" value={card.attackModifier ?? 0} decrease={handleDecreaseAttackModifier} increase={handleIncreaseAttackModifier} />
        <CounterControl label="Counter" value={card.otherModifier ?? 0} decrease={handleDecreaseOtherModifier} increase={handleIncreaseOtherModifier} />
      </>}
      {hasCooldown && <CounterControl label="Cooldown" value={card.cooldown ?? 0} decrease={handleDecreaseCooldown} increase={handleIncreaseCooldown} />}
      {isWarlord && <CounterControl label="DCM" value={p1Card ? playerHealth.p1 : playerHealth.p2} decrease={handleHealthDecrease} increase={handleHealthIncrease} />}
      {isGuardian && <CounterControl label="AP" value={p1Card ? playerAP.p1 : playerAP.p2} decrease={handleAPDecrease} increase={handleAPIncrease} />}
    </>}
  </>;

  return (
    <>
    <Popover
      classNames={{ root: "game-card-menu" }}
      getPopupContainer={() => document.body}
      zIndex={1100}
      arrow={false}
      align={{ offset: [0, 0], overflow: { adjustX: true, adjustY: true, shiftX: true, shiftY: true } }}
      styles={{
        container: {
          padding: 0,
        }
      }}
      content={<div className="game-card-menu-content max-h-[calc(100dvh-24px)] overflow-y-auto">
        <CardMenuComponent items={cardMenuItems} onMenuItemClick={onMenuItemClick} />
        {!hidden && <div className="hidden max-[1100px]:block">
          {!cardInView && index === 0 && faceUp && <>
            <CounterControl label="Attack modifier" value={card.attackModifier ?? 0} decrease={handleDecreaseAttackModifier} increase={handleIncreaseAttackModifier} />
            <CounterControl label="Counter" value={card.otherModifier ?? 0} decrease={handleDecreaseOtherModifier} increase={handleIncreaseOtherModifier} />
          </>}
          {hasCooldown && <CounterControl label="Cooldown" value={card.cooldown ?? 0} decrease={handleDecreaseCooldown} increase={handleIncreaseCooldown} />}
          {isWarlord && <CounterControl label="DCM" value={p1Card ? playerHealth.p1 : playerHealth.p2} decrease={handleHealthDecrease} increase={handleHealthIncrease} />}
          {isGuardian && <CounterControl label="AP" value={p1Card ? playerAP.p1 : playerAP.p2} decrease={handleAPDecrease} increase={handleAPIncrease} />}
        </div>}
      </div>}
      title={null}
      trigger={isCompact || !canInteract ? [] : canHover && clientSettings.hoverMenu && !inPileView ? ["click", "contextMenu", "hover"] : ["click", "contextMenu"]}
      onOpenChange={handlePopoverVisibleChange}
      open={canInteract && !isCompact && isPopoverVisible && !isDragging && !cardForSelectingZone}
      mouseEnterDelay={0.2}
      mouseLeaveDelay={0.1}
    >

      <div
          data-opponent-hand={compactOpponentHand || undefined}
          ref={(node) => { drag(canInteract ? node : null); }}
          className={cardClasses}
          style={cardStyles}
          onMouseEnter={canInteract ? handleCardHover : undefined}
          onMouseLeave={canInteract ? handleCardBlur : undefined}
          onFocus={canInteract ? handleFocusWithin : undefined}
          onBlur={canInteract ? handleBlurWithin : undefined}
          onClick={canInteract ? (event) => {
            handleCardRightClick?.(event);
            if (isCompact) handlePopoverVisibleChange(true);
          } : undefined}
        >
          {canInteract ? <button
            type="button"
            aria-label={interactionLabel}
            aria-haspopup={isCompact ? "dialog" : "menu"}
            aria-expanded={isPopoverVisible}
            className="relative block h-full w-full overflow-hidden border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
          >
            {card?.img ? (
              <CardImage
                src={imageSrc}
                alt={card?.name ? decodeHTMLEntities(card.name) : "Card Image"}
                className="object-contain transition-transform duration-200 group-hover:scale-[1.03] w-full h-full"
              />
            ) : <span>{card?.name ? decodeHTMLEntities(card.name) : ''}</span>}
          </button> : <div className="relative h-full w-full overflow-hidden">
            {card?.img ? (
              <CardImage
                src={imageSrc}
                alt={card?.name ? decodeHTMLEntities(card.name) : "Card Image"}
                className="object-contain transition-transform duration-200 group-hover:scale-[1.03] w-full h-full"
              />
            ) : <span>{card?.name ? decodeHTMLEntities(card.name) : ''}</span>}
          </div>}
          {!isDragging && (
            <>{(!cardInView && index === 0 && faceUp) && (
              <>
                <CardCounterOverlay label="Attack modifier" shortLabel="ATK" value={card.attackModifier ?? 0} top expanded={canInteract && Boolean(focused)} decrease={handleDecreaseAttackModifier} increase={handleIncreaseAttackModifier} flipped={!isOnPlayersSide} signed />
                <CardCounterOverlay label="Counter" shortLabel="CNT" value={card.otherModifier ?? 0} expanded={canInteract && Boolean(focused)} decrease={handleDecreaseOtherModifier} increase={handleIncreaseOtherModifier} flipped={!isOnPlayersSide} />
              </>
            )}
              {hasCooldown && <CardCounterOverlay label="Cooldown" shortLabel="CD" value={card.cooldown ?? 0} expanded={canInteract && Boolean(focused)} decrease={handleDecreaseCooldown} increase={handleIncreaseCooldown} flipped={!isOnPlayersSide} />}
              {isWarlord && <CardCounterOverlay label="DCM" shortLabel="DCM" value={p1Card ? playerHealth.p1 : playerHealth.p2} top expanded={canInteract && Boolean(focused)} decrease={handleHealthDecrease} increase={handleHealthIncrease} flipped={!isOnPlayersSide} />}
              {isGuardian && <CardCounterOverlay label="AP" shortLabel="AP" value={p1Card ? playerAP.p1 : playerAP.p2} expanded={canInteract && Boolean(focused)} decrease={handleAPDecrease} increase={handleAPIncrease} flipped={!isOnPlayersSide} />}
            </>)}
        </div>
    </Popover>
    {canInteract && isCompact && isPopoverVisible && !isDragging && !cardForSelectingZone && (
      <MobileGameCardDialog card={dialogCard} title={dialogCard.name || "Card"} onClose={() => handlePopoverVisibleChange(false)}>
        {compactActions}
      </MobileGameCardDialog>
    )}
    </>
  )
}

function CardCounterOverlay({ label, shortLabel, value, top = false, expanded, flipped, signed = false, decrease, increase }: {
  label: string;
  shortLabel: string;
  value: number;
  top?: boolean;
  expanded: boolean;
  flipped: boolean;
  signed?: boolean;
  decrease?: MouseEventHandler<HTMLButtonElement>;
  increase?: MouseEventHandler<HTMLButtonElement>;
}) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>, action?: MouseEventHandler<HTMLButtonElement>) => {
    event.stopPropagation();
    action?.(event);
  };
  const visibleValue = signed && value > 0 ? `+${value}` : value;
  return <div
    className={`absolute ${top ? "top-0" : "bottom-0"} left-1/2 z-20 hidden -translate-x-1/2 items-center overflow-hidden rounded-md border border-white/25 bg-slate-950/90 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm min-[1101px]:flex ${flipped ? "rotate-180" : ""}`}
    aria-label={`${label}: ${value}`}
    onClick={(event) => event.stopPropagation()}
  >
    {expanded && <button type="button" aria-label={`Decrease ${label}`} className="flex size-7 items-center justify-center bg-white/5 text-base hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-cyan-300" onClick={(event) => handleClick(event, decrease)}>−</button>}
    <span className="min-w-10 px-1.5 py-1 text-center">{shortLabel} {visibleValue}</span>
    {expanded && <button type="button" aria-label={`Increase ${label}`} className="flex size-7 items-center justify-center bg-white/5 text-base hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-cyan-300" onClick={(event) => handleClick(event, increase)}>+</button>}
  </div>;
}

function CounterControl({ label, value, decrease, increase }: { label: string; value: number; decrease?: MouseEventHandler<HTMLButtonElement>; increase?: MouseEventHandler<HTMLButtonElement> }) {
  return <div className="flex items-center justify-between gap-2 border-t border-white/15 px-2 text-sm" onClick={(event) => event.stopPropagation()}>
    <button type="button" aria-label={`Decrease ${label}`} className="size-11 shrink-0" onClick={decrease}>−</button>
    <span>{label}: {value}</span>
    <button type="button" aria-label={`Increase ${label}`} className="size-11 shrink-0" onClick={increase}>+</button>
  </div>;
}
