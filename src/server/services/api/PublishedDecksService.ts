import { getDatabase } from "@/server/utils/database.util";
import PublishedDeck from "@/shared/interfaces/PublishedDeck";
import { Filter } from "mongodb";
import { normalizeDeck } from "@/shared/deckComposition";
import { getHydratedDeck, hydrateDecks } from "./DeckHydrationService";
import { getDeckListSummaries } from "./DeckListSummaryService";
import { PublishedDeckListItem, PublishedDeckListResponse } from "@/shared/interfaces/DeckListItem";

import { requireDeckObjectId } from "./DeckServiceError";

export const insertOnePublishedDeck = async (deck: Omit<PublishedDeck, "_id">): Promise<PublishedDeck> => {
  const db = getDatabase();
  const result = await db.collection("published_decks").insertOne(deck);
  const createdDeck = await getPublishedDeckById(result.insertedId.toString());
  if (!createdDeck) throw new Error("Published deck could not be loaded.");
  return createdDeck;
}

export const getPublishedDeckById = async (deckId: string): Promise<PublishedDeck | null> => {
  const query = { _id: requireDeckObjectId(deckId) };
  const deck = await getHydratedDeck<PublishedDeck>("published_decks", query);
  return deck ? normalizeDeck(deck) : null;
}

export const getPublishedDeckByName = async (deckName: string): Promise<PublishedDeck | null> => {
  const db = getDatabase();
  const query = { name: deckName };
  const deck = await db.collection<PublishedDeck>("published_decks").findOne(query);
  return deck ? getHydratedDeck<PublishedDeck>("published_decks", { _id: deck._id }) : null;
}

type PublishedDeckListOptions = {
  sortRecent?: boolean;
  limit?: number;
};

export const getPublishedDecks = async (legion: string | string[] | undefined, options: PublishedDeckListOptions = {}): Promise<PublishedDeck[]> => {
  const query: Filter<PublishedDeck> = {};
  if (legion && typeof legion === 'string' && legion.trim() !== '') {
    query['legion'] = legion;
  } else if (legion && Array.isArray(legion)) {
    query['legion'] = { $in: legion };
  }
  const db = getDatabase();
  const cursor = db.collection<PublishedDeck>("published_decks").find(query);

  if (options.sortRecent) {
    cursor.sort({ published_date: -1 });
  }

  if (options.limit) {
    cursor.limit(options.limit);
  }

  const decks = await cursor.toArray();
  return (await hydrateDecks(decks)).map(normalizeDeck);
}

export const getPublishedDeckListSummaries = async (
  legion: string | string[] | undefined,
  options: { page: number; limit: number },
): Promise<PublishedDeckListResponse> => {
  const query: Record<string, unknown> = {};
  if (legion && typeof legion === "string" && legion.trim() !== "") {
    query.legion = legion;
  } else if (Array.isArray(legion)) {
    query.legion = { $in: legion };
  }
  const db = getDatabase();
  const total = await db.collection("published_decks").countDocuments(query);
  const decks = await getDeckListSummaries("published_decks", query, {
    sort: { published_date: -1, _id: -1 },
    skip: (options.page - 1) * options.limit,
    limit: options.limit,
  }) as PublishedDeckListItem[];
  return {
    decks,
    page: options.page,
    limit: options.limit,
    total,
    hasMore: options.page * options.limit < total,
  };
};

export const getPublishedDeckFilterOptions = async (): Promise<{ legion: string[] }> => {
  const db = getDatabase();
  const legion = await db.collection("published_decks").distinct("legion");
  return { legion };
}
