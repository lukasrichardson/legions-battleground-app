import { cardIdentity, getCombinedCardCounts, getDeckCards, isCardAllowedForDeckLegion, isSideDeckCardTypeAllowed, normalizeDeck, SIDE_DECK_MAX_SIZE } from "@/shared/deckComposition";
import BanlistItem, { BanlistStatus } from "@/shared/interfaces/BanlistItem.mongo";
import { getDatabase } from "@/server/utils/database.util";
import { CardInDeck, DeckResponse } from "@/shared/interfaces/DeckResponse";

const EDITABLE_FIELDS = new Set(["name", "subtitle", "legion", "cards_in_deck", "side_deck"]);
const MAX_NAME_LENGTH = 120;
const MAX_SUBTITLE_LENGTH = 500;
const MAX_LEGION_LENGTH = 100;

export class DeckValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeckValidationError";
  }
}

export type DeckUpdateInput = Partial<Pick<DeckResponse, "name" | "subtitle" | "legion" | "cards_in_deck" | "side_deck">>;

export class DeckUpdateInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeckUpdateInputError";
  }
}

const DEFAULT_COPY_LIMIT = 3;

const copyLimitFor = (cardName: string, banlist: BanlistItem[]): number => {
  const status = banlist.find((item) => item.name.trim().toLocaleLowerCase() === cardName)?.status;
  if (status === BanlistStatus.SUSPENDED) return 0;
  if (status === BanlistStatus.RESTRICTED) return 1;
  if (status === BanlistStatus.LIMITED) return 2;
  return DEFAULT_COPY_LIMIT;
};

function validateDeckCompositionAgainstBanlist(deck: DeckResponse, banlist: BanlistItem[]): void {
  const normalizedDeck = normalizeDeck(deck);
  const deckCards = getDeckCards(normalizedDeck);
  for (const [identity, count] of getCombinedCardCounts(normalizedDeck)) {
    const copyLimit = copyLimitFor(identity, banlist);
    if (count > DEFAULT_COPY_LIMIT) {
      const cardTitle = deckCards.find((card) => cardIdentity(card) === identity)?.title ?? identity;
      throw new DeckValidationError(`${cardTitle} exceeds its ${copyLimit}-copy limit across the main and side decks.`);
    }
  }
}

export function validateBasicDeckComposition(deck: DeckResponse): void {
  if (!Array.isArray(deck.cards_in_deck) || (deck.side_deck !== undefined && !Array.isArray(deck.side_deck))) {
    throw new DeckValidationError("Deck card lists must be arrays.");
  }
  const normalizedDeck = normalizeDeck(deck);
  if (normalizedDeck.side_deck.length > SIDE_DECK_MAX_SIZE) {
    throw new DeckValidationError(`A side deck can contain at most ${SIDE_DECK_MAX_SIZE} cards.`);
  }

  const deckCards = getDeckCards(normalizedDeck);
  for (const card of deckCards) {
    if (!card || typeof card.title !== "string") {
      throw new DeckValidationError("Each deck card must include a title.");
    }
    if (!isCardAllowedForDeckLegion(card, normalizedDeck.legion)) {
      throw new DeckValidationError(`${card.title} is not valid for the ${normalizedDeck.legion} legion.`);
    }
  }

  for (const card of normalizedDeck.side_deck) {
    if (!isSideDeckCardTypeAllowed(card)) {
      throw new DeckValidationError(`${card.title} cannot be placed in a side deck.`);
    }
  }

  for (const [identity, count] of getCombinedCardCounts(normalizedDeck)) {
    if (count > DEFAULT_COPY_LIMIT) {
      const cardTitle = deckCards.find((card) => cardIdentity(card) === identity)?.title ?? identity;
      throw new DeckValidationError(`${cardTitle} exceeds the ${DEFAULT_COPY_LIMIT}-copy limit across the main and side decks.`);
    }
  }
}

export function validateDeckComposition(deck: DeckResponse): void {
  validateBasicDeckComposition(deck);
}

export async function validateDeckLegality(deck: DeckResponse): Promise<void> {
  const db = getDatabase();
  const banlist = await db.collection<BanlistItem>("banlist").find().toArray();
  validateDeckCompositionAgainstBanlist(deck, banlist);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requireText = (value: unknown, field: string, maxLength: number): string => {
  if (typeof value !== "string") throw new DeckUpdateInputError(`${field} must be a string.`);
  const normalized = value.trim();
  if (!normalized) throw new DeckUpdateInputError(`${field} cannot be empty.`);
  if (normalized.length > maxLength) throw new DeckUpdateInputError(`${field} must be at most ${maxLength} characters.`);
  return normalized;
};

const optionalText = (value: unknown, field: string, maxLength: number): string => {
  if (typeof value !== "string") throw new DeckUpdateInputError(`${field} must be a string.`);
  if (value.length > maxLength) throw new DeckUpdateInputError(`${field} must be at most ${maxLength} characters.`);
  return value;
};

const cardList = (value: unknown, field: string): CardInDeck[] => {
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new DeckUpdateInputError(`${field} must be an array of cards.`);
  }
  return value as unknown as CardInDeck[];
};

/** Validates the public PATCH contract and removes all server-managed fields. */
export const parseDeckUpdateInput = (value: unknown): DeckUpdateInput => {
  if (!isRecord(value)) throw new DeckUpdateInputError("Request body must be an object.");

  const fields = Object.keys(value);
  if (!fields.length) throw new DeckUpdateInputError("At least one editable deck field is required.");
  const unexpectedField = fields.find((field) => !EDITABLE_FIELDS.has(field));
  if (unexpectedField) throw new DeckUpdateInputError(`${unexpectedField} cannot be updated.`);

  const update: DeckUpdateInput = {};
  if ("name" in value) update.name = requireText(value.name, "name", MAX_NAME_LENGTH);
  if ("subtitle" in value) update.subtitle = optionalText(value.subtitle, "subtitle", MAX_SUBTITLE_LENGTH);
  if ("legion" in value) update.legion = requireText(value.legion, "legion", MAX_LEGION_LENGTH);
  if ("cards_in_deck" in value) update.cards_in_deck = cardList(value.cards_in_deck, "cards_in_deck");
  if ("side_deck" in value) update.side_deck = cardList(value.side_deck, "side_deck");
  return update;
};
