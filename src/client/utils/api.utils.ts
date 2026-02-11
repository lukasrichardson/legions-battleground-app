import axios from "axios";
import { appendQueryParams } from "./string.util";

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

export const fetchDecks = async (callback: (data: unknown) => void) => {
  try {
    const res = await axios.get(`/api/decks`);
    callback?.(res?.data);
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
  const URL = '/api/filterOptions';
  try {
    const res = await axios.get(URL);
    callback?.(res?.data);
  } catch (err) {
    console.log(err);
  }
}