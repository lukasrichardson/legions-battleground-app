import { getDatabase } from "@/server/utils/database.util";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import PublishedDeck from "@/shared/interfaces/PublishedDeck";
import { getPublishedDeckById } from "./PublishedDecksService";
import { ObjectId } from "mongodb";

export const insertOneDeck = async (deck: Omit<DeckResponse, "_id">): Promise<DeckResponse> => {
  const db = getDatabase();
  const result = await db.collection("decks").insertOne(deck);
  const createdDeck = await getDeckById({ id: deck.userId }, result.insertedId.toString());
  return createdDeck;
}

export const getDecksForPlayer = async (user, legion): Promise<DeckResponse[]> => {
  const db = getDatabase();
  const query = { userId: user?.id };

  if (legion && typeof legion === 'string' && legion.trim() !== '') {
    query['legion'] = legion;
  } else if (legion && Array.isArray(legion)) {
    query['legion'] = { $in: legion };
  }

  const decks = await db.collection<DeckResponse>("decks").find(query).toArray();
  return decks.reverse();
}

export const getFilterOptionsForPlayerDecks = async (user): Promise<string[]> => {
  const db = getDatabase();
  const query = { userId: user?.id };
  const legion = await db.collection("decks").distinct("legion", query);
  return legion;
}

export const getDeckById = async (user, deckId: string): Promise<DeckResponse | null> => {
  const db = getDatabase();
  let deck;
  if (deckId.length > 6) {
    const query = user?.id
      ? { _id: new ObjectId(deckId), userId: user.id }
      : { _id: new ObjectId(deckId) };
    deck = await db.collection("decks").findOne(query);
  } else {
    const query = user?.id
      ? { id: deckId, userId: user.id }
      : { id: deckId };
    deck = await db.collection("decks").findOne(query);
  }
  return deck;
}

export const getDeckByName = async (user, deckName: string): Promise<DeckResponse | null> => {
  const db = getDatabase();
  const query = user?.id
    ? { name: deckName, userId: user.id }
    : { name: deckName };
  const deck = await db.collection<DeckResponse>("decks").findOne(query);
  return deck;
}

export const updateDeckById = async (user, deckId: string, updateData: Partial<DeckResponse>): Promise<DeckResponse | null> => {
  const db = getDatabase();
  const updatedDeck = {
    ...updateData,
    updated_at: new Date(),
  };
  delete updatedDeck._id;
  //
  const result = await db.collection("decks").updateOne({
    _id: new ObjectId(deckId),
    userId: user.id
  }, {
    $set: { ...updatedDeck }
  });
  if (result.modifiedCount === 0) {
    throw new Error("Deck not found or you don't have permission to edit this deck");
  }
  const newUpdatedDeck = await getDeckById(user, deckId);
  return newUpdatedDeck;
}

export const duplicateDeckById = async (user, deckId: string): Promise<DeckResponse> => {
  const db = getDatabase();
  const existingDeck = await getDeckById(user, deckId);
  if (!existingDeck) {
    throw new Error("Deck not found or you don't have permission to duplicate this deck");
  }
  const newDeck: DeckResponse = {
    ...existingDeck,
    name: existingDeck.name + " Copy",
    created_at: new Date(),
    updated_at: new Date(),
  };
  delete newDeck._id;
  // Insert the deck into MongoDB
  const result = await db.collection("decks").insertOne(newDeck);
  const duplicateDeck = await getDeckById(user, result.insertedId.toString());
  return duplicateDeck;
}

export const createNewDeck = async (user, deckData: { name: string; subtitle?: string; legion: string }): Promise<DeckResponse> => {
  if (!deckData.name || typeof deckData.name !== 'string' || deckData.name.trim() === '') {
    throw new Error("Deck name is required and must be a non-empty string");
  }
  if (!deckData.legion || typeof deckData.legion !== 'string' || deckData.legion.trim() === '') {
    throw new Error("Legion is required and must be a non-empty string");
  }

  const existingDeck = await getDeckByName(user, deckData.name.trim());
  if (existingDeck) {
    throw new Error("You already have a deck with this name. Please choose a different name.");
  }

  const newDeck = {
    name: deckData.name.trim(),
    subtitle: "",
    legion: deckData.legion.toLowerCase(),
    userId: user.id,
    cards_in_deck: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const createdDeck = await insertOneDeck(newDeck);
  return createdDeck;
}

export const copyPublishedDeck = async (user, publishedDeckId: string): Promise<DeckResponse> => {
  const existingDeck: PublishedDeck = await getPublishedDeckById(publishedDeckId);
  if (!existingDeck) {
    throw new Error("Published deck not found");
  }
  const newDeck: PublishedDeck = {
    ...existingDeck,
    name: existingDeck.name + " Copy",
    userId: user.id,
    created_at: new Date(),
    updated_at: new Date(),
  };
  delete newDeck._id;
  delete newDeck.published_date;
  delete newDeck.author;

  const insertedDeck = await insertOneDeck(newDeck);
  return insertedDeck;
}

export const deleteDeckById = async (user, deckId: string): Promise<void> => {
  if (!deckId) {
    throw new Error("Deck ID is required");
  }
  const db = getDatabase();
  const result = await db.collection("decks").deleteOne({
    _id: new ObjectId(deckId),
    userId: user.id
  });
  if (result.deletedCount === 0) {
    throw new Error("Deck not found or you don't have permission to delete this deck");
  }
}