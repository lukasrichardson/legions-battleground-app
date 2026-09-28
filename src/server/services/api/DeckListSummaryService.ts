import { getDatabase } from "@/server/utils/database.util";
import { DeckListCoverCard, DeckListItem, PublishedDeckListItem } from "@/shared/interfaces/DeckListItem";
import { ObjectId } from "mongodb";

type DeckCollectionName = "decks" | "published_decks";
type DeckSummaryRecord = Omit<DeckListItem, "coverCard"> & {
  coverCardId?: ObjectId | string;
  author?: string;
  published_date?: Date;
};

const COVER_CARD_PROJECTION = { _id: 1, title: 1, featured_image: 1 } as const;
const DEFAULT_PUBLIC_PAGE_SIZE = 24;
const MAX_PUBLIC_PAGE_SIZE = 48;

const positiveInteger = (value: unknown, fallback: number): number => {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const parsePublishedDeckSummaryPagination = (pageValue: unknown, limitValue: unknown) => ({
  page: positiveInteger(pageValue, 1),
  limit: Math.min(positiveInteger(limitValue, DEFAULT_PUBLIC_PAGE_SIZE), MAX_PUBLIC_PAGE_SIZE),
});

/** Reads list-only data without hydrating every catalogue card referenced by every deck. */
export const getDeckListSummaries = async (
  collectionName: DeckCollectionName,
  match: Record<string, unknown>,
  options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> } = {},
): Promise<Array<DeckListItem | PublishedDeckListItem>> => {
  const pipeline: Record<string, unknown>[] = [{ $match: match }];
  if (options.sort) pipeline.push({ $sort: options.sort });
  pipeline.push({
    $project: {
      _id: 1,
      name: 1,
      legion: 1,
      author: 1,
      published_date: 1,
      mainDeckSize: {
        $add: [
          { $size: { $ifNull: ["$cards_in_deck", []] } },
          { $size: { $ifNull: ["$warlords", []] } },
          { $size: { $ifNull: ["$synergies", []] } },
          { $size: { $ifNull: ["$veilRealms", []] } },
          { $size: { $ifNull: ["$guardians", []] } },
        ],
      },
      sideDeckSize: { $size: { $ifNull: ["$side_deck", []] } },
      coverCardId: {
        $ifNull: [
          { $arrayElemAt: [{ $ifNull: ["$warlords", []] }, 0] },
          { $arrayElemAt: [{ $ifNull: ["$cards_in_deck", []] }, 0] },
        ],
      },
    },
  });
  if (options.skip) pipeline.push({ $skip: options.skip });
  if (options.limit) pipeline.push({ $limit: options.limit });

  const db = getDatabase();
  const decks = await db.collection<DeckSummaryRecord>(collectionName).aggregate<DeckSummaryRecord>(pipeline).toArray();
  const coverIds = [...new Map(
    decks
      .map((deck) => deck.coverCardId)
      .map((id) => id instanceof ObjectId ? id : typeof id === "string" && ObjectId.isValid(id) ? new ObjectId(id) : null)
      .filter((id): id is ObjectId => id !== null)
      .map((id) => [id.toString(), id]),
  ).values()];
  const cards = coverIds.length
    ? await db.collection<DeckListCoverCard>("cards").find(
      { _id: { $in: coverIds } },
      { projection: COVER_CARD_PROJECTION },
    ).toArray()
    : [];
  const coversById = new Map(cards.map((card) => [card._id.toString(), card]));

  return decks.map((deck) => {
    const coverCard = deck.coverCardId ? coversById.get(deck.coverCardId.toString()) ?? null : null;
    const summary: DeckListItem = {
      _id: deck._id,
      name: deck.name,
      legion: deck.legion,
      mainDeckSize: deck.mainDeckSize,
      sideDeckSize: deck.sideDeckSize,
      coverCard,
    };
    return collectionName === "published_decks"
      ? { ...summary, author: deck.author ?? "Unknown Author", published_date: deck.published_date ?? new Date(0) }
      : summary;
  });
};
