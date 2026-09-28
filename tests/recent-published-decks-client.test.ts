import axios from "axios";
import { describe, expect, it, vi } from "vitest";
import { fetchRecentPublishedDecks } from "@/client/utils/api.utils";

vi.mock("axios", () => ({
  default: { get: vi.fn() },
}));

describe("fetchRecentPublishedDecks", () => {
  it("requests the ten newest published decks", async () => {
    const decks = [{ name: "Newest deck" }];
    vi.mocked(axios.get).mockResolvedValue({ data: { decks } });

    await expect(fetchRecentPublishedDecks()).resolves.toEqual(decks);
    expect(axios.get).toHaveBeenCalledWith("/api/published_decks", {
      params: { view: "summary", page: 1, limit: 10 },
    });
  });
});
