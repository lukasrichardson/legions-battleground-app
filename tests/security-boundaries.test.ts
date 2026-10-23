import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { requireBanlistAdmin } from "@/server/middleware/banlistAdmin";
import { updateBanlistEntry } from "@/server/services/api/BanlistService";
import { BanlistStatus } from "@/shared/interfaces/BanlistItem.mongo";
import { createInitialGameState } from "@/shared/constants/initialGameState";
import { games } from "@/server/game/game";
import { rooms } from "@/server/network/roomRegistry";

const { getDeckById, resetPlayersCards } = vi.hoisted(() => ({ getDeckById: vi.fn(), resetPlayersCards: vi.fn() }));
vi.mock("@/server/services/api/DecksService", () => ({ getDeckById }));
vi.mock("@/server/utils/game.util", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/server/utils/game.util")>(), resetPlayersCards,
}));
import { GameService } from "@/server/services/game/GameService";

afterEach(() => vi.unstubAllEnvs());

describe("global banlist authorization", () => {
  const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

  it.each([undefined, "", "another-user", "administrator-prefix"])("denies access when the account is not explicitly allowed: %s", (configured) => {
    vi.stubEnv("BANLIST_ADMIN_USER_IDS", configured);
    const res = response();
    const next = vi.fn();
    requireBanlistAdmin({ user: { id: "administrator" }, body: { admin: true } } as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows only an authenticated account ID in the server configuration", () => {
    vi.stubEnv("BANLIST_ADMIN_USER_IDS", " first-user, administrator ");
    const next = vi.fn();
    requireBanlistAdmin({ user: { id: "administrator" } } as never, response() as never, next);
    expect(next).toHaveBeenCalledOnce();
    const res = response();
    requireBanlistAdmin({ body: { userId: "administrator" } } as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it.each([{ $ne: null }, { $regex: ".*" }, ["Card"], " ", "x".repeat(201)])("rejects operator injection and invalid names before database access: %j", async (name) => {
    const db = { collection: vi.fn() };
    await expect(updateBanlistEntry(db as never, name, BanlistStatus.UNRESTRICTED)).rejects.toThrow("name must be");
    expect(db.collection).not.toHaveBeenCalled();
  });
});

describe("sandbox deck replacement authorization", () => {
  const service = new GameService();
  const roomId = "security-reset-test";
  const replacementId = new ObjectId().toString();
  beforeEach(() => {
    vi.clearAllMocks();
    games[roomId] = { ...createInitialGameState(), sandboxMode: true, p1PlayerHealth: 42 };
  });
  afterEach(() => { delete games[roomId]; });

  it("rejects another account's private deck without resetting or broadcasting it", async () => {
    getDeckById.mockResolvedValue(null);
    await expect(service.resetGame(roomId, { p1DeckId: replacementId }, "attacker"))
      .rejects.toThrow("permission");
    expect(getDeckById).toHaveBeenCalledWith({ id: "attacker" }, replacementId);
    expect(games[roomId].p1PlayerHealth).toBe(42);
    expect(resetPlayersCards).not.toHaveBeenCalled();
  });

  it("authorizes both replacements before applying either one", async () => {
    getDeckById.mockResolvedValueOnce({ _id: new ObjectId(replacementId) }).mockResolvedValueOnce(null);
    await expect(service.resetGame(roomId, { p1DeckId: replacementId, p2DeckId: new ObjectId().toString() }, "owner"))
      .rejects.toThrow("permission");
    expect(games[roomId].p1DeckFromServer).toBeFalsy();
    expect(games[roomId].p1PlayerHealth).toBe(42);
  });

  it("accepts an owned replacement and resets with the authorized deck", async () => {
    const deck = { _id: new ObjectId(replacementId), name: "Owned deck" };
    getDeckById.mockResolvedValue(deck);
    await service.resetGame(roomId, { p1DeckId: replacementId }, "owner");
    expect(games[roomId].p1DeckFromServer).toBe(deck);
    expect(resetPlayersCards).toHaveBeenCalledWith(roomId, deck, games[roomId].p2DeckFromServer);
  });

  it("requires server-established identity when choosing a new deck", async () => {
    await expect(service.resetGame(roomId, { p1DeckId: replacementId })).rejects.toThrow("owned deck");
    expect(getDeckById).not.toHaveBeenCalled();
  });

  it("can reset the existing game without reloading any private deck", async () => {
    await service.resetGame(roomId);
    expect(getDeckById).not.toHaveBeenCalled();
    expect(resetPlayersCards).toHaveBeenCalledOnce();
  });
});

it("room and game lookups do not inherit attacker-controlled prototype keys", () => {
  expect(rooms["__proto__"]).toBeUndefined();
  expect(rooms["constructor"]).toBeUndefined();
  expect(games["toString"]).toBeUndefined();
});
