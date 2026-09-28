import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";

const { getDatabaseMock } = vi.hoisted(() => ({
  getDatabaseMock: vi.fn(),
}));

vi.mock("@/server/utils/database.util", () => ({
  getDatabase: getDatabaseMock,
}));

import {
  DECK_CARD_PROJECTION,
  getHydratedDeck,
  hydrateDeck,
  hydrateDecks,
} from "@/server/services/api/DeckHydrationService";

const card = (id: ObjectId) => ({
  _id: id,
  title: "Test card",
  text: "Test text",
  featured_image: "test.png",
  card_code: "TST-001",
  card_type: { names: ["Warrior"] },
  legion: { names: ["Angels"] },
});

const deck = (id: ObjectId): DeckResponse => ({
  _id: new ObjectId(),
  name: "Test deck",
  subtitle: "",
  legion: "Angels",
  cards_in_deck: [id],
  side_deck: [],
  warlords: [],
  synergies: [],
  veilRealms: [],
  guardians: [],
  created_at: new Date(),
  updated_at: new Date(),
});

describe("DeckHydrationService", () => {
  const find = vi.fn();
  const aggregate = vi.fn();
  const collection = { find, aggregate };

  beforeEach(() => {
    vi.clearAllMocks();
    getDatabaseMock.mockReturnValue({
      collection: vi.fn(() => collection),
    });
  });

  it("defines the minimal deck-card projection", () => {
    expect(DECK_CARD_PROJECTION).toEqual({
      _id: 1,
      title: 1,
      text: 1,
      featured_image: 1,
      card_code: 1,
      "card_type.names": 1,
      "legion.names": 1,
    });
  });

  it("uses the deck-card projection for single and list hydration", async () => {
    const id = new ObjectId();
    find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([card(id)]) });

    await hydrateDeck(deck(id));
    await hydrateDecks([deck(id)]);

    expect(find).toHaveBeenNthCalledWith(
      1,
      { _id: { $in: [id] } },
      { projection: DECK_CARD_PROJECTION },
    );
    expect(find).toHaveBeenNthCalledWith(
      2,
      { _id: { $in: [id] } },
      { projection: DECK_CARD_PROJECTION },
    );
  });

  it("hydrates IDs stored in special main-deck arrays", async () => {
    const id = new ObjectId();
    find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([card(id)]) });

    await hydrateDeck({ ...deck(new ObjectId()), cards_in_deck: [], warlords: [id] });

    expect(find).toHaveBeenCalledWith({ _id: { $in: [id] } }, { projection: DECK_CARD_PROJECTION });
  });

  it("maps detail lookup cards to the hydrated deck-card fields", async () => {
    aggregate.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });

    await getHydratedDeck("decks", { _id: new ObjectId() });

    const pipeline = aggregate.mock.calls[0][0];
    expect(pipeline).toContainEqual({
      $lookup: { from: "cards", localField: "all_card_ids", foreignField: "_id", as: "cards" },
    });
    expect(pipeline).toContainEqual({
      $set: {
        cards: {
          $map: {
            input: "$cards",
            as: "card",
            in: {
              _id: "$$card._id",
              title: "$$card.title",
              text: "$$card.text",
              featured_image: "$$card.featured_image",
              card_code: "$$card.card_code",
              card_type: { names: "$$card.card_type.names" },
              legion: { names: "$$card.legion.names" },
            },
          },
        },
      },
    });
  });
});
