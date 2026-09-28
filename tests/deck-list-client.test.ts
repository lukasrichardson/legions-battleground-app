import axios from "axios";
import { describe, expect, it, vi } from "vitest";
import { fetchDeckListSummaries, fetchPublishedDeckListSummaries } from "@/client/utils/api.utils";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));

describe("deck-list client", () => {
  it("requests compact personal deck summaries", async () => {
    const decks = [{ _id: "deck-1", name: "Angels" }];
    vi.mocked(axios.get).mockResolvedValue({ data: decks });

    await expect(fetchDeckListSummaries(["Angels"])).resolves.toEqual(decks);
    expect(axios.get).toHaveBeenCalledWith("/api/decks", {
      params: { legion: ["Angels"], view: "summary" },
      paramsSerializer: { indexes: null },
    });
  });

  it("requests a bounded page of public summaries", async () => {
    const response = { decks: [], page: 2, limit: 24, total: 30, hasMore: true };
    vi.mocked(axios.get).mockResolvedValue({ data: response });

    await expect(fetchPublishedDeckListSummaries(null, 2)).resolves.toEqual(response);
    expect(axios.get).toHaveBeenCalledWith("/api/published_decks", {
      params: { legion: null, view: "summary", page: 2, limit: 24 },
      paramsSerializer: { indexes: null },
    });
  });
});
