import { describe, expect, it } from "vitest";
import { CARD_TYPE } from "@/shared/enums/CardType";
import { DeckResponse, HydratedDeckCard } from "@/shared/interfaces/DeckResponse";
import { getCombinedCardCounts, isCardAllowedForDeckLegion, isSideDeckCardTypeAllowed, normalizeDeck, SIDE_DECK_MAX_SIZE } from "@/shared/deckComposition";
import { DeckValidationError, validateDeckComposition } from "@/server/services/api/DeckValidationService";

const card = (title: string, type = CARD_TYPE.WARRIOR, legion = "Angels"): HydratedDeckCard => ({
  _id: title,
  title,
  featured_image: "",
  text: "",
  card_code: title,
  legion: { names: [legion] },
  card_type: { names: [type] },
});

const deckWith = (main: HydratedDeckCard[] = [], side: HydratedDeckCard[] = []): DeckResponse => ({
  _id: {} as DeckResponse["_id"],
  name: "Legacy",
  subtitle: "",
  legion: "Angels",
  cards_in_deck: main.map((item) => item._id),
  side_deck: side.map((item) => item._id),
  cards: [...new Map([...main, ...side].map((item) => [item._id, item])).values()],
  created_at: new Date(),
  updated_at: new Date(),
});

const legacyDeck = { ...deckWith(), side_deck: undefined } as DeckResponse;

describe("deck composition", () => {
  it("treats legacy decks as having an empty side deck", () => {
    expect(normalizeDeck(legacyDeck).side_deck).toEqual([]);
  });

  it("counts matching cards across the main and side decks", () => {
    const deck = deckWith([card("Same Card")], [card("Same Card")]);
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
    const oversizedDeck = deckWith([], Array.from({ length: SIDE_DECK_MAX_SIZE + 1 }, (_, index) => card(`Card ${index}`)));
    expect(() => validateDeckComposition(oversizedDeck)).toThrow(DeckValidationError);

    const warlordInSideDeck = deckWith([], [card("Warlord", CARD_TYPE.WARLORD)]);
    expect(() => validateDeckComposition(warlordInSideDeck)).toThrow("cannot be placed in a side deck");
  });

  it("accepts a full eligible side deck and rejects cards from another legion", () => {
    const fullSideDeck = deckWith([], Array.from({ length: SIDE_DECK_MAX_SIZE }, (_, index) => card(`Card ${index}`)));
    expect(() => validateDeckComposition(fullSideDeck)).not.toThrow();

    const foreignLegionCard = deckWith([], [card("Titan Card", CARD_TYPE.WARRIOR, "Titans")]);
    expect(() => validateDeckComposition(foreignLegionCard)).toThrow("is not valid for the Angels legion");
  });

  it("applies copy limits across both card lists", () => {
    const deck = deckWith(
      [card("Shared Card"), card("Shared Card"), card("Shared Card")],
      [card("Shared Card")],
    );
    expect(() => validateDeckComposition(deck)).toThrow("exceeds the 3-copy limit across the main and side decks");
  });
});
