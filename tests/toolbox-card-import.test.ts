import { describe, expect, it } from "vitest";
import { mapToolboxCard, type ToolboxCard } from "@/server/utils/toolboxCardImport";

const card: ToolboxCard = {
  id: "card-1",
  title: "A &amp; B",
  thumb: "https://api.legionstoolbox.com/wp-content/uploads/card.png",
  content: { text: "Use &amp; win", paragraphs: ["p"], lines: ["l"], html: "<p>p</p>" },
  meta: { card_code: "ABC-1", card_release: "set-1" },
  taxonomies: Object.fromEntries([
    "legion", "set", "variant", "rarity", "card_type", "card_subtype", "card_srl", "keywords",
  ].map((name) => [name, { names: [name], slugs: [`${name}-slug`] }])),
  permalink: "https://example.com/card-1",
  attack: 3,
};

describe("Toolbox card import mapping", () => {
  it("writes the supplied public R2 URL instead of the Toolbox thumbnail", () => {
    const r2Url = "https://images.example.dev/cards/card.png";
    const result = mapToolboxCard(card, r2Url);

    expect(result.featured_image).toBe(r2Url);
    expect(result.featured_image).not.toBe(card.thumb);
    expect(result.title).toBe("A & B");
    expect(result.text).toBe("Use & win");
  });

  it("rejects a response missing a required taxonomy rather than inserting partial data", () => {
    const incomplete = { ...card, taxonomies: { ...card.taxonomies } };
    delete incomplete.taxonomies.keywords;

    expect(() => mapToolboxCard(incomplete, "https://images.example.dev/cards/card.png"))
      .toThrow("missing the keywords taxonomy");
  });
});
