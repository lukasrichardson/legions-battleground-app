import { describe, expect, it } from "vitest";
import { DeckUpdateInputError, parseDeckUpdateInput } from "@/server/services/api/DeckValidationService";

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
    expect(() => parseDeckUpdateInput({ cards_in_deck: "not a list" })).toThrow("cards_in_deck must be an array of cards");
  });
});
