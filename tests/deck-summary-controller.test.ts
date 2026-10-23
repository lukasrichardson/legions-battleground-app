import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  createNewDeck: vi.fn(),
  duplicateDeckById: vi.fn(),
  getDeckById: vi.fn(),
  getDecksForPlayer: vi.fn(),
  getDeckListSummariesForPlayer: vi.fn(),
  getRecentDeckListSummariesForPlayer: vi.fn(),
  getFilterOptionsForPlayerDecks: vi.fn(),
  updateDeckById: vi.fn(),
  deleteDeckById: vi.fn(),
}));

vi.mock("@/server/services/api/DecksService", () => serviceMocks);
vi.mock("@/server/services/api/DeckPublicationService", () => ({ copyPublishedDeck: vi.fn() }));

import decksController from "@/server/controllers/decks.controller";

describe("GET /api/decks?view=summary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses compact summaries instead of hydrating every deck", async () => {
    const app = { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn(), use: vi.fn() };
    const summaries = [{ _id: "deck-1", name: "Angels" }];
    serviceMocks.getDeckListSummariesForPlayer.mockResolvedValue(summaries);
    decksController(app as never);

    const [, , handler] = app.get.mock.calls.find(([path]) => path === "/api/decks")!;
    const send = vi.fn();
    await handler({ query: { view: "summary", legion: "Angels" }, user: { id: "player-1" } }, { send });

    expect(serviceMocks.getDeckListSummariesForPlayer).toHaveBeenCalledWith({ id: "player-1" }, "Angels");
    expect(serviceMocks.getDecksForPlayer).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith(summaries);
  });

  it("uses the bounded recent summary query for the Arena Home surface", async () => {
    const app = { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn(), use: vi.fn() };
    const recentDecks = [{ _id: "deck-1", name: "Most recent", updated_at: new Date() }];
    serviceMocks.getRecentDeckListSummariesForPlayer.mockResolvedValue(recentDecks);
    decksController(app as never);

    const [, , handler] = app.get.mock.calls.find(([path]) => path === "/api/decks")!;
    const send = vi.fn();
    await handler({ query: { view: "recent" }, user: { id: "player-1" } }, { send });

    expect(serviceMocks.getRecentDeckListSummariesForPlayer).toHaveBeenCalledWith({ id: "player-1" });
    expect(serviceMocks.getDeckListSummariesForPlayer).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith(recentDecks);
  });
});
