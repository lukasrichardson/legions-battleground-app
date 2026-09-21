const TOOLBOX_DECKS_URL = "https://api.legionstoolbox.com/index.php/wp-json/lraw/v1/decks";

export interface ToolboxCard {
  qty: number;
  image: string;
  type: string;
  id: string;
  code: string;
  thumb: string;
}

export interface ToolboxDeck {
  id: string;
  name: string;
  description?: string;
  legion: string;
  cards_in_deck: ToolboxCard[] | Record<string, ToolboxCard>;
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function isDeckPayload(value: unknown): value is Omit<ToolboxDeck, "id"> {
  return typeof value === "object" && value !== null &&
    typeof (value as { name?: unknown }).name === "string" &&
    typeof (value as { legion?: unknown }).legion === "string" &&
    typeof (value as { cards_in_deck?: unknown }).cards_in_deck === "object";
}

export function parseToolboxDeckResponse(payload: unknown, deckId: string): ToolboxDeck {
  const data = Array.isArray(payload) ? payload[0]?.data : undefined;
  if (!isDeckPayload(data)) throw new Error("Deck not found or Toolbox returned an unexpected response");
  return { ...data, id: deckId };
}

/** Fetches the public Toolbox deck endpoint directly from the user's browser. */
export async function fetchToolboxDeck(deckId: string, request: FetchLike = fetch): Promise<ToolboxDeck> {
  const response = await request(`${TOOLBOX_DECKS_URL}?deck=${encodeURIComponent(deckId)}`, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Toolbox returned HTTP ${response.status}`);
  return parseToolboxDeckResponse(await response.json(), deckId);
}
