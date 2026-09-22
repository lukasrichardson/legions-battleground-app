import { decodeHTMLEntities } from "./string.utils";

/** Shape consumed from the Toolbox cards endpoint. Fields we persist are kept explicit here. */
export type ToolboxCard = {
  id: string | number;
  title: string;
  thumb: string;
  content: { text: string; paragraphs: unknown; lines: unknown; html: unknown };
  meta: { card_code: unknown; card_release: unknown };
  taxonomies: Record<string, { names: unknown; slugs: unknown }>;
  permalink: unknown;
  attack: unknown;
};

function taxonomy(card: ToolboxCard, name: string) {
  const value = card.taxonomies[name];
  if (!value) throw new Error(`Toolbox card ${card.id} is missing the ${name} taxonomy`);
  return { names: value.names, slugs: value.slugs };
}

/** Map a Toolbox response into the document format used by the cards collection. */
export function mapToolboxCard(card: ToolboxCard, featuredImageUrl: string) {
  return {
    id: card.id,
    title: decodeHTMLEntities(card.title),
    featured_image: featuredImageUrl,
    text: decodeHTMLEntities(card.content.text),
    content: {
      paragraphs: card.content.paragraphs,
      lines: card.content.lines,
      html: card.content.html,
    },
    card_code: card.meta.card_code,
    card_release: card.meta.card_release,
    legion: taxonomy(card, "legion"),
    set: taxonomy(card, "set"),
    variant: taxonomy(card, "variant"),
    rarity: taxonomy(card, "rarity"),
    card_type: taxonomy(card, "card_type"),
    card_subtype: taxonomy(card, "card_subtype"),
    card_srl: taxonomy(card, "card_srl"),
    keywords: taxonomy(card, "keywords"),
    permalink: card.permalink,
    attack: card.attack,
  };
}
