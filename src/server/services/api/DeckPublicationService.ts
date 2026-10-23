import { AuthenticatedUser } from "@/server/interfaces/AuthenticatedUser";
import { normalizeDeck } from "@/shared/deckComposition";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import PublishedDeck from "@/shared/interfaces/PublishedDeck";
import { getAliasForUser } from "./AliasService";
import { getDeckById, insertOneDeck } from "./DecksService";
import { getPublishedDeckById, getPublishedDeckByName, insertOnePublishedDeck } from "./PublishedDecksService";
import { DeckServiceError } from "./DeckServiceError";

// Workflows spanning private and published decks live here so the two stores do not depend on each other.
export const copyPublishedDeck = async (user: AuthenticatedUser, publishedDeckId: string): Promise<DeckResponse> => {
  const existingDeck: PublishedDeck = await getPublishedDeckById(publishedDeckId);
  if (!existingDeck) {
    throw new DeckServiceError("not_found", "Published deck not found");
  }
  const newDeck: PublishedDeck = {
    ...normalizeDeck(existingDeck),
    name: existingDeck.name + " Copy",
    userId: user.id,
    created_at: new Date(),
    updated_at: new Date(),
  };
  delete newDeck._id;
  delete newDeck.cards;
  delete newDeck.published_date;
  delete newDeck.author;

  const insertedDeck = await insertOneDeck(newDeck);
  return insertedDeck;
}

export const publishDeck = async (user: AuthenticatedUser, deckId: string): Promise<PublishedDeck> => {
  const existingDeck = await getDeckById({ id: user.id }, deckId);
  if (!existingDeck) {
    throw new DeckServiceError("not_found", "Deck not found");
  }
  const existingPublishedDeck = await getPublishedDeckByName(existingDeck.name);
  if (existingPublishedDeck) {
    throw new DeckServiceError("conflict", "A Published deck with this name already exists");
  }
  const alias = await getAliasForUser(user.id);

  const newPublishedDeck: PublishedDeck = {
    ...normalizeDeck(existingDeck),
    name: existingDeck.name,
    published_date: new Date(),
    author: alias ?? user.name ?? user.email ?? "Unknown Author",
  };
  delete newPublishedDeck._id;
  delete newPublishedDeck.cards;
  const createdDeck = await insertOnePublishedDeck(newPublishedDeck);
  return createdDeck;
}
