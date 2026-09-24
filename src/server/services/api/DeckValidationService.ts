import { cardIdentity, getCombinedCardCounts, getDeckCards, isCardAllowedForDeckLegion, isSideDeckCardTypeAllowed, normalizeDeck, SIDE_DECK_MAX_SIZE } from "@/shared/deckComposition";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import BanlistItem, { BanlistStatus } from "@/shared/interfaces/BanlistItem.mongo";
import { getDatabase } from "@/server/utils/database.util";

export class DeckValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeckValidationError";
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

export function validateDeckCompositionAgainstBanlist(deck: DeckResponse, banlist: BanlistItem[]): void {
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
    const copyLimit = copyLimitFor(identity, banlist);
    if (count > copyLimit) {
      const cardTitle = deckCards.find((card) => cardIdentity(card) === identity)?.title ?? identity;
      throw new DeckValidationError(`${cardTitle} exceeds its ${copyLimit}-copy limit across the main and side decks.`);
    }
  }
}

export async function validateDeckComposition(deck: DeckResponse): Promise<void> {
  const banlist = await getDatabase().collection<BanlistItem>("banlist").find({}).toArray();
  validateDeckCompositionAgainstBanlist(deck, banlist);
}
