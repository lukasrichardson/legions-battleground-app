import axios from "axios";
import { appendQueryParams } from "./string.util";
const publishedDecksPath = "/api/published_decks";

//cards

export const fetchCards = async ({legion, query, page, pageSize, type, rarity, set}: {legion?: string[], query?: string, page: number, pageSize: number, type?: string[], rarity?: string[], set?: string[]}): Promise<{cards: [], total: number}> => {
  return new Promise((resolve, reject) => {
    let url = window.location.origin + '/api/cards';
    url = appendQueryParams(url, {legion, page, pageSize, query, type, rarity, set})
    axios.get(url).then(res => resolve({cards: res?.data?.cards, total: res?.data?.total})).catch(err => reject(err));
  })
}

//decks

export const patchDeckById = async (deckId: string, updatedDeck: unknown, callback: (data: unknown) => void) => {
  try {
    const res = await axios.patch(`/api/decks/`+deckId, updatedDeck);
    callback?.(res?.data);
  } catch (err) {
    console.log(err);
  }
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

export const fetchPublishedDecks = async (legion: string[] | null, callback: (data: unknown) => void) => {
  const url = appendQueryParams(window.location.origin + publishedDecksPath, { legion });
  try {
    const res = await axios.get(url);
    callback?.(res?.data);
  } catch (err) {
    console.log(err);
  }
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

export const fetchDeckById = async (deckId: string, callback: (data: unknown) => void) => {
  try {
    const res = await axios.get(`/api/decks/`+deckId);
    callback?.(res?.data);
  } catch (err) {
    console.log(err);
  }
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
export const fetchPublishedDeckFilterOptions = async (legion: string[] | null, callback: (data: unknown) => void) => {
  const URL = window.location.origin + publishedDecksPath + '/filterOptions';
  try {
    const res = await axios.get(URL);
    callback?.(res?.data);
  } catch (err) {
    console.log(err);
  }
}