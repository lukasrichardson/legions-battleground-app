import { describe, expect, it } from "vitest";
import { isPersonalDeckPath } from "@/shared/utils/routeAccess";

describe("deck route access", () => {
  it.each(["/browse", "/browse/deck-123"])("leaves %s public", (path) => {
    expect(isPersonalDeckPath(path)).toBe(false);
  });

  it.each(["/decks", "/decks/my-deck", "/decks/my-deck/settings", "/decks/browse"])("keeps %s protected", (path) => {
    expect(isPersonalDeckPath(path)).toBe(true);
  });
});
