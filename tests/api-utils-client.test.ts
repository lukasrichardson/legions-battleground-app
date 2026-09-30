import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchDeckListSummaries,
  fetchPublishedDeckFilterOptions,
  fetchPublishedDeckListSummaries,
  fetchRecentPublishedDecks,
} from "@/client/utils/api.utils";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));

describe("client API contracts", () => {
  beforeEach(() => vi.clearAllMocks());

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

  it("unwraps published-deck filter options", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { filterOptions: { legion: ["angels", "dwarfs"] } } });
    await expect(fetchPublishedDeckFilterOptions()).resolves.toEqual({ legion: ["angels", "dwarfs"] });
  });

  it("requests the ten newest published decks", async () => {
    const decks = [{ name: "Newest deck" }];
    vi.mocked(axios.get).mockResolvedValue({ data: { decks } });

    await expect(fetchRecentPublishedDecks()).resolves.toEqual(decks);
    expect(axios.get).toHaveBeenCalledWith("/api/published_decks", {
      params: { view: "summary", page: 1, limit: 10 },
    });
  });
});
