import { CardState } from "@/shared/interfaces/CardState";
import { CARD_TARGET } from '@/shared/enums/CardTarget';

export interface CardProps {
  card: CardState;
  cardTarget: CARD_TARGET;
  index?: number;
  inPileView?: boolean;
  zoneIndex?: number;
  hidden?: boolean;
  compactHand?: boolean;
  compactOpponentHand?: boolean;
  /** Explicit touch action; the card itself remains reserved for inspection/menu actions. */
  onSelectForZone?: () => void;
  selectForZoneLabel?: string;
}

export interface CardModifierHandlers {
  handleIncreaseCooldown: () => void;
  handleDecreaseCooldown: () => void;
  handleIncreaseAttackModifier: () => void;
  handleDecreaseAttackModifier: () => void;
  handleIncreaseOtherModifier: () => void;
  handleDecreaseOtherModifier: () => void;
}

export interface CardInteractionHandlers {
  handleCardRightClick: (e: React.MouseEvent) => void;
  handleCardHover: () => void;
  handleCardBlur: () => void;
}
