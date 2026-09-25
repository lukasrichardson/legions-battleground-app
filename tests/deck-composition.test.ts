import { describe, expect, it } from "vitest";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { CardInDeck, DeckResponse } from "@/shared/interfaces/DeckResponse";
import { getCombinedCardCounts, isCardAllowedForDeckLegion, isSideDeckCardTypeAllowed, normalizeDeck, SIDE_DECK_MAX_SIZE } from "@/shared/deckComposition";
import { DeckValidationError, validateDeckComposition } from "@/server/services/api/DeckValidationService";

const card = (title: string, type = CARD_TYPE.WARRIOR, legion = "Angels"): CardInDeck => ({
  _id: title,
  id: title,
  title,
  featured_image: "",
  content: { paragraphs: [], lines: [], html: "" },
  permalink: "",
  text: "",
  card_code: title,
  card_release: "",
  legion: { names: [legion], slugs: [] },
  set: { names: [], slugs: [] },
  variant: { names: [], slugs: [] },
  rarity: { names: [], slugs: [] },
  card_type: { names: [type], slugs: [] },
  card_subtype: { names: [], slugs: [] },
  card_srl: { names: [], slugs: [] },
  keywords: { names: [], slugs: [] },
});

const legacyDeck = { _id: {} as DeckResponse["_id"], name: "Legacy", subtitle: "", legion: "Angels", cards_in_deck: [], created_at: new Date(), updated_at: new Date() } as DeckResponse;

describe("deck composition", () => {
  it("treats legacy decks as having an empty side deck", () => {
    expect(normalizeDeck(legacyDeck).side_deck).toEqual([]);
  });

  it("counts matching cards across the main and side decks", () => {
    const deck = { ...legacyDeck, cards_in_deck: [card("Same Card")], side_deck: [card("Same Card")] };
    expect(getCombinedCardCounts(deck).get("same card")).toBe(2);
  });

  it("allows only eligible card types in a side deck", () => {
    expect(isSideDeckCardTypeAllowed(card("Warrior"))).toBe(true);
    expect(isSideDeckCardTypeAllowed(card("Warlord", CARD_TYPE.WARLORD))).toBe(false);
    expect(isSideDeckCardTypeAllowed(card("Token", CARD_TYPE.TOKEN))).toBe(false);
    expect(isSideDeckCardTypeAllowed(card("Realm", CARD_TYPE.VEIL_REALM))).toBe(false);
  });

  it("accepts the deck legion and Bounty, but rejects other legions", () => {
    expect(isCardAllowedForDeckLegion(card("Angel", CARD_TYPE.WARRIOR, "Angels"), "Angels")).toBe(true);
    expect(isCardAllowedForDeckLegion(card("Bounty", CARD_TYPE.WARRIOR, "Bounty"), "Angels")).toBe(true);
    expect(isCardAllowedForDeckLegion(card("Titan", CARD_TYPE.WARRIOR, "Titans"), "Angels")).toBe(false);
  });

  it("sets the side-deck maximum at fifteen cards", () => {
    expect(SIDE_DECK_MAX_SIZE).toBe(15);
  });

  it("enforces the side-deck size and eligible card-type rules on the server", () => {
    const oversizedDeck = {
      ...legacyDeck,
      side_deck: Array.from({ length: SIDE_DECK_MAX_SIZE + 1 }, (_, index) => card(`Card ${index}`)),
    };
    expect(() => validateDeckComposition(oversizedDeck)).toThrow(DeckValidationError);

    const warlordInSideDeck = { ...legacyDeck, side_deck: [card("Warlord", CARD_TYPE.WARLORD)] };
    expect(() => validateDeckComposition(warlordInSideDeck)).toThrow("cannot be placed in a side deck");
  });

  it("accepts a full eligible side deck and rejects cards from another legion", () => {
    const fullSideDeck = {
      ...legacyDeck,
      side_deck: Array.from({ length: SIDE_DECK_MAX_SIZE }, (_, index) => card(`Card ${index}`)),
    };
    expect(() => validateDeckComposition(fullSideDeck)).not.toThrow();

    const foreignLegionCard = { ...legacyDeck, side_deck: [card("Titan Card", CARD_TYPE.WARRIOR, "Titans")] };
    expect(() => validateDeckComposition(foreignLegionCard)).toThrow("is not valid for the Angels legion");
  });

  it("applies copy limits across both card lists", () => {
    const deck = {
      ...legacyDeck,
      cards_in_deck: [card("Shared Card"), card("Shared Card"), card("Shared Card")],
      side_deck: [card("Shared Card")],
    };
    expect(() => validateDeckComposition(deck)).toThrow("exceeds the 3-copy limit across the main and side decks");
  });
});
