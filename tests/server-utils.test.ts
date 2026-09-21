import { describe, expect, it } from "vitest";
import ValidatorService from "../src/server/services/game/ValidatorService";
import { decodeHTMLEntities } from "../src/server/utils/string.utils";

describe("decodeHTMLEntities", () => {
  it("decodes named, decimal, and hexadecimal entities used in imported cards", () => {
    expect(decodeHTMLEntities("A &amp; B &#8217; &#x2014; &#169;")).toBe("A & B ' — ©");
  });

  it("preserves empty input", () => {
    expect(decodeHTMLEntities("")).toBe("");
  });
});

describe("ValidatorService", () => {
  const validator = new ValidatorService();

  it("requires the fields needed to start a game", () => {
    expect(validator.validateJoinGame(undefined as never)).toEqual({ valid: false, error: "No data provided" });
    expect(validator.validateJoinGame({ roomName: "room", playerName: "player", deckId: "deck" })).toEqual({ valid: true });
  });

  it("requires an event type for game and room events", () => {
    expect(validator.validateGameEvent({ type: undefined as never })).toEqual({ valid: false, error: "Event type is required" });
    expect(validator.validateRoomEvent({ type: undefined as never })).toEqual({ valid: false, error: "Event type is required" });
  });
});
