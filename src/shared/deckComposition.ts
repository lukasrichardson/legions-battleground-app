import { CARD_TYPE } from "./enums/CardType";
import { ObjectId } from "mongodb";
import { DeckCardId, DeckResponse, HydratedDeckCard } from "./interfaces/DeckResponse";

export const SIDE_DECK_MAX_SIZE = 15;
export const SPECIAL_MAIN_DECK_FIELDS = ["warlords", "synergies", "veilRealms", "guardians"] as const;
export type SpecialMainDeckField = typeof SPECIAL_MAIN_DECK_FIELDS[number];

export const specialMainDeckFieldForCardType = (cardType: string | undefined): SpecialMainDeckField | null => {
  if (cardType === CARD_TYPE.WARLORD) return "warlords";
  if (cardType === CARD_TYPE.SYNERGY) return "synergies";
  if (cardType === CARD_TYPE.VEIL_REALM) return "veilRealms";
  if (cardType === CARD_TYPE.GUARDIAN) return "guardians";
  return null;
};

const SIDE_DECK_EXCLUDED_TYPES = new Set<string>([
  CARD_TYPE.WARLORD,
  CARD_TYPE.TOKEN,
  CARD_TYPE.VEIL_REALM,
]);

const cardIds = (value: unknown): DeckCardId[] => Array.isArray(value) ? value as DeckCardId[] : [];

export const normalizeDeck = <T extends DeckResponse>(deck: T): T & {
  side_deck: DeckCardId[];
  warlords: DeckCardId[];
  synergies: DeckCardId[];
  veilRealms: DeckCardId[];
  guardians: DeckCardId[];
} => ({
  ...deck,
  cards_in_deck: cardIds(deck.cards_in_deck),
  side_deck: cardIds(deck.side_deck),
  warlords: cardIds(deck.warlords),
  synergies: cardIds(deck.synergies),
  veilRealms: cardIds(deck.veilRealms),
  guardians: cardIds(deck.guardians),
});

export const cardIdentity = (card: Pick<HydratedDeckCard, "title">): string => card.title.trim().toLocaleLowerCase();

export const cardId = (id: ObjectId | string): string => id.toString();

export const getCardsForIds = (ids: DeckCardId[], cards: HydratedDeckCard[] = []): HydratedDeckCard[] => {
  const byId = new Map(cards.map((card) => [card._id.toString(), card]));
  return ids.map((id) => {
    const card = byId.get(cardId(id));
    if (!card) throw new Error(`Deck references unavailable card ${cardId(id)}`);
    return card;
  });
};

export const getOrdinaryMainDeckCards = (deck: DeckResponse): HydratedDeckCard[] =>
  getCardsForIds(normalizeDeck(deck).cards_in_deck, deck.cards);

export const getSpecialMainDeckCards = (deck: DeckResponse, field: SpecialMainDeckField): HydratedDeckCard[] =>
  getCardsForIds(normalizeDeck(deck)[field], deck.cards);

export const getMainDeckCards = (deck: DeckResponse): HydratedDeckCard[] => {
  const normalizedDeck = normalizeDeck(deck);
  return [
    ...getCardsForIds(normalizedDeck.cards_in_deck, normalizedDeck.cards),
    ...SPECIAL_MAIN_DECK_FIELDS.flatMap((field) => getCardsForIds(normalizedDeck[field], normalizedDeck.cards)),
  ];
};

export const getSideDeckCards = (deck: DeckResponse): HydratedDeckCard[] =>
  getCardsForIds(normalizeDeck(deck).side_deck, deck.cards);

export const getDeckCards = (deck: DeckResponse): HydratedDeckCard[] => [
  ...getMainDeckCards(deck),
  ...getSideDeckCards(deck),
];

export const getCombinedCardCounts = (deck: DeckResponse): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const card of getDeckCards(deck)) {
    const identity = cardIdentity(card);
    counts.set(identity, (counts.get(identity) ?? 0) + 1);
  }
  return counts;
};

export const isSideDeckCardTypeAllowed = (card: HydratedDeckCard): boolean =>
  !SIDE_DECK_EXCLUDED_TYPES.has(card.card_type?.names?.[0]);

const normalizeLegion = (legion: string): string => legion.trim().toLocaleLowerCase().replace(/[-\s]+/g, " ");

export const isCardAllowedForDeckLegion = (card: HydratedDeckCard, deckLegion: string): boolean => {
  const cardLegion = card.legion?.names?.[0];
  if (!cardLegion) return false;

  const normalizedDeckLegion = normalizeLegion(deckLegion);
  const normalizedCardLegion = normalizeLegion(cardLegion);
  return normalizedCardLegion === "bounty"
    || normalizedCardLegion === normalizedDeckLegion;
};
