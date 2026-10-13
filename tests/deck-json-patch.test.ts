import { describe, expect, it } from "vitest";
import { DeckPatchInputError, applyDeckJsonPatch } from "@/server/services/api/DeckPatchService";
import { DeckUpdateInputError, parseDeckUpdateInput } from "@/server/services/api/DeckValidationService";

const deck = {
  name: "Angels",
  subtitle: "",
  legion: "Angels",
  cards_in_deck: ["507f1f77bcf86cd799439011"],
  side_deck: [],
  warlords: [],
  synergies: [],
  veilRealms: [],
  guardians: [],
};

describe("applyDeckJsonPatch", () => {
  it("appends a card to the main deck", () => {
    expect(applyDeckJsonPatch(deck, [{
      op: "add",
      path: "/cards_in_deck/-",
      value: "507f191e810c19729de860ea",
    }])).toEqual({
      ...deck,
      cards_in_deck: ["507f1f77bcf86cd799439011", "507f191e810c19729de860ea"],
    });
  });

  it("removes one card by its array index", () => {
    expect(applyDeckJsonPatch({ ...deck, cards_in_deck: ["a", "b", "a"] }, [{
      op: "remove",
      path: "/cards_in_deck/2",
    }])).toEqual({ ...deck, cards_in_deck: ["a", "b"] });
  });

  it("moves a card between main and side deck in one ordered patch", () => {
    expect(applyDeckJsonPatch({ ...deck, cards_in_deck: ["a", "b", "a"] }, [
      { op: "remove", path: "/cards_in_deck/2" },
      { op: "add", path: "/side_deck/-", value: "a" },
    ])).toEqual({
      ...deck,
      cards_in_deck: ["a", "b"],
      side_deck: ["a"],
    });
  });

  it("removes a side-deck card by its array index", () => {
    expect(applyDeckJsonPatch({ ...deck, side_deck: ["a", "b", "a"] }, [
      { op: "remove", path: "/side_deck/2" },
    ])).toEqual({
      ...deck,
      side_deck: ["a", "b"],
    });
  });

  it("supports the same safe operations for dedicated special-card arrays", () => {
    expect(applyDeckJsonPatch(deck, [{
      op: "add",
      path: "/warlords/-",
      value: "507f191e810c19729de860ea",
    }])).toEqual({ ...deck, warlords: ["507f191e810c19729de860ea"] });
  });

  it("renames a deck and replaces the full list for sorting", () => {
    expect(applyDeckJsonPatch(deck, [
      { op: "replace", path: "/name", value: "Renamed Angels" },
      { op: "replace", path: "/cards_in_deck", value: ["507f191e810c19729de860ea", "507f1f77bcf86cd799439011"] },
    ])).toEqual({
      ...deck,
      name: "Renamed Angels",
      cards_in_deck: ["507f191e810c19729de860ea", "507f1f77bcf86cd799439011"],
    });
  });

  it.each([
    [{ op: "replace", path: "/userId", value: "another-user" }],
    [{ op: "move", path: "/cards_in_deck/0", from: "/cards_in_deck/1" }],
    [{ op: "remove", path: "/cards_in_deck/9" }],
    [{ op: "add", path: "/cards_in_deck/0", value: "card" }],
  ])("rejects unsupported or unsafe patches: %j", (patch) => {
    expect(() => applyDeckJsonPatch(deck, patch)).toThrow(DeckPatchInputError);
  });

  it("continues through the existing deck-input validation pipeline", () => {
    const patched = applyDeckJsonPatch(deck, [{
      op: "add",
      path: "/side_deck/-",
      value: "not-an-object-id",
    }]);

    expect(() => parseDeckUpdateInput(patched)).toThrow(DeckUpdateInputError);
  });
});
