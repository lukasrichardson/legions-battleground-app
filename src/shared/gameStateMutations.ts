import { CARD_TARGET } from "@/shared/enums/CardTarget";
import type { CardState } from "@/shared/interfaces/CardState";
import type { GameStateData } from "@/shared/interfaces/GameState";
import type { CardPosition, MoveCardAction } from "@/shared/interfaces/GameCommands";

type Zone = CardState[] | CardState[][];
type MutableZones = Record<CARD_TARGET, Zone>;

export type LegacyMoveCardAction = Omit<MoveCardAction, "from"> & {
  from: MoveCardAction["from"] | CARD_TARGET;
};

export type CardMutationTarget = {
  cardTarget: CARD_TARGET;
  cardIndex: number;
  zoneIndex?: number;
};

const columnTargets = new Set<CARD_TARGET>([
  CARD_TARGET.P1_PLAYER_FORTIFIED,
  CARD_TARGET.P1_PLAYER_UNIFIED,
  CARD_TARGET.P1_PLAYER_WARRIOR,
  CARD_TARGET.P2_PLAYER_FORTIFIED,
  CARD_TARGET.P2_PLAYER_UNIFIED,
  CARD_TARGET.P2_PLAYER_WARRIOR,
]);

const faceUpTargets = new Set<CARD_TARGET>([
  CARD_TARGET.P1_PLAYER_DECK,
  CARD_TARGET.P1_PLAYER_DISCARD,
  CARD_TARGET.P1_PLAYER_REVEALED,
  CARD_TARGET.P1_PLAYER_HAND,
  CARD_TARGET.P2_PLAYER_DECK,
  CARD_TARGET.P2_PLAYER_DISCARD,
  CARD_TARGET.P2_PLAYER_REVEALED,
  CARD_TARGET.P2_PLAYER_HAND,
]);

const zonesOf = (state: GameStateData): MutableZones => state as unknown as MutableZones;

const positionOf = (from: LegacyMoveCardAction["from"]): CardPosition =>
  typeof from === "string" ? { target: from, targetIndex: null } : from;

const cardAt = (state: GameStateData, { cardTarget, cardIndex, zoneIndex }: CardMutationTarget): CardState | null => {
  const zone = zonesOf(state)[cardTarget];
  if (!zone) return null;
  if (columnTargets.has(cardTarget)) {
    if (zoneIndex === undefined || !Array.isArray(zone[zoneIndex])) return null;
    return (zone[zoneIndex] as CardState[])[cardIndex] ?? null;
  }
  return (zone as CardState[])[cardIndex] ?? null;
};

export function moveCardInState(state: GameStateData, action: LegacyMoveCardAction): CardState | null {
  const from = positionOf(action.from);
  const zones = zonesOf(state);
  const source = zones[from.target];
  const destination = zones[action.target];
  if (!source || !destination) return null;

  let card: CardState | undefined;
  if (columnTargets.has(from.target)) {
    const columnIndex = from.targetIndex;
    if (columnIndex === null || !Array.isArray(source[columnIndex])) return null;
    const column = source[columnIndex] as CardState[];
    const index = column.findIndex((candidate) => candidate.id === action.id);
    if (index < 0) return null;
    [card] = column.splice(index, 1);
  } else {
    const pile = source as CardState[];
    const index = pile.findIndex((candidate) => candidate.id === action.id);
    if (index < 0) return null;
    [card] = pile.splice(index, 1);
  }
  if (!card) return null;

  let movedCard = card;
  if (movedCard.type && String(movedCard.type) === "Fortified" && action.target.includes("Fortified") && from.target.includes("Hand")) {
    movedCard = { ...movedCard, faceUp: false };
  }
  if (faceUpTargets.has(action.target)) movedCard = { ...movedCard, faceUp: true };

  const bottom = [CARD_TARGET.P1_PLAYER_DECK, CARD_TARGET.P2_PLAYER_DECK].includes(action.target)
    ? !Boolean(action.bottom)
    : Boolean(action.bottom);
  if (columnTargets.has(action.target)) {
    if (action.targetIndex === undefined || action.targetIndex === null || !Array.isArray(destination[action.targetIndex])) return null;
    const column = destination[action.targetIndex] as CardState[];
    if (bottom) column.unshift(movedCard);
    else column.push(movedCard);
  } else {
    const pile = destination as CardState[];
    if (action.targetIndex !== undefined && action.targetIndex !== null) pile.splice(action.targetIndex, 0, movedCard);
    else if (bottom) pile.unshift(movedCard);
    else pile.push(movedCard);
  }
  return movedCard;
}

export function flipCardInState(state: GameStateData, target: CardMutationTarget): boolean {
  const card = cardAt(state, target);
  if (!card) return false;
  card.faceUp = !card.faceUp;
  return true;
}

export function changeCardModifierInState(
  state: GameStateData,
  target: CardMutationTarget,
  modifier: "attackModifier" | "otherModifier" | "cooldown",
  change: number,
): boolean {
  const card = cardAt(state, target);
  if (!card) return false;
  const current = card[modifier] ?? 0;
  card[modifier] = modifier === "cooldown" ? Math.max(0, current + change) : current + change;
  return true;
}

export function shuffleZoneInState(state: GameStateData, target: { cardTarget: CARD_TARGET; targetIndex?: number }, random = Math.random): boolean {
  const zone = zonesOf(state)[target.cardTarget];
  if (!zone) return false;
  const pile = columnTargets.has(target.cardTarget)
    ? target.targetIndex === undefined ? null : zone[target.targetIndex] as CardState[]
    : zone as CardState[];
  if (!pile) return false;
  for (let index = pile.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [pile[index], pile[swapIndex]] = [pile[swapIndex], pile[index]];
  }
  return true;
}
