import { describe, expect, it } from "vitest";
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { createInitialGameState } from "@/shared/constants/initialGameState";
import {
  changeCardModifierInState,
  flipCardInState,
  moveCardInState,
  shuffleZoneInState,
} from "@/shared/gameStateMutations";

const card = (id: string, type = CARD_TYPE.WARRIOR) => ({
  id,
  name: id,
  type,
  text: "",
  faceUp: false,
  attackModifier: 0,
  otherModifier: 0,
  cooldown: 0,
});

describe("shared game-state mutations", () => {
  it("moves cards between ordinary zones and applies deck visibility rules", () => {
    const state = createInitialGameState();
    state.p1PlayerHand = [card("hand-card")];

    const moved = moveCardInState(state, {
      id: "hand-card",
      from: { target: CARD_TARGET.P1_PLAYER_HAND, targetIndex: null },
      target: CARD_TARGET.P1_PLAYER_DECK,
      bottom: true,
    });

    expect(moved).toMatchObject({ id: "hand-card", faceUp: true });
    expect(state.p1PlayerHand).toEqual([]);
    expect(state.p1PlayerDeck).toEqual([expect.objectContaining({ id: "hand-card", faceUp: true })]);
  });

  it("moves cards into column zones and keeps fortified cards face down", () => {
    const state = createInitialGameState();
    state.p1PlayerHand = [card("fortified-card", CARD_TYPE.FORTIFIED)];
    state.p1PlayerFortifieds = [[]];

    moveCardInState(state, {
      id: "fortified-card",
      from: { target: CARD_TARGET.P1_PLAYER_HAND, targetIndex: null },
      target: CARD_TARGET.P1_PLAYER_FORTIFIED,
      targetIndex: 0,
    });

    expect(state.p1PlayerFortifieds[0]).toEqual([expect.objectContaining({ id: "fortified-card", faceUp: false })]);
  });

  it("shares card modifier, flip, and shuffle invariants", () => {
    const state = createInitialGameState();
    state.p1PlayerHand = [card("one"), card("two")];
    const target = { cardTarget: CARD_TARGET.P1_PLAYER_HAND, cardIndex: 0 };

    expect(flipCardInState(state, target)).toBe(true);
    expect(changeCardModifierInState(state, target, "attackModifier", 2)).toBe(true);
    changeCardModifierInState(state, target, "cooldown", -1);
    shuffleZoneInState(state, { cardTarget: CARD_TARGET.P1_PLAYER_HAND }, () => 0);

    expect(state.p1PlayerHand.map(({ id }) => id)).toEqual(["two", "one"]);
    expect(state.p1PlayerHand[1]).toMatchObject({ faceUp: true, attackModifier: 2, cooldown: 0 });
  });
});
