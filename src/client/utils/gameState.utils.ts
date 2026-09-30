import {
  changeCardModifierInState,
  flipCardInState,
  moveCardInState,
  type CardMutationTarget,
  type LegacyMoveCardAction,
} from "@/shared/gameStateMutations";
import type { GameStateData } from "@/shared/interfaces/GameState";

type ReduxAction<T> = { payload: T };

const gameState = (state: unknown) => state as GameStateData;
const target = (action: ReduxAction<CardMutationTarget>) => action.payload;

export const setState_reducer = (_state: unknown, action: ReduxAction<GameStateData>) => ({ ...action.payload });

export const moveCard_reducer = (state: unknown, action: ReduxAction<LegacyMoveCardAction>) => {
  moveCardInState(gameState(state), action.payload);
};

export const changeP2Health_reducer = (state: GameStateData, action: ReduxAction<number>) => {
  state.p2PlayerHealth += action.payload;
};

export const changeP1Health_reducer = (state: GameStateData, action: ReduxAction<number>) => {
  state.p1PlayerHealth += action.payload;
};

export const changeP2AP_reducer = (state: GameStateData, action: ReduxAction<number>) => {
  state.p2PlayerAP += action.payload;
};

export const changeP1AP_reducer = (state: GameStateData, action: ReduxAction<number>) => {
  state.p1PlayerAP += action.payload;
};

export const flipCard_reducer = (state: unknown, action: ReduxAction<CardMutationTarget>) => {
  flipCardInState(gameState(state), target(action));
};

const modifierReducer = (modifier: "attackModifier" | "otherModifier" | "cooldown", change: number) =>
  (state: unknown, action: ReduxAction<CardMutationTarget>) => {
    changeCardModifierInState(gameState(state), target(action), modifier, change);
  };

export const increaseAttackModifier_reducer = modifierReducer("attackModifier", 1);
export const decreaseAttackModifier_reducer = modifierReducer("attackModifier", -1);
export const increaseOtherModifier_reducer = modifierReducer("otherModifier", 1);
export const decreaseOtherModifier_reducer = modifierReducer("otherModifier", -1);
export const increaseCooldown_reducer = modifierReducer("cooldown", 1);
export const decreaseCooldown_reducer = modifierReducer("cooldown", -1);
