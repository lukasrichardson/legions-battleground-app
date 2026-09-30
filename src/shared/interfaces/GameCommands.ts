import { CARD_TARGET } from "@/shared/enums/CardTarget";

export interface CardPosition {
  target: CARD_TARGET;
  targetIndex: number | null;
}

export interface MoveCardAction {
  id: string;
  from: CardPosition;
  target: CARD_TARGET;
  targetIndex?: number | null;
  keywords?: string[];
  bottom?: boolean;
}

export enum Triggers {
  Conscript,
  Keyword,
  Unified,
  Fortified,
  Bloodbourne,
  AP,
}

export enum StepType {
  ChooseCards,
  MoveCard,
  ChangeHealth,
  ChangeAP,
  DrawCard,
  SelectCard,
  Shuffle,
  None,
  Conscript,
}

export interface EffectStep {
  type: StepType;
  selectMin?: number | null;
  selectMax?: number | null;
  from?: CardPosition[];
  to?: CardPosition[];
  selected?: MoveCardAction[];
  quantity?: string | number;
  waitingForInput?: { p1: boolean; p2: boolean; controller: boolean };
  random?: boolean;
}

export interface SequenceItem {
  name: string;
  cost: EffectStep[];
  effect: EffectStep[];
  type: string;
}

export interface Sequence {
  items: SequenceItem[];
}

export interface SequenceState {
  sequences: Sequence[];
  resolving: boolean;
}
