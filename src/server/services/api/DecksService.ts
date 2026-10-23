import { getDatabase } from "@/server/utils/database.util";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import { Filter } from "mongodb";
import { normalizeDeck } from "@/shared/deckComposition";
import { getHydratedDeck, hydrateDecks } from "./DeckHydrationService";
import { getDeckListSummaries } from "./DeckListSummaryService";
import { DeckListItem, RecentDeckListItem } from "@/shared/interfaces/DeckListItem";

import { AuthenticatedUser } from "@/server/interfaces/AuthenticatedUser";
import { DeckServiceError, requireDeckObjectId } from "./DeckServiceError";
import { DeckUpdateInput, parseDeckCreateInput } from "./DeckValidationService";

export const insertOneDeck = async (deck: Omit<DeckResponse, "_id">): Promise<DeckResponse> => {
  const db = getDatabase();
  const result = await db.collection("decks").insertOne(deck);
  const createdDeck = await getDeckById({ id: deck.userId }, result.insertedId.toString());
  if (!createdDeck) throw new Error("Created deck could not be loaded.");
  return createdDeck;
}

export const getDecksForPlayer = async (user: AuthenticatedUser, legion: string | string[] | undefined): Promise<DeckResponse[]> => {
  const db = getDatabase();
  const query: Filter<DeckResponse> = { userId: user.id };

  if (legion && typeof legion === 'string' && legion.trim() !== '') {
    query['legion'] = legion;
  } else if (legion && Array.isArray(legion)) {
    query['legion'] = { $in: legion };
  }

  const decks = await db.collection<DeckResponse>("decks").find(query).toArray();
  return (await hydrateDecks(decks.reverse())).map(normalizeDeck);
}

/** Compact data for grids and pickers; use getDeckById for a full hydrated deck. */
export const getDeckListSummariesForPlayer = async (user: AuthenticatedUser, legion: string | string[] | undefined): Promise<DeckListItem[]> => {
  const query: Record<string, unknown> = { userId: user.id };
  if (legion && typeof legion === 'string' && legion.trim() !== '') {
    query.legion = legion;
  } else if (legion && Array.isArray(legion)) {
    query.legion = { $in: legion };
  }
  return getDeckListSummaries("decks", query, {sort: {_id: -1}}) as Promise<DeckListItem[]>;
};

/** Compact, bounded Home data. The edited timestamp is included only for this recency surface. */
export const getRecentDeckListSummariesForPlayer = async (user: AuthenticatedUser): Promise<RecentDeckListItem[]> =>
  getDeckListSummaries(
    "decks",
    { userId: user.id },
    { sort: { updated_at: -1, _id: -1 }, limit: 3, includeUpdatedAt: true },
  ) as Promise<RecentDeckListItem[]>;

export const getFilterOptionsForPlayerDecks = async (user: AuthenticatedUser): Promise<string[]> => {
  const db = getDatabase();
  const query = { userId: user.id };
  const legion = await db.collection("decks").distinct("legion", query);
  return legion;
}

export const getDeckById = async (user: AuthenticatedUser, deckId: string): Promise<DeckResponse | null> => {
  // Toolbox imports historically used short external IDs; keep these owner-scoped.
  const query: Filter<DeckResponse> = deckId.length <= 6
    ? { id: deckId, userId: user.id }
    : { _id: requireDeckObjectId(deckId), userId: user.id };
  const deck = await getHydratedDeck<DeckResponse>("decks", query);
  return deck ? normalizeDeck(deck) : null;
}

export const getDeckByName = async (user: AuthenticatedUser, deckName: string): Promise<DeckResponse | null> => {
  const db = getDatabase();
  const query = { name: deckName, userId: user.id };
  const deck = await db.collection<DeckResponse>("decks").findOne(query);
  return deck ? getHydratedDeck<DeckResponse>("decks", { _id: deck._id }) : null;
}

export const updateDeckById = async (user: AuthenticatedUser, deckId: string, updateData: DeckUpdateInput): Promise<DeckResponse | null> => {
  const db = getDatabase();
  const updates: Partial<DeckResponse> = {
    ...updateData,
    updated_at: new Date(),
  };
  delete updates._id;

  const updatedDeck = await db.collection<DeckResponse>("decks").findOneAndUpdate({
    _id: requireDeckObjectId(deckId),
    userId: user.id,
  }, {
    $set: updates,
  }, {
    returnDocument: "after",
  });
  if (!updatedDeck) {
    throw new DeckServiceError("not_found", "Deck not found or you don't have permission to edit this deck");
  }
  return getHydratedDeck<DeckResponse>("decks", { _id: updatedDeck._id, userId: user.id });
}

export const duplicateDeckById = async (user: AuthenticatedUser, deckId: string): Promise<DeckResponse> => {
  const existingDeck = await getDeckById(user, deckId);
  if (!existingDeck) {
    throw new DeckServiceError("not_found", "Deck not found or you don't have permission to duplicate this deck");
  }
  const newDeck: DeckResponse = {
    ...normalizeDeck(existingDeck),
    name: existingDeck.name + " Copy",
    created_at: new Date(),
    updated_at: new Date(),
  };
  delete newDeck._id;
  delete newDeck.cards;
  return insertOneDeck(newDeck);
}

export const createNewDeck = async (user: AuthenticatedUser, value: unknown): Promise<DeckResponse> => {
  const deckData = parseDeckCreateInput(value);
  const existingDeck = await getDeckByName(user, deckData.name);
  if (existingDeck) {
    throw new DeckServiceError("conflict", "You already have a deck with this name. Please choose a different name.");
  }

  const newDeck = {
    name: deckData.name.trim(),
    subtitle: "",
    legion: deckData.legion,
    userId: user.id,
    cards_in_deck: [],
    side_deck: [],
    warlords: [],
    synergies: [],
    veilRealms: [],
    guardians: [],
    tokens: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const createdDeck = await insertOneDeck(newDeck);
  return createdDeck;
}

export const deleteDeckById = async (user: AuthenticatedUser, deckId: string): Promise<void> => {
  if (!deckId) {
    throw new DeckServiceError("invalid_input", "Deck ID is required");
  }
  const db = getDatabase();
  const result = await db.collection("decks").deleteOne({
    _id: requireDeckObjectId(deckId),
    userId: user.id
  });
  if (result.deletedCount === 0) {
    throw new DeckServiceError("not_found", "Deck not found or you don't have permission to delete this deck");
  }
}
