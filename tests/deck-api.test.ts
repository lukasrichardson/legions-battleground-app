import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { ObjectId } from "mongodb";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckResponse } from "@/shared/interfaces/DeckResponse";

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  insertOne: vi.fn(),
  deleteOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  getHydratedDeck: vi.fn(),
}));

vi.mock("@/server/utils/database.util", () => ({
  getDatabase: () => ({ collection: () => mocks }),
}));
vi.mock("@/server/services/api/DeckHydrationService", () => ({
  getHydratedDeck: mocks.getHydratedDeck,
}));
vi.mock("@/server/middleware/auth", () => ({
  requireAuth: (req, res, next) => {
    if (!req.headers["x-test-user"]) return res.status(401).json({ error: "Authentication required" });
    req.user = { id: req.headers["x-test-user"] };
    next();
  },
  optionalAuth: (_req, _res, next) => next(),
}));

import decksController from "@/server/controllers/decks.controller";
import publishedDecksController from "@/server/controllers/publishedDecks.controller";

describe("deck HTTP contracts (real controllers, services, and error middleware)", () => {
  let server: Server;
  let origin: string;
  const deckId = new ObjectId();
  const deck: DeckResponse = {
    _id: deckId, name: "Angels", subtitle: "", legion: "Angels", userId: "player-1",
    cards_in_deck: [], side_deck: [], warlords: [], synergies: [], veilRealms: [], guardians: [], tokens: [],
    created_at: new Date("2026-01-01"), updated_at: new Date("2026-01-01"), cards: [],
  };

  beforeAll(async () => {
    const app = express();
    app.use(express.json({ type: ["application/json", "application/json-patch+json"] }));
    decksController(app);
    publishedDecksController(app);
    server = await new Promise<Server>((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.findOne.mockResolvedValue(null);
    mocks.getHydratedDeck.mockResolvedValue(null);
    mocks.insertOne.mockResolvedValue({ insertedId: deckId });
    mocks.deleteOne.mockResolvedValue({ deletedCount: 0 });
    mocks.findOneAndUpdate.mockResolvedValue(null);
  });

  const request = (path: string, method = "GET", body?: unknown) => fetch(`${origin}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "x-test-user": "player-1" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  it("requires authentication before calling deck services", async () => {
    const response = await fetch(`${origin}/api/decks`, { method: "POST" });
    expect(response.status).toBe(401);
    expect(mocks.findOne).not.toHaveBeenCalled();
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it("preserves the JSON parser's payload limit instead of reporting a server failure", async () => {
    const response = await request("/api/decks", "POST", { name: "x".repeat(128 * 1024) });
    expect(response.status).toBe(413);
    expect((await response.json()).error).toBe("Payload too large");
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it("preserves unsupported charset errors instead of reporting a server failure", async () => {
    const response = await fetch(`${origin}/api/decks`, {
      method: "POST", headers: { "Content-Type": "application/json; charset=iso-8859-1", "x-test-user": "player-1" },
      body: "{}",
    });
    expect(response.status).toBe(415);
    expect((await response.json()).error).toBe("Unsupported media type");
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it.each([null, [], "deck", {}, { name: " ", legion: "Angels" }, { name: "Deck", legion: 2 },
    { name: "x".repeat(121), legion: "Angels" }, { name: "Deck", legion: "x".repeat(101) }])
  ("rejects invalid creation input before touching Mongo: %j", async (body) => {
    const response = await request("/api/decks", "POST", body);
    expect(response.status).toBe(400);
    expect(mocks.findOne).not.toHaveBeenCalled();
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it("normalizes creation input and keeps ownership and card lists server-managed", async () => {
    mocks.getHydratedDeck.mockResolvedValue(deck);
    const response = await request("/api/decks", "POST", {
      name: " Angels ", legion: " Angels ", userId: "another-player", cards_in_deck: ["injected"],
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      success: true, message: "Deck created successfully",
      deck: { _id: deckId.toString(), name: "Angels", subtitle: "", legion: "Angels", userId: "player-1", created_at: deck.created_at.toISOString() },
    });
    expect(mocks.insertOne).toHaveBeenCalledWith(expect.objectContaining({
      name: "Angels", legion: "Angels", userId: "player-1", cards_in_deck: [],
    }));
    expect(mocks.findOne).toHaveBeenCalledWith({ name: "Angels", userId: "player-1" });
  });

  it("reports duplicate names as conflicts", async () => {
    mocks.findOne.mockResolvedValue(deck);
    mocks.getHydratedDeck.mockResolvedValue(deck);
    const response = await request("/api/decks", "POST", { name: deck.name, legion: deck.legion });
    expect(response.status).toBe(409);
    expect((await response.json()).message).toContain("already have a deck");
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it("duplicates a private deck through the shared creation contract", async () => {
    mocks.getHydratedDeck.mockResolvedValueOnce(deck).mockResolvedValueOnce({ ...deck, name: "Angels Copy" });
    const response = await request(`/api/decks/${deckId}/duplicate`, "POST");
    expect(response.status).toBe(201);
    expect((await response.json()).deck.name).toBe("Angels Copy");
    const [stored] = mocks.insertOne.mock.calls[0];
    expect(stored).toMatchObject({ name: "Angels Copy", userId: "player-1", tokens: [] });
    expect(stored).not.toHaveProperty("_id");
    expect(stored).not.toHaveProperty("cards");
  });

  it("copies a public deck into the caller's library without publication metadata", async () => {
    const published = { ...deck, userId: "source-author", author: "Author", published_date: new Date() };
    mocks.getHydratedDeck.mockResolvedValueOnce(published).mockResolvedValueOnce(deck);
    const response = await request(`/api/decks/${deckId}`, "POST");
    expect(response.status).toBe(201);
    const [stored] = mocks.insertOne.mock.calls[0];
    expect(stored).toMatchObject({ name: "Angels Copy", userId: "player-1" });
    for (const field of ["_id", "cards", "published_date", "author"]) expect(stored).not.toHaveProperty(field);
  });

  it("publishes an owned deck with its public alias and preserves the full response", async () => {
    const published = { ...deck, author: "ChosenAlias", published_date: new Date("2026-01-02") };
    mocks.getHydratedDeck.mockResolvedValueOnce(deck).mockResolvedValueOnce(published);
    mocks.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ alias: "ChosenAlias" });
    const response = await request("/api/published_decks", "POST", { _id: deckId.toString() });
    expect(response.status).toBe(201);
    expect((await response.json()).deck).toMatchObject({ author: "ChosenAlias", published_date: "2026-01-02T00:00:00.000Z", cards: [] });
    expect(mocks.getHydratedDeck).toHaveBeenNthCalledWith(1, "decks", { _id: deckId, userId: "player-1" });
    const [stored] = mocks.insertOne.mock.calls[0];
    expect(stored).toMatchObject({ author: "ChosenAlias", userId: "player-1" });
    expect(stored).not.toHaveProperty("_id");
    expect(stored).not.toHaveProperty("cards");
  });

  it.each([
    ["GET", "/api/decks/invalid-object-id"],
    ["PATCH", "/api/decks/invalid-object-id"],
    ["DELETE", "/api/decks/invalid-object-id"],
    ["POST", "/api/decks/invalid-object-id/duplicate"],
    ["POST", "/api/decks/invalid-object-id"],
    ["GET", "/api/published_decks/invalid-object-id"],
  ])("returns 400 for malformed IDs on %s %s", async (method, path) => {
    const response = await request(path, method);
    expect(response.status).toBe(400);
    expect((await response.json()).message).toContain("ObjectId");
    expect(mocks.getHydratedDeck).not.toHaveBeenCalled();
  });

  it.each([
    ["GET", `/api/decks/${deckId}`], ["PATCH", `/api/decks/${deckId}`],
    ["DELETE", `/api/decks/${deckId}`], ["POST", `/api/decks/${deckId}/duplicate`],
    ["POST", `/api/decks/${deckId}`], ["GET", `/api/published_decks/${deckId}`],
  ])("returns 404 for absent decks on %s %s", async (method, path) => {
    const response = await request(path, method);
    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("Not found");
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it("keeps short legacy ID reads scoped to the owner", async () => {
    const response = await request("/api/decks/12345");
    expect(response.status).toBe(404);
    expect(mocks.getHydratedDeck).toHaveBeenCalledWith("decks", { id: "12345", userId: "player-1" });
  });

  it("keeps ObjectId reads scoped to the owner", async () => {
    await request(`/api/decks/${deckId}`);
    expect(mocks.getHydratedDeck).toHaveBeenCalledWith("decks", { _id: deckId, userId: "player-1" });
  });

  it("returns structured PATCH validation errors without writing", async () => {
    mocks.getHydratedDeck.mockResolvedValue(deck);
    const response = await request(`/api/decks/${deckId}`, "PATCH", { userId: "other-player" });
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("userId cannot be updated.");
    expect(mocks.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("handles a deck disappearing between the read and update", async () => {
    mocks.getHydratedDeck.mockResolvedValue(deck);
    const response = await request(`/api/decks/${deckId}`, "PATCH", { name: "Updated" });
    expect(response.status).toBe(404);
    expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: deckId, userId: "player-1" },
      { $set: { name: "Updated", updated_at: expect.any(Date) } },
      { returnDocument: "after" },
    );
  });

  it.each([undefined, {}, { _id: 42 }, { _id: " " }, { _id: "invalid-object-id" }])
  ("validates publication input %j", async (body) => {
    expect((await request("/api/published_decks", "POST", body)).status).toBe(400);
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it("reports a missing source deck when publishing", async () => {
    expect((await request("/api/published_decks", "POST", { _id: deckId.toString() })).status).toBe(404);
  });

  it("reports an existing publication as a conflict", async () => {
    mocks.getHydratedDeck.mockResolvedValue(deck);
    mocks.findOne.mockResolvedValue(deck);
    expect((await request("/api/published_decks", "POST", { _id: deckId.toString() })).status).toBe(409);
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it.each([
    [{ code: 11000 }, 409], [{ name: "MongoNetworkError" }, 503],
    [{ name: "MongoTimeoutError" }, 503], [{ name: "MongoServerSelectionError" }, 503],
    [new Error("private database details"), 500],
  ])("maps infrastructure errors to safe JSON responses: %j", async (error, status) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.findOne.mockRejectedValue(error);
      const response = await request("/api/decks", "POST", { name: "Angels", legion: "Angels" });
      expect(response.status).toBe(status);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(JSON.stringify(await response.json())).not.toContain("private database details");
    } finally {
      log.mockRestore();
    }
  });
});
