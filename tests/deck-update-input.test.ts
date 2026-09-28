import { describe, expect, it } from "vitest";
import { DeckUpdateInputError, parseDeckUpdateInput } from "@/server/services/api/DeckValidationService";
import { ObjectId } from "mongodb";

describe("parseDeckUpdateInput", () => {
  it("accepts only editable deck fields", () => {
    expect(parseDeckUpdateInput({ name: "  Updated deck  ", subtitle: "New subtitle" })).toEqual({
      name: "Updated deck",
      subtitle: "New subtitle",
    });
  });

  it.each(["_id", "id", "userId", "created_at", "updated_at", "unknown"]) 
  ("rejects protected or unknown field %s", (field) => {
    expect(() => parseDeckUpdateInput({ [field]: "value" })).toThrow(DeckUpdateInputError);
  });

  it("requires object input and validates card-list fields", () => {
    expect(() => parseDeckUpdateInput([])).toThrow("Request body must be an object");
    expect(() => parseDeckUpdateInput({ cards_in_deck: "not a list" })).toThrow("cards_in_deck must be an array of card IDs");
    expect(() => parseDeckUpdateInput({ cards_in_deck: [{ _id: "card" }] })).toThrow("cards_in_deck must be an array of card IDs");
    expect(() => parseDeckUpdateInput({ cards_in_deck: ["not-an-object-id"] })).toThrow("cards_in_deck contains an invalid card ID");
  });

  it("converts accepted card ID strings to Mongo ObjectIds", () => {
    const id = new ObjectId().toHexString();
    const update = parseDeckUpdateInput({ cards_in_deck: [id], side_deck: [] });
    expect(update.cards_in_deck?.[0]).toBeInstanceOf(ObjectId);
    expect(update.cards_in_deck?.[0].toString()).toBe(id);
  });

  it("accepts special main-deck arrays", () => {
    const id = new ObjectId().toHexString();
    expect(parseDeckUpdateInput({ warlords: [id] }).warlords?.[0].toString()).toBe(id);
  });
});
