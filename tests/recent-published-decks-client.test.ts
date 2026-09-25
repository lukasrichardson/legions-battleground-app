import axios from "axios";
import { describe, expect, it, vi } from "vitest";
import { fetchRecentPublishedDecks } from "@/client/utils/api.utils";

vi.mock("axios", () => ({
  default: { get: vi.fn() },
}));

describe("fetchRecentPublishedDecks", () => {
  it("requests the five newest published decks", async () => {
    const decks = [{ name: "Newest deck" }];
    vi.mocked(axios.get).mockResolvedValue({ data: decks });

    await expect(fetchRecentPublishedDecks()).resolves.toEqual(decks);
    expect(axios.get).toHaveBeenCalledWith("/api/published_decks", {
      params: { sort: "recent", limit: 5 },
    });
  });
});
