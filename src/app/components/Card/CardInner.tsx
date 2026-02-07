import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CardInterface } from "@/client/interfaces/CardInterface";
import { Popover } from "antd";
import Image from 'next/image';
import back_of_card from "PUBLIC/back_of_card.jpg";
import { MouseEventHandler, useMemo, useState, useEffect } from "react";
import { useDrag } from 'react-dnd';
import CardMenuComponent from '@/app/components/Card/CardMenu';
import IMenuItem from "@/client/interfaces/IMenuItem";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { GAME_EVENT } from "@/client/enums/GameEvent";
import { changeP1AP, changeP1Health, changeP2AP, changeP2Health } from "@/client/redux/gameStateSlice";
import { emitGameEvent } from "@/client/utils/emitEvent";

interface CardInnerProps {
  card: CardInterface;
  selected: boolean;
  faceUp: boolean;
  cardTarget: CARD_TARGET;
  cardMenuItems: IMenuItem[];
  isPopoverVisible: boolean;
  inPileView?: boolean;
  focused?: boolean;
  hidden?: boolean;
  index?: number;
  zoneIndex?: number;
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
}

export default function CardInner({
  card,
  selected,
  faceUp,
  cardTarget,
  cardMenuItems,
  isPopoverVisible,
  inPileView = false,
  hidden = false,
  focused,
  index,
  zoneIndex,
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
  const gameState = useAppSelector((state) => state.gameState);
  const dispatch = useAppDispatch();

  const { side } = gameState;
  const p1Side = side === "p1";
  const p1Card = cardTarget.includes("p1");
  const pileOfCard = (zoneIndex || zoneIndex === 0 ) ? gameState.game[cardTarget as keyof typeof gameState.game][zoneIndex] as CardInterface[] | undefined : gameState.game[cardTarget as keyof typeof gameState.game] as CardInterface[] | undefined;
  const inPileOfMinTwo = pileOfCard && pileOfCard.length >=2;
  const {
    p2PlayerHealth,
    p1PlayerHealth,
    p2PlayerAP,
    p1PlayerAP
  } = gameState.game;
  const healthGameEvent = p1Card ? GAME_EVENT.changeP1Health : GAME_EVENT.changeP2Health;
  const apGameEvent = p1Card ? GAME_EVENT.changeP1AP : GAME_EVENT.changeP2AP;
  /* eslint-disable */
  const healthGameFunction: Function = p1Card ? changeP1Health : changeP2Health;
  const apGameFunction: Function = p1Card ? changeP1AP : changeP2AP;
  /* eslint-enable */
  const rotated = p1Side ? (!p1Card && !inPileView) : (p1Card && !inPileView);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Reset loading state when image source changes
  const imageSrc = !faceUp ? back_of_card : card.img;
  useEffect(() => {
    setImageLoaded(false);
  }, [imageSrc]);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "card",
    canDrag: !hidden,
    item: { ...card, cardTarget, zoneIndex: zoneIndex},
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }), [card]);

  const attackModifierExists = card.attackModifier !== undefined && card.attackModifier !== 0;
  const attackModiferNegative = attackModifierExists && (card.attackModifier || 0) < 0;
  const otherModifierExists = card.otherModifier !== undefined && card.otherModifier !== 0;
  // const otherModifierNegative = otherModifierExists && (card.otherModifier || 0) < 0;
  const cooldownExists = card.cooldown != null;

  const cardInView = useMemo(() => {
    if (cardTarget === CARD_TARGET.P1_PLAYER_WARRIOR ||
      cardTarget === CARD_TARGET.P2_PLAYER_WARRIOR ||
      cardTarget === CARD_TARGET.P1_PLAYER_UNIFIED ||
      cardTarget === CARD_TARGET.P2_PLAYER_UNIFIED ||
      cardTarget === CARD_TARGET.P1_PLAYER_FORTIFIED ||
      cardTarget === CARD_TARGET.P2_PLAYER_FORTIFIED ||
      cardTarget === CARD_TARGET.P1_PLAYER_REVEALED ||
      cardTarget === CARD_TARGET.P2_PLAYER_REVEALED
      ) {
      return false;
    }
    return true;
  }, [cardTarget]);

  const hasCooldown = useMemo(() => {
    if (
      cardTarget.includes("VeilRealm") ||
      cardTarget.includes("Warlord") ||
      cardTarget.includes("Synergy")
      ) return true;
    return false;
  }, [cardTarget]);

  const playerHand = (p1Side && cardTarget === CARD_TARGET.P1_PLAYER_HAND) || (!p1Side && cardTarget === CARD_TARGET.P2_PLAYER_HAND);
  const isWarlord = useMemo(() => {
    return cardTarget === CARD_TARGET.P1_PLAYER_WARLORD || cardTarget === CARD_TARGET.P2_PLAYER_WARLORD;
  }, [cardTarget]);
  const isGuardian = useMemo(() => {
    return cardTarget === CARD_TARGET.P1_PLAYER_GUARDIAN || cardTarget === CARD_TARGET.P2_PLAYER_GUARDIAN;
  }, [cardTarget]);
  return (
    <Popover
      content={<CardMenuComponent items={cardMenuItems} onMenuItemClick={onMenuItemClick} />}
      title={null}
      trigger={["click", "contextMenu", "hover"]}
      onOpenChange={handlePopoverVisibleChange}
      open={isPopoverVisible && !isDragging}
    >

      {drag(
      <div
        className={[
          "card-inner",
          cardInView || inPileView
            ? "transform scale-100 transition-transform duration-75 h-[100px] w-[75px] relative cursor-pointer"
            : "transform scale-100 transition-transform duration-75 h-[100px] w-[75px] absolute cursor-pointer",
            inPileOfMinTwo ? "left-0" : "",
          playerHand ? "[&:hover]:z-[1000] hover:transform hover:-translate-y-[40%] hover:scale-[1.5]" : "",
        ].join(" ")}
        style={{ border: selected ? "thick blue dashed" : "none", boxSizing: "content-box", scale: rotated ? -1 : 1, ['--index' as string]: index, marginLeft: (!inPileView && !cardInView) ? `calc(${index} * 15px)` : 0, marginTop: (!inPileView && !cardInView) ? `calc(${index} * -8px)` : 0 }}
        onMouseEnter={handleCardHover}
        onMouseLeave={handleCardBlur}
        onClick={handleCardRightClick}
      >
        {card?.img ? (
          !isDragging && <>
            {!imageLoaded && (
              <div className="card-image-loading w-full h-full rounded" />
            )}
            <Image
              style={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative',
                display: imageLoaded ? 'block' : 'none'
              }}
              src={imageSrc}
              alt="image"
              height={108}
              width={81}
              unoptimized
              loading="eager"
              priority
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)} // Show even if image fails to load
            /></>
        ) : <span>{card?.name}</span>}
        {(!cardInView && index === 0 && faceUp) && <>
        <div className="absolute top-0 right-0 rounded flex items-center justify-between text-white font-bold text-shadow-gray-950 text-shadow-lg w-full">
          {focused && <span className="cursor-pointer text-xl" onClick={(e) => {e.stopPropagation(); handleDecreaseAttackModifier?.()}}>↓</span>}
          {(attackModifierExists || focused) && <span className=" mx-auto">{attackModifierExists &&<span>{attackModiferNegative ? "" : "+"}{card.attackModifier}</span>}atk</span>}
          {focused && <span className="cursor-pointer text-xl" onClick={(e) => {e.stopPropagation(); handleIncreaseAttackModifier?.()}}>↑</span>}
        </div>
        <div className="absolute bottom-0 left-0 rounded flex items-center justify-between  text-white font-bold text-shadow-gray-950 text-shadow-lg w-full">
          {focused && <span className="cursor-pointer text-xl" onClick={(e) => {e.stopPropagation(); handleDecreaseOtherModifier?.()}}>↓</span>}
          {(otherModifierExists || focused) && <span className="mx-auto">cnt{otherModifierExists &&<span>{card.otherModifier}</span>}</span>}
          {focused && <span className="cursor-pointer text-xl" onClick={(e) => {e.stopPropagation(); handleIncreaseOtherModifier?.()}}>↑</span>}
        </div>
        </>}
        {hasCooldown && <div className="absolute bottom-0 bg-[#f5f5f5] rounded flex items-center justify-center text-black w-full">
          {<span className="cursor-pointer" onClick={(e) => {e.stopPropagation(); handleDecreaseCooldown?.();}}>↓</span>}
          {cooldownExists &&<span>{"CD "}{card.cooldown}</span>}
          {<span className="cursor-pointer" onClick={(e) => {e.stopPropagation(); handleIncreaseCooldown?.();}}>↑</span>}
        </div>}
        {isWarlord && <div className="absolute top-0 bg-[#f5f5f5] rounded flex items-center justify-center text-black w-full">
          {<span className="cursor-pointer" onClick={(e) => {dispatch(healthGameFunction(-1));emitGameEvent({ type: healthGameEvent, data: -1 }); e.stopPropagation();}}>↓</span>}
          <span>{"DCM "}{p1Card ? p1PlayerHealth : p2PlayerHealth}</span>
          {<span className="cursor-pointer" onClick={(e) => {dispatch(healthGameFunction(1));emitGameEvent({ type: healthGameEvent, data: 1 }); e.stopPropagation();}}>↑</span>}
        </div>}
        {isGuardian && <div className="absolute bottom-0 bg-[#f5f5f5] rounded flex items-center justify-center text-black w-full">
          {<span className="cursor-pointer" onClick={(e) => {dispatch(apGameFunction(-5));emitGameEvent({ type: apGameEvent, data: -5 }); e.stopPropagation();}}>↓</span>}
          <span>{"AP "}{p1Card ? p1PlayerAP : p2PlayerAP}</span>
          {<span className="cursor-pointer" onClick={(e) => {dispatch(apGameFunction(5));emitGameEvent({ type: apGameEvent, data: 5 }); e.stopPropagation();}}>↑</span>}
        </div>}
      </div>)}
    </Popover>
  )
}