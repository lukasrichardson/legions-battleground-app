import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { deckMarkdownFilename, deckToMarkdown } from "@/client/utils/deckMarkdown";
import { DeckResponse, HydratedDeckCard } from "@/shared/interfaces/DeckResponse";

const card = (id: ObjectId, title: string): HydratedDeckCard => ({
  _id: id,
  title,
  text: "",
  featured_image: "",
  card_code: title,
  legion: { names: ["Angels"] },
  card_type: { names: ["Warrior"] },
});

describe("deckToMarkdown", () => {
  it("renders ordered deck sections and combines duplicate cards", () => {
    const vanguard = new ObjectId();
    const strike = new ObjectId();
    const warlord = new ObjectId();
    const sideboard = new ObjectId();
    const deck: DeckResponse = {
      _id: new ObjectId(),
      name: "Angels of Dawn",
      subtitle: "A fast deck",
      legion: "Angels",
      cards_in_deck: [vanguard, vanguard, strike],
      side_deck: [sideboard],
      warlords: [warlord],
      synergies: [],
      veilRealms: [],
      guardians: [],
      tokens: [],
      cards: [card(vanguard, "Vanguard"), card(strike, "Radiant Strike"), card(warlord, "Aurelia"), card(sideboard, "Counterspell")],
      created_at: new Date(),
      updated_at: new Date(),
    };

    expect(deckToMarkdown(deck)).toBe(`# Angels of Dawn\n\nA fast deck\n\n**Legion:** Angels\n\n## Main Deck (3)\n\n- 2x Vanguard\n- 1x Radiant Strike\n\n## Warlord (1)\n\n- 1x Aurelia\n\n## Side Deck (1)\n\n- 1x Counterspell\n`);
  });

  it("omits empty sections and creates safe filenames", () => {
    const deck: DeckResponse = {
      _id: new ObjectId(), name: "  My / Deck!  ", subtitle: "", legion: "Angels",
      cards_in_deck: [], side_deck: [], warlords: [], synergies: [], veilRealms: [], guardians: [], tokens: [], cards: [],
      created_at: new Date(), updated_at: new Date(),
    };

    expect(deckToMarkdown(deck)).toBe("# My / Deck!\n\n**Legion:** Angels\n");
    expect(deckMarkdownFilename(deck.name)).toBe("my-deck.md");
    expect(deckMarkdownFilename("***")).toBe("deck.md");
  });

  it("exports tokens as a separate section", () => {
    const token = new ObjectId();
    const deck: DeckResponse = {
      _id: new ObjectId(), name: "Tokens", subtitle: "", legion: "Angels",
      cards_in_deck: [], side_deck: [], warlords: [], synergies: [], veilRealms: [], guardians: [], tokens: [token],
      cards: [card(token, "Angel Token")], created_at: new Date(), updated_at: new Date(),
    };

    expect(deckToMarkdown(deck)).toContain("## Tokens (1)\n\n- 1x Angel Token");
  });
});
