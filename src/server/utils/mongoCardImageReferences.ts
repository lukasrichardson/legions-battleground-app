import type { Db } from "mongodb";
import { toR2ObjectKey } from "./r2CardImageSync";

export type ReferenceUpdateCounts = {
  cards: number;
  decks: number;
};

/**
 * The catalogue changes over time, so existing cards/decks are also a migration
 * source. This catches historical full-size and thumbnail URLs no longer exposed
 * by the current Toolbox response.
 */
export async function getStoredToolboxImageUrls(database: Db): Promise<string[]> {
  const toolboxUrl = /^https:\/\/api\.legionstoolbox\.com\//;
  const [cardUrls, deckUrls] = await Promise.all([
    database.collection("cards").aggregate<{ _id: string }>([
      { $match: { featured_image: toolboxUrl } },
      { $group: { _id: "$featured_image" } },
    ]).toArray(),
    database.collection("decks").aggregate<{ _id: string }>([
      { $unwind: "$cards_in_deck" },
      { $match: { "cards_in_deck.featured_image": toolboxUrl } },
      { $group: { _id: "$cards_in_deck.featured_image" } },
    ]).toArray(),
  ]);
  return [...new Set([...cardUrls, ...deckUrls].map(({ _id }) => _id).filter(
    (value): value is string => typeof value === "string" && Boolean(toR2ObjectKey(value)),
  ))];
}

/** Update only exact, known Toolbox URLs after their R2 replacement has been confirmed. */
export async function updateCardImageReferences(
  database: Db,
  sourceUrl: string,
  publicR2Url: string,
): Promise<ReferenceUpdateCounts> {
  const cards = await database.collection("cards").updateMany(
    { featured_image: sourceUrl },
    { $set: { featured_image: publicR2Url } },
  );
  const decks = await database.collection("decks").updateMany(
    { "cards_in_deck.featured_image": sourceUrl },
    { $set: { "cards_in_deck.$[card].featured_image": publicR2Url } },
    { arrayFilters: [{ "card.featured_image": sourceUrl }] },
  );
  return { cards: cards.modifiedCount, decks: decks.modifiedCount };
}
