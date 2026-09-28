import { getDatabase } from "@/server/utils/database.util";
import { DeckCardId, DeckResponse, HydratedDeckCard } from "@/shared/interfaces/DeckResponse";
import { ObjectId } from "mongodb";
import { normalizeDeck } from "@/shared/deckComposition";

type DeckCollection = "decks" | "published_decks";
type StoredCard = Omit<HydratedDeckCard, "_id"> & { _id: ObjectId };

export const DECK_CARD_PROJECTION = {
  _id: 1,
  title: 1,
  text: 1,
  featured_image: 1,
  card_code: 1,
  "card_type.names": 1,
  "legion.names": 1,
} as const;

const idsFor = (deck: DeckResponse): ObjectId[] => {
  const normalizedDeck = normalizeDeck(deck);
  return [
    ...normalizedDeck.cards_in_deck,
    ...normalizedDeck.warlords,
    ...normalizedDeck.synergies,
    ...normalizedDeck.veilRealms,
    ...normalizedDeck.guardians,
    ...normalizedDeck.side_deck,
  ].map((id: DeckCardId) => id instanceof ObjectId ? id : new ObjectId(id));
};

/** Hydrates one deck with its unique catalogue cards while preserving ID arrays. */
export async function hydrateDeck<T extends DeckResponse>(deck: T): Promise<T> {
  const normalizedDeck = normalizeDeck(deck);
  const ids = [...new Map(idsFor(normalizedDeck).map((id) => [id.toString(), id])).values()];
  if (!ids.length) return { ...normalizedDeck, cards: [] } as T;

  const cards = await getDatabase().collection<StoredCard>("cards")
    .find({ _id: { $in: ids } }, { projection: DECK_CARD_PROJECTION })
    .toArray();
  const found = new Set(cards.map((card) => card._id.toString()));
  const missing = ids.filter((id) => !found.has(id.toString()));
  if (missing.length) {
    throw new Error(`Deck references unavailable card IDs: ${missing.map((id) => id.toString()).join(", ")}`);
  }
  return { ...normalizedDeck, cards } as T;
}

/** One aggregate command for a detail read. $lookup uses cards' built-in _id index. */
export async function getHydratedDeck<T extends DeckResponse>(
  collectionName: DeckCollection,
  match: Record<string, unknown>,
): Promise<T | null> {
  const deck = await getDatabase().collection<T>(collectionName).aggregate<T>([
    { $match: match },
    {
      $set: {
        cards_in_deck: { $ifNull: ["$cards_in_deck", []] },
        side_deck: { $ifNull: ["$side_deck", []] },
        warlords: { $ifNull: ["$warlords", []] },
        synergies: { $ifNull: ["$synergies", []] },
        veilRealms: { $ifNull: ["$veilRealms", []] },
        guardians: { $ifNull: ["$guardians", []] },
      },
    },
    { $set: { all_card_ids: { $setUnion: ["$cards_in_deck", "$warlords", "$synergies", "$veilRealms", "$guardians", "$side_deck"] } } },
    { $lookup: { from: "cards", localField: "all_card_ids", foreignField: "_id", as: "cards" } },
    {
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
    },
    { $unset: "all_card_ids" },
  ]).toArray();
  return deck[0] ?? null;
}

export async function hydrateDecks<T extends DeckResponse>(decks: T[]): Promise<T[]> {
  if (!decks.length) return [];
  const normalizedDecks = decks.map(normalizeDeck);
  const ids = [...new Map(normalizedDecks.flatMap(idsFor).map((id) => [id.toString(), id])).values()];
  const cards = ids.length
    ? await getDatabase().collection<StoredCard>("cards").find({ _id: { $in: ids } }, { projection: DECK_CARD_PROJECTION }).toArray()
    : [];
  const byId = new Set(cards.map((card) => card._id.toString()));
  for (const id of ids) {
    if (!byId.has(id.toString())) throw new Error(`Deck references unavailable card ID: ${id}`);
  }
  const cardsById = new Map(cards.map((card) => [card._id.toString(), card]));
  return normalizedDecks.map((deck) => {
    const deckCards = idsFor(deck).map((id) => cardsById.get(id.toString())!);
    const uniqueDeckCards = [...new Map(deckCards.map((card) => [card._id.toString(), card])).values()];
    return {
      ...deck,
      cards: uniqueDeckCards,
    } as T;
  });
}
