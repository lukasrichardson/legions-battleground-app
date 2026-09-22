import { describe, expect, it } from "vitest";
import { isPersonalDeckPath } from "@/shared/utils/routeAccess";

describe("published deck route access", () => {
  it.each(["/decks/browse", "/decks/browse/deck-123"])("leaves %s public", (path) => {
    expect(isPersonalDeckPath(path)).toBe(false);
  });

  it.each(["/decks", "/decks/my-deck", "/decks/my-deck/settings"])("keeps %s protected", (path) => {
    expect(isPersonalDeckPath(path)).toBe(true);
  });
});
