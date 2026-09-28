import axios from "axios";
import { appendQueryParams } from "./string.util";
import BanlistItem from "@/shared/interfaces/BanlistItem.mongo";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import { DeckPatchOperation } from "@/shared/interfaces/DeckPatch";
import { DeckListItem, PublishedDeckListItem, PublishedDeckListResponse } from "@/shared/interfaces/DeckListItem";
const publishedDecksPath = "/api/published_decks";

//cards

export const fetchCards = async ({legion, query, page, pageSize, type, rarity, set, srlStatus}: {legion?: string[], query?: string, page: number, pageSize: number, type?: string[], rarity?: string[], set?: string[], srlStatus?: string[]}): Promise<{cards: [], total: number}> => {
  return new Promise((resolve, reject) => {
    let url = window.location.origin + '/api/cards';
    url = appendQueryParams(url, {legion, page, pageSize, query, type, rarity, set, srlStatus})
    axios.get(url).then(res => resolve({cards: res?.data?.cards, total: res?.data?.total})).catch(err => reject(err));
  })
}

//decks

export const patchDeckById = async (deckId: string, operations: DeckPatchOperation[]): Promise<DeckResponse> => {
  const res = await axios.patch<DeckResponse>(`/api/decks/${deckId}`, operations, {
    headers: { "Content-Type": "application/json-patch+json" },
  });
  return res.data;
}

export const fetchDecks = async (legion: string[] | null, callback: (data: unknown) => void) => {
  const url = appendQueryParams(window.location.origin + '/api/decks', { legion });
  try {
    const res = await axios.get(url);
    callback?.(res?.data);
  } catch (err) {
    console.log(err);
  }
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

export const fetchPublishedDecks = async (legion: string[] | null, callback: (data: unknown) => void) => {
  const url = appendQueryParams(window.location.origin + publishedDecksPath, { legion });
  try {
    const res = await axios.get(url);
    callback?.(res?.data);
  } catch (err) {
    console.log(err);
  }
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

export const fetchPublishedDeckById = async (deckId: string, callback: (data: unknown) => void) => {
  try {
    const res = await axios.get(`${publishedDecksPath}/`+deckId);
    callback?.(res?.data);
  } catch (err) {
    console.log(err);
  }
}

export const createPublishedDeck = async (_id: string, callback: (data: unknown) => void) => {
  try {
    const res = await axios.post(publishedDecksPath, {_id});
    callback?.(res?.data);
    return res?.data?.deck;
  } catch (err) {
    console.log(err);
  }
}

export const copyPublishedDeck = async (publishedDeckId: string, callback: (data: unknown) => void) => {
  try {
    const res = await axios.post(`/api/decks/${publishedDeckId}`);
    callback?.(res?.data);
    return res?.data?.deck;
  } catch (err) {
    console.log(err);
  }
}

export const fetchDeckById = async (deckId: string): Promise<DeckResponse> => {
  const res = await axios.get<DeckResponse>(`/api/decks/${deckId}`);
  return res.data;
}

export const createDeck = async (deckData: {name: string, legion: string}, callback: (data: unknown) => void) => {
  try {
    const res = await axios.post(`/api/decks`, deckData);
    callback?.(res?.data);
    return res?.data?.deck;
  } catch (err) {
    console.log(err);
  }
}

//filters

export const fetchFilterOptions = async (callback: (data: unknown) => void) => {
  const URL = '/api/cards/filterOptions';
  try {
    const res = await axios.get(URL);
    callback?.(res?.data);
  } catch (err) {
    console.log(err);
  }
}

export const fetchDeckFilterOptions = async (callback: (data: unknown) => void) => {
  const URL = '/api/decks/filterOptions';
  try {
    const res = await axios.get(URL);
    callback?.(res?.data);
  } catch (err) {
    console.log(err);
  }
}
export const fetchPublishedDeckFilterOptions = async (callback: (data: unknown) => void) => {
  const URL = window.location.origin + publishedDecksPath + '/filterOptions';
  try {
    const res = await axios.get(URL);
    callback?.(res?.data?.filterOptions);
  } catch (err) {
    console.log(err);
  }
}

export const fetchBanlist = async (callback: (data: unknown) => void) => {
  const URL = '/api/banlist';
  try {
    const res = await axios.get(URL);
    callback?.(res?.data);
  } catch (err) {
    console.log(err);
  }
}

export const postBanlistUpdate = async (banlistData: BanlistItem, callback: (data: unknown) => void) => {
  const URL = '/api/banlist';
  try {
    const res = await axios.post(URL, banlistData);
    callback?.(res?.data);
  } catch (err) {
    console.log(err);
  }
}

export const fetchRecentPublishedDecks = async (): Promise<PublishedDeckListItem[]> => {
  const res = await axios.get(publishedDecksPath, {
    params: { view: "summary", page: 1, limit: 10 },
  });
  return (res.data as PublishedDeckListResponse).decks;
}
