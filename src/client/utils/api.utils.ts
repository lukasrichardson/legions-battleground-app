import axios from "axios";
import { appendQueryParams } from "./string.util";
import BanlistItem from "@/shared/interfaces/BanlistItem.mongo";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import { DeckPatchOperation } from "@/shared/interfaces/DeckPatch";
import { DeckListItem, PublishedDeckListItem, PublishedDeckListResponse } from "@/shared/interfaces/DeckListItem";
import PublishedDeck from "@/shared/interfaces/PublishedDeck";
const publishedDecksPath = "/api/published_decks";

//cards

export const fetchCards = async ({legion, query, page, pageSize, type, rarity, set, srlStatus}: {legion?: string[], query?: string, page: number, pageSize: number, type?: string[], rarity?: string[], set?: string[], srlStatus?: string[]}): Promise<{cards: [], total: number}> => {
  const url = appendQueryParams(`${window.location.origin}/api/cards`, { legion, page, pageSize, query, type, rarity, set, srlStatus });
  const response = await axios.get(url);
  return { cards: response.data?.cards, total: response.data?.total };
};

//decks

export const patchDeckById = async (deckId: string, operations: DeckPatchOperation[]): Promise<DeckResponse> => {
  const res = await axios.patch<DeckResponse>(`/api/decks/${deckId}`, operations, {
    headers: { "Content-Type": "application/json-patch+json" },
  });
  return res.data;
}

export const fetchDeckListSummaries = async (legion: string[] | null): Promise<DeckListItem[]> => {
  const res = await axios.get<DeckListItem[]>("/api/decks", {
    params: { legion, view: "summary" },
    paramsSerializer: { indexes: null },
  });
  return res.data;
}

export const fetchDeckPickerOptions = async (): Promise<Array<{ _id: string; name: string; legion: string }>> => {
  const decks = await fetchDeckListSummaries([]);
  return decks.map((deck) => ({ _id: deck._id.toString(), name: deck.name, legion: deck.legion }));
}

export const fetchPublishedDeckListSummaries = async (
  legion: string[] | null,
  page = 1,
  limit = 24,
): Promise<PublishedDeckListResponse> => {
  const res = await axios.get<PublishedDeckListResponse>(publishedDecksPath, {
    params: { legion, view: "summary", page, limit },
    paramsSerializer: { indexes: null },
  });
  return res.data;
}

export const fetchPublishedDeckById = async (deckId: string): Promise<PublishedDeck> =>
  (await axios.get<PublishedDeck>(`${publishedDecksPath}/${deckId}`)).data;

export const createPublishedDeck = async (_id: string): Promise<PublishedDeck> =>
  (await axios.post<{ deck: PublishedDeck }>(publishedDecksPath, { _id })).data.deck;

export const copyPublishedDeck = async (publishedDeckId: string): Promise<DeckResponse> =>
  (await axios.post<{ deck: DeckResponse }>(`/api/decks/${publishedDeckId}`)).data.deck;

export const fetchDeckById = async (deckId: string): Promise<DeckResponse> => {
  const res = await axios.get<DeckResponse>(`/api/decks/${deckId}`);
  return res.data;
}

export const createDeck = async (deckData: { name: string; legion: string }): Promise<DeckResponse> =>
  (await axios.post<{ deck: DeckResponse }>("/api/decks", deckData)).data.deck;

//filters

export const fetchFilterOptions = async <T = unknown>(): Promise<T> =>
  (await axios.get<T>("/api/cards/filterOptions")).data;

export const fetchDeckFilterOptions = async <T = unknown>(): Promise<T> =>
  (await axios.get<T>("/api/decks/filterOptions")).data;

export const fetchPublishedDeckFilterOptions = async <T = unknown>(): Promise<T> =>
  (await axios.get<{ filterOptions: T }>(`${publishedDecksPath}/filterOptions`)).data.filterOptions;

export const fetchBanlist = async (): Promise<BanlistItem[]> =>
  (await axios.get<BanlistItem[]>("/api/banlist")).data;

export const postBanlistUpdate = async (banlistData: BanlistItem): Promise<BanlistItem[]> =>
  (await axios.post<BanlistItem[]>("/api/banlist", banlistData)).data;

export const fetchRecentPublishedDecks = async (): Promise<PublishedDeckListItem[]> => {
  const res = await axios.get(publishedDecksPath, {
    params: { view: "summary", page: 1, limit: 10 },
  });
  return (res.data as PublishedDeckListResponse).decks;
}
