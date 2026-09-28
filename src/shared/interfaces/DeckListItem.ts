import { ObjectId } from "mongodb";

export type DeckListCoverCard = {
  _id: ObjectId | string;
  title: string;
  featured_image: string;
};

export type DeckListItem = {
  _id: ObjectId | string;
  name: string;
  legion: string;
  mainDeckSize: number;
  sideDeckSize: number;
  coverCard: DeckListCoverCard | null;
};

export type PublishedDeckListItem = DeckListItem & {
  author: string;
  published_date: Date | string;
};

export type PublishedDeckListResponse = {
  decks: PublishedDeckListItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};
