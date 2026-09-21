import { describe, expect, it, vi } from "vitest";
import { fetchToolboxDeck } from "@/client/utils/toolboxDeck";

describe("fetchToolboxDeck", () => {
  it("fetches a deck directly from Toolbox and normalizes its wrapper response", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      data: { name: "Test Deck", legion: "dwarves", cards_in_deck: { a: { code: "RVL-128" } } },
    }])));

    await expect(fetchToolboxDeck("4938", request)).resolves.toMatchObject({ id: "4938", name: "Test Deck" });
    expect(request).toHaveBeenCalledWith(
      "https://api.legionstoolbox.com/index.php/wp-json/lraw/v1/decks?deck=4938",
      expect.objectContaining({ credentials: "omit", method: "GET", mode: "cors" }),
    );
  });
});
