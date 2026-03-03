import { getDatabase } from "@/server/utils/database.util";
import PublishedDeck from "@/shared/interfaces/PublishedDeck";
import { ObjectId } from "mongodb";
import { getDeckById } from "./DecksService";

export const insertOnePublishedDeck = async (deck: Omit<PublishedDeck, "_id">): Promise<PublishedDeck> => {
  const db = getDatabase();
  const result = await db.collection("published_decks").insertOne(deck);
  const createdDeck = await getPublishedDeckById(result.insertedId.toString());
  return createdDeck;
}

export const getPublishedDeckById = async (deckId: string): Promise<PublishedDeck | null> => {
  const db = getDatabase();
  const query = { _id: new ObjectId(deckId) };
  const deck = await db.collection<PublishedDeck>("published_decks").findOne(query);
  return deck;
}

export const getPublishedDeckByName = async (deckName: string): Promise<PublishedDeck | null> => {
  const db = getDatabase();
  const query = { name: deckName };
  const deck = await db.collection<PublishedDeck>("published_decks").findOne(query);
  return deck;
}

export const getPublishedDecks = async (legion): Promise<PublishedDeck[]> => {
  const query = {};
  if (legion && typeof legion === 'string' && legion.trim() !== '') {
    query['legion'] = legion;
  } else if (legion && Array.isArray(legion)) {
    query['legion'] = { $in: legion };
  }
  const db = getDatabase();
  const decks = await db.collection<PublishedDeck>("published_decks").find(query).toArray();
  return decks;
}

export const getPublishedDeckFilterOptions = async (): Promise<{ legion: string[] }> => {
  const db = getDatabase();
  const legion = await db.collection("published_decks").distinct("legion");
  return { legion };
}

export const publishDeck = async (user, deckId: string): Promise<PublishedDeck> => {
  const existingDeck = await getDeckById({ id: user.id }, deckId);
  if (!existingDeck) {
    throw new Error("Deck not found");
  }
  const existingPublishedDeck = await getPublishedDeckByName(existingDeck.name);
  if (existingPublishedDeck) {
    throw new Error("A Published deck with this name already exists");
  }

  const newPublishedDeck: PublishedDeck = {
    ...existingDeck,
    name: existingDeck.name,
    published_date: new Date(),
    author: user.name || "Unknown Author",
  };
  delete newPublishedDeck._id;
  const createdDeck = await insertOnePublishedDeck(newPublishedDeck);
  return createdDeck;
}