import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const { getDatabaseMock } = vi.hoisted(() => ({ getDatabaseMock: vi.fn() }));

vi.mock("@/server/utils/database.util", () => ({ getDatabase: getDatabaseMock }));

import { getDeckListSummaries, parsePublishedDeckSummaryPagination } from "@/server/services/api/DeckListSummaryService";

describe("deck-list summaries", () => {
  const firstCardId = new ObjectId();
  const aggregate = vi.fn();
  const find = vi.fn();
  const collection = vi.fn((name: string) => name === "cards" ? { find } : { aggregate });

  beforeEach(() => {
    vi.clearAllMocks();
    getDatabaseMock.mockReturnValue({ collection });
  });

  it("returns counts and only one compact cover card per deck", async () => {
    aggregate.mockReturnValue({ toArray: vi.fn().mockResolvedValue([
      { _id: new ObjectId(), name: "Angels", legion: "Angels", mainDeckSize: 40, sideDeckSize: 3, coverCardId: firstCardId.toString() },
      { _id: new ObjectId(), name: "Empty", legion: "Titans", mainDeckSize: 0, sideDeckSize: 0 },
    ]) });
    find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([
      { _id: firstCardId, title: "Angel Leader", featured_image: "angel.png" },
    ]) });

    await expect(getDeckListSummaries("decks", { userId: "player-1" })).resolves.toEqual([
      {
        _id: expect.any(ObjectId),
        name: "Angels",
        legion: "Angels",
        mainDeckSize: 40,
        sideDeckSize: 3,
        coverCard: { _id: firstCardId, title: "Angel Leader", featured_image: "angel.png" },
      },
      {
        _id: expect.any(ObjectId),
        name: "Empty",
        legion: "Titans",
        mainDeckSize: 0,
        sideDeckSize: 0,
        coverCard: null,
      },
    ]);

    expect(find).toHaveBeenCalledWith(
      { _id: { $in: [firstCardId] } },
      { projection: { _id: 1, title: 1, featured_image: 1 } },
    );
    expect(aggregate.mock.calls[0][0]).toEqual(expect.arrayContaining([
      { $match: { userId: "player-1" } },
      expect.objectContaining({ $project: expect.objectContaining({ mainDeckSize: expect.any(Object), coverCardId: expect.any(Object) }) }),
    ]));
  });

  it("bounds public pagination to a small, valid page", () => {
    expect(parsePublishedDeckSummaryPagination("0", "999")).toEqual({ page: 1, limit: 48 });
    expect(parsePublishedDeckSummaryPagination("2", "24")).toEqual({ page: 2, limit: 24 });
    expect(parsePublishedDeckSummaryPagination(undefined, undefined)).toEqual({ page: 1, limit: 24 });
  });
});
