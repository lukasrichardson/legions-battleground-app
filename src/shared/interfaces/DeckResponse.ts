import { ObjectId } from "mongodb";

export interface ToolboxDeckResponse {
  id?: string | number;
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
interface NamesObject {
  names: string[];
}
export interface HydratedDeckCard {
  _id: string | ObjectId;
  title: string;
  featured_image: string;
  text: string;
  card_code: string;
  legion: NamesObject;
  card_type: NamesObject;
}
export interface DeckResponse {
  _id: ObjectId;
  id?: string;
  name: string;
  subtitle: string;
  legion: string;
  userId?: string;
  /** Canonical persisted references. The API serializes these as hex strings. */
  cards_in_deck: DeckCardId[];
  side_deck?: DeckCardId[];
  /** Resolved catalogue cards returned for screens and game setup; never persisted in a deck. */
  cards?: HydratedDeckCard[];
  created_at: Date;
  updated_at: Date;
}

/** ObjectId in Mongo, serialized hex string at the HTTP boundary. */
export type DeckCardId = ObjectId | string;
