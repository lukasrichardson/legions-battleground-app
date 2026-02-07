import { ObjectId } from "mongodb";

export interface ToolboxDeckResponse {
  id?: string;
  name: string;
  subtitle: string;
  legion: string;
  userId?: string;
  cards_in_deck: {
    [key: string]: {
      name: string;
      code: string;
      image: string;
      legion: string;
      set: string;
      variant: string;
      rarity: string;
      type: string;
      qty: number;
    }
  }
}
interface NamesSlugsObject {
  names: string[];
  slugs: string[];
}
export interface CardInDeck {

  _id: string;
  id?: string;
  title: string;
  featured_image: string;
  content: {
    paragraphs: string[];
    lines: string[];
    html: string;
  };
  permalink: string;
  attack?: number;
  text: string;
  card_code: string;
  card_release: string;
  legion: NamesSlugsObject;
  set: NamesSlugsObject;
  variant: NamesSlugsObject;
  rarity: NamesSlugsObject;
  card_type: NamesSlugsObject;
  card_subtype: NamesSlugsObject;
  card_srl: NamesSlugsObject;
  keywords: NamesSlugsObject;
}
export interface DeckResponse {
  _id: ObjectId;
  id?: string;
  name: string;
  subtitle: string;
  legion: string;
  userId?: string;
  cards_in_deck: CardInDeck[];
  created_at: Date;
  updated_at: Date;
}