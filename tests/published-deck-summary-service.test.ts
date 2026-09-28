import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDatabaseMock, getDeckListSummariesMock } = vi.hoisted(() => ({
  getDatabaseMock: vi.fn(),
  getDeckListSummariesMock: vi.fn(),
}));

vi.mock("@/server/utils/database.util", () => ({ getDatabase: getDatabaseMock }));
vi.mock("@/server/services/api/DeckListSummaryService", () => ({
  getDeckListSummaries: getDeckListSummariesMock,
}));

import { getPublishedDeckListSummaries } from "@/server/services/api/PublishedDecksService";

describe("getPublishedDeckListSummaries", () => {
  const countDocuments = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getDatabaseMock.mockReturnValue({
      collection: vi.fn(() => ({ countDocuments })),
    });
  });

  it("returns a bounded page with stable ordering metadata", async () => {
    countDocuments.mockResolvedValue(49);
    getDeckListSummariesMock.mockResolvedValue([{ _id: "deck-25", name: "Page two" }]);

    await expect(getPublishedDeckListSummaries(["Angels"], { page: 2, limit: 24 })).resolves.toEqual({
      decks: [{ _id: "deck-25", name: "Page two" }],
      page: 2,
      limit: 24,
      total: 49,
      hasMore: true,
    });

    expect(countDocuments).toHaveBeenCalledWith({ legion: { $in: ["Angels"] } });
    expect(getDeckListSummariesMock).toHaveBeenCalledWith("published_decks", { legion: { $in: ["Angels"] } }, {
      sort: { published_date: -1, _id: -1 },
      skip: 24,
      limit: 24,
    });
  });
});
