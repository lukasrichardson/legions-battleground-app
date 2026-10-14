import { normalizeDeck, SPECIAL_MAIN_DECK_FIELDS, type SpecialMainDeckField } from "@/shared/deckComposition";
import { DeckCardId, DeckResponse, HydratedDeckCard } from "@/shared/interfaces/DeckResponse";

const sectionLabels: Record<SpecialMainDeckField, string> = {
  warlords: "Warlord",
  synergies: "Synergy",
  veilRealms: "Veil / Realm",
  guardians: "Guardian",
};

const cardsForIds = (ids: DeckCardId[], cards: HydratedDeckCard[] = []): HydratedDeckCard[] => {
  const cardsById = new Map(cards.map((card) => [card._id.toString(), card]));
  return ids.flatMap((id) => {
    const card = cardsById.get(id.toString());
    return card ? [card] : [];
  });
};

const cardLines = (cards: HydratedDeckCard[]): string[] => {
  const grouped = new Map<string, { title: string; quantity: number }>();
  for (const card of cards) {
    const title = card.title?.trim() || "Unnamed card";
    const key = title.toLocaleLowerCase();
    const existing = grouped.get(key);
    if (existing) existing.quantity += 1;
    else grouped.set(key, { title, quantity: 1 });
  }
  return [...grouped.values()].map(({ title, quantity }) => `- ${quantity}x ${title}`);
};

const section = (title: string, cards: HydratedDeckCard[]): string[] => {
  if (!cards.length) return [];
  return [`## ${title} (${cards.length})`, "", ...cardLines(cards), ""];
};

/** Converts a hydrated personal deck into a portable, human-readable Markdown deck list. */
export const deckToMarkdown = (deck: DeckResponse): string => {
  const normalizedDeck = normalizeDeck(deck);
  const parts = [
    `# ${deck.name?.trim() || "Untitled deck"}`,
    "",
    ...(deck.subtitle?.trim() ? [deck.subtitle.trim(), ""] : []),
    `**Legion:** ${deck.legion}`,
    "",
    ...section("Main Deck", cardsForIds(normalizedDeck.cards_in_deck, deck.cards)),
  ];

  for (const field of SPECIAL_MAIN_DECK_FIELDS) {
    parts.push(...section(sectionLabels[field], cardsForIds(normalizedDeck[field], deck.cards)));
  }
  parts.push(...section("Side Deck", cardsForIds(normalizedDeck.side_deck, deck.cards)));

  return `${parts.join("\n").trimEnd()}\n`;
};

export const deckMarkdownFilename = (deckName: string): string => {
  const filename = deckName
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${filename || "deck"}.md`;
};

/** Downloads Markdown in the browser without storing it on the server. */
export const downloadDeckMarkdown = (deck: DeckResponse): void => {
  const blob = new Blob([deckToMarkdown(deck)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = deckMarkdownFilename(deck.name);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
