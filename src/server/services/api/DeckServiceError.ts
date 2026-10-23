import { ObjectId } from "mongodb";

type DeckErrorCode = "invalid_input" | "not_found" | "conflict";

/** Expected deck failures; HTTP status mapping belongs in the controller layer. */
export class DeckServiceError extends Error {
  constructor(public readonly code: DeckErrorCode, message: string) {
    super(message);
    this.name = "DeckServiceError";
  }
}

export function requireDeckObjectId(value: string): ObjectId {
  if (typeof value !== "string" || !ObjectId.isValid(value)) {
    throw new DeckServiceError("invalid_input", "Deck ID must be a valid ObjectId.");
  }
  return new ObjectId(value);
}
