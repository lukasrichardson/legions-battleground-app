import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CardState } from "@/shared/interfaces/CardState";
import { Popover } from "antd";
import back_of_card from "PUBLIC/back_of_card.jpg";
import { MouseEventHandler, useMemo } from "react";
import { useDrag } from 'react-dnd';
import CardMenuComponent from '@/app/components/Card/CardMenu';
import IMenuItem from "@/client/interfaces/IMenuItem";
import { useAppSelector } from "@/client/redux/hooks";
import CardImage from "./CardImage";
import useHandlePlayerEvents from "@/client/hooks/useHandlePlayerEvents";

const PILE_OFFSETS = {
  LEFT: 15,
  TOP: -8,
} as const;

// Custom hook for game state selectors
const useCardGameState = (cardTarget: CARD_TARGET) => {
  const gameState = useAppSelector(state => state.gameState);
  const clientGameState = useAppSelector(state => state.clientGameState);
  const { side } = clientGameState;
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
  handlePopoverVisibleChange: () => void;
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
}: CardInnerProps) {
  const gameState = useCardGameState(cardTarget);
  const clientSettings = useAppSelector(state => state.clientSettings);
  
  const { p1Side, p1Card, playerHealth, playerAP } = gameState;
  const pileOfCard = (zoneIndex || zoneIndex === 0) ? gameState[cardTarget as keyof typeof gameState][zoneIndex] as CardState[] | undefined : gameState[cardTarget as keyof typeof gameState] as CardState[] | undefined;
  const inPileOfMinTwo = pileOfCard && pileOfCard.length >= 2;
 
  
  const rotated = p1Side ? (!p1Card && !inPileView) : (p1Card && !inPileView);

  const { handleHealthDecrease, handleHealthIncrease, handleAPDecrease, handleAPIncrease } = useHandlePlayerEvents(p1Card);

  const imageSrc = useMemo(() => {
    return !faceUp ? back_of_card : card.img;
  }, [faceUp, card.img]);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "card",
    canDrag: !hidden,
    item: { ...card, cardTarget, zoneIndex: zoneIndex },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }), [card, cardTarget, zoneIndex, hidden]);

  const attackModifierExists = card.attackModifier !== undefined && card.attackModifier !== 0;
  const attackModifierNegative = attackModifierExists && (card.attackModifier || 0) < 0;
  const otherModifierExists = card.otherModifier !== undefined && card.otherModifier !== 0;
  // const otherModifierNegative = otherModifierExists && (card.otherModifier || 0) < 0;

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
    "h-[100px]",
    "w-[75px]",
    "card-inner",
    `transform scale-100 transition-transform duration-75 cursor-pointer`,
    cardInView || inPileView
      ? "relative"
      : "absolute",
    inPileOfMinTwo ? "left-0" : "",
    isPlayerHandCard ? "[&:hover]:z-[1000] hover:transform hover:-translate-y-[40%] hover:scale-[1.5]" : "",
  ].join(" "), [cardInView, inPileView, inPileOfMinTwo, isPlayerHandCard]);

  return (
    <Popover
    styles={{
      container: {
        padding: 0,
      }
    }}
      content={<CardMenuComponent items={cardMenuItems} onMenuItemClick={onMenuItemClick} />}
      title={null}
      trigger={clientSettings.hoverMenu ? ["click", "contextMenu", "hover"] : ["click", "contextMenu"]}
      onOpenChange={handlePopoverVisibleChange}
      open={isPopoverVisible && !isDragging}
    >

      {drag(
        <div
          className={cardClasses}
          style={cardStyles}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardBlur}
          onClick={handleCardRightClick}
        >
          {card?.img ? (
            !isDragging && <>
              <CardImage
                src={imageSrc}
                alt={card?.name || "Card Image"}
                className="object-contain transition-transform duration-200 group-hover:scale-[1.03] w-full h-full"
              />
              </>
          ) : <span>{card?.name}</span>}
          {(!cardInView && index === 0 && faceUp) && <>
            <div className={`absolute top-0 right-0 rounded flex items-center justify-between text-white font-bold text-shadow-gray-950 text-shadow-lg w-full ${isOnPlayersSide ? "rotate-0" : "rotate-180"}`}>
              {focused && <span className="cursor-pointer text-xl" onClick={(e) => { e.stopPropagation(); handleDecreaseAttackModifier?.() }}>↓</span>}
              {(attackModifierExists || focused) && <span className=" mx-auto">{attackModifierExists && <span>{attackModifierNegative ? "" : "+"}{card.attackModifier}</span>}atk</span>}
              {focused && <span className="cursor-pointer text-xl" onClick={(e) => { e.stopPropagation(); handleIncreaseAttackModifier?.() }}>↑</span>}
            </div>
            <div className={`absolute bottom-0 left-0 rounded flex items-center justify-between text-white font-bold text-shadow-gray-950 text-shadow-lg w-full ${isOnPlayersSide ? "rotate-0" : "rotate-180"}`}>
              {focused && <span className="cursor-pointer text-xl" onClick={(e) => { e.stopPropagation(); handleDecreaseOtherModifier?.() }}>↓</span>}
              {(otherModifierExists || focused) && <span className="mx-auto">cnt{otherModifierExists && <span>{card.otherModifier}</span>}</span>}
              {focused && <span className="cursor-pointer text-xl" onClick={(e) => { e.stopPropagation(); handleIncreaseOtherModifier?.() }}>↑</span>}
            </div>

          </>}
          {hasCooldown && renderCardAddOn((e) =>{e?.stopPropagation();handleDecreaseCooldown?.()}, (e) => {e?.stopPropagation();handleIncreaseCooldown?.()}, `CD ${card.cooldown}`, false, isOnPlayersSide)}
          {isWarlord && renderCardAddOn(handleHealthDecrease, handleHealthIncrease, `DCM ${p1Card ? playerHealth.p1 : playerHealth.p2}`, true, isOnPlayersSide)}
          {isGuardian && renderCardAddOn(handleAPDecrease, handleAPIncrease, `AP ${p1Card ? playerAP.p1 : playerAP.p2}`, false, isOnPlayersSide)}
        </div>)}
    </Popover>
  )
}

const renderCardAddOn = (handleDecrease, handleIncrease, text, top, isOnPlayersSide) => (
  <div className={`absolute ${top ? "top-0" : "bottom-0"} bg-[#f5f5f576] rounded flex items-center justify-between text-black w-full ${isOnPlayersSide ? "rotate-0" : "rotate-180"}`}>
    {<span className="cursor-pointer" onClick={handleDecrease}>↓</span>}
    <span>{text}</span>
    {<span className="cursor-pointer" onClick={handleIncrease}>↑</span>}
  </div>
)