import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";

const { getDatabaseMock } = vi.hoisted(() => ({
  getDatabaseMock: vi.fn(),
}));

vi.mock("@/server/utils/database.util", () => ({
  getDatabase: getDatabaseMock,
}));

import { updateDeckById } from "@/server/services/api/DecksService";

describe("updateDeckById", () => {
  const findOneAndUpdate = vi.fn();
  const collection = { findOneAndUpdate };

  beforeEach(() => {
    vi.clearAllMocks();
    getDatabaseMock.mockReturnValue({
      collection: vi.fn(() => collection),
    });
  });

  it("returns the post-update deck from findOneAndUpdate without a follow-up read", async () => {
    const deck: DeckResponse = {
      _id: new ObjectId(),
      name: "Updated deck",
      subtitle: "",
      legion: "Angels",
      userId: "user-1",
      cards_in_deck: [],
      created_at: new Date("2026-01-01"),
      updated_at: new Date("2026-01-01"),
    };
    findOneAndUpdate.mockResolvedValue(deck);

    await expect(updateDeckById({ id: "user-1" }, deck._id.toString(), { name: deck.name }))
      .resolves.toEqual({ ...deck, side_deck: [] });

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { _id: deck._id, userId: "user-1" },
      { $set: { name: deck.name, updated_at: expect.any(Date) } },
      { returnDocument: "after" },
    );
  });

  it("rejects when the deck is absent or not owned by the user", async () => {
    findOneAndUpdate.mockResolvedValue(null);

    await expect(updateDeckById({ id: "user-1" }, new ObjectId().toString(), { name: "Updated deck" }))
      .rejects.toThrow("Deck not found or you don't have permission to edit this deck");
  });
});
