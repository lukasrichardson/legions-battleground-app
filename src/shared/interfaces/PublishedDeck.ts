import { DeckResponse } from "./DeckResponse";

export default interface PublishedDeck extends DeckResponse {
  published_date: Date;
  author: string;
}