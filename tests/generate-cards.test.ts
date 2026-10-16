import { describe, expect, it } from "vitest";
import { generateStartingPlayersCards } from "@/server/utils/generateCards.util";
import { CARD_TYPE } from "@/shared/enums/CardType";
import type { DeckResponse, HydratedDeckCard } from "@/shared/interfaces/DeckResponse";

const card = (id: string): HydratedDeckCard => ({
  _id: id,
  title: id,
  featured_image: "",
  text: "",
  card_code: id,
  legion: { names: ["Angels"] },
  card_type: { names: [CARD_TYPE.WARRIOR] },
});

const token = (id: string): HydratedDeckCard => ({ ...card(id), card_type: { names: [CARD_TYPE.TOKEN] } });

const deckWith = (cards: HydratedDeckCard[]): DeckResponse => ({
  _id: {} as DeckResponse["_id"],
  name: "Short deck",
  subtitle: "",
  legion: "Angels",
  cards_in_deck: cards.map(({ _id }) => _id),
  side_deck: [],
  warlords: [],
  synergies: [],
  veilRealms: [],
  guardians: [],
  tokens: [],
  cards,
  created_at: new Date(),
  updated_at: new Date(),
});

describe("starting-card generation", () => {
  it("does not emit null opening-hand entries for a deck smaller than the opening hand", () => {
    const shortDeck = deckWith([card("one"), card("two"), card("three")]);

    const { p1Deck, p2Deck } = generateStartingPlayersCards(shortDeck, shortDeck);

    expect(p1Deck.playerHand).toHaveLength(3);
    expect(p2Deck.playerHand).toHaveLength(3);
    expect(p1Deck.playerHand.every(Boolean)).toBe(true);
    expect(p2Deck.playerHand.every(Boolean)).toBe(true);
  });

  it("loads tokens from their dedicated pile rather than the draw deck", () => {
    const tokenCard = token("angel-token");
    const deck = { ...deckWith([card("one")]), tokens: [tokenCard._id], cards: [card("one"), tokenCard] };

    const { p1Deck } = generateStartingPlayersCards(deck, deck);

    expect(p1Deck.playerDeck).toHaveLength(0);
    expect(p1Deck.playerHand).toHaveLength(1);
    expect(p1Deck.tokens).toHaveLength(1);
    expect(p1Deck.tokens[0].name).toBe("angel-token");
  });
});
