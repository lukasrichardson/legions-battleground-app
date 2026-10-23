import { describe, expect, it } from "vitest";
import { gameViewingLabel, gameZoneLabel } from "../src/client/utils/gameZoneLabel";

describe("player-relative game zone labels", () => {
  it("describes ownership from either side", () => {
    expect(gameZoneLabel("p1PlayerDiscard", "p1")).toBe("Your discard");
    expect(gameZoneLabel("p1PlayerDiscard", "p2")).toBe("Opponent’s discard");
    expect(gameZoneLabel("p2PlayerDeck", "p2")).toBe("Your deck");
    expect(gameZoneLabel("controllerHand", "p2")).toBe("Your hand");
  });
  it("uses human-readable names and one-based columns", () => {
    expect(gameZoneLabel("p1PlayerWarriors", "p1", 0)).toBe("Your warrior zone · column 1");
    expect(gameZoneLabel("p2PlayerVeilRealm", "p1")).toBe("Opponent’s veil / realm");
    expect(gameZoneLabel(undefined, "p1")).toBe("Card pile");
    expect(gameZoneLabel("unknown-internal-target", "p1")).toBe("Card pile");
  });
  it("describes full and limited pile views without internal identifiers", () => {
    expect(gameViewingLabel("p1PlayerDiscard", "p1")).toBe("your discard");
    expect(gameViewingLabel("top 2 of p2PlayerDeck", "p1")).toBe("top 2 of opponent’s deck");
    expect(gameViewingLabel("bottom 3 of p1PlayerDeck", "p1")).toBe("bottom 3 of your deck");
  });
});
