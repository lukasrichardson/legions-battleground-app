import { MoveCardActionInterface } from "../events/cardEvents";
import { CARD_TARGET } from "@/shared/enums/CardTarget";

export enum Triggers {
  Conscript, Keyword, Unified, Fortified, Bloodbourne, AP
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
  Conscript
}

export interface EffectStep {
  type: StepType,
  selectMin?: number | null, // Minimum number of cards to select
  selectMax?: number | null, // Maximum number of cards to select
  from?: {target: CARD_TARGET, targetIndex: number | null}[], // e.g. "P1_PLAYER_HAND", "P2_PLAYER_DECK", etc.
  to?: {target: CARD_TARGET, targetIndex: number | null}[], // e.g. "P1_PLAYER_DECK", "P2_PLAYER_HAND", etc.
  selected?: MoveCardActionInterface[], // Array of selected cards
  quantity?: string | number, // e.g. "selected", "all", etc.
  waitingForInput?: {p1: boolean, p2: boolean, controller: boolean}, // Indicates if the step is waiting for player input
  random?: boolean
}

export interface SequenceItem {
  name: string,
  cost: EffectStep[],
  effect: EffectStep[],
  type: string, // e.g. "moveCards", "changeHealth", etc.
}

export interface Sequence {
  items: SequenceItem[],
}

export interface SequenceState {
  sequences: Sequence[],
  resolving: boolean,
}