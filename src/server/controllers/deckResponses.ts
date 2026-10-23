import { ErrorRequestHandler, Response } from "express";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import { DeckServiceError } from "../services/api/DeckServiceError";
import { DeckValidationError, DeckUpdateInputError } from "../services/api/DeckValidationService";
import { DeckPatchInputError } from "../services/api/DeckPatchService";

/** Keep create, duplicate, and copy responses aligned without leaking hydrated cards. */
export function sendCreatedDeck(res: Response, deck: DeckResponse) {
  return res.status(201).json({
    success: true,
    message: "Deck created successfully",
    deck: {
      _id: deck._id,
      name: deck.name,
      subtitle: deck.subtitle,
      legion: deck.legion,
      userId: deck.userId,
      created_at: deck.created_at,
    },
  });
}

/** Mounted only for deck APIs, after their routes. Express 5 forwards rejected handlers here. */
export const deckErrorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) return next(error);

  if (error && typeof error === "object" && "type" in error && error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Bad request", message: "Request body must contain a JSON object or patch array." });
  }
  if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload too large", message: "Deck request exceeds the body size limit." });
  }
  if (error && typeof error === "object" && "type" in error
    && (error.type === "encoding.unsupported" || error.type === "charset.unsupported")) {
    return res.status(415).json({ error: "Unsupported media type", message: "Deck request uses an unsupported encoding." });
  }

  if (error instanceof DeckServiceError) {
    const status = { invalid_input: 400, not_found: 404, conflict: 409 }[error.code];
    const label = { invalid_input: "Bad request", not_found: "Not found", conflict: "Conflict" }[error.code];
    return res.status(status).json({ error: label, message: error.message });
  }
  if (error instanceof DeckValidationError || error instanceof DeckUpdateInputError || error instanceof DeckPatchInputError) {
    return res.status(400).json({ error: "Bad request", message: error.message });
  }

  console.error("Deck API error:", error);
  if (error && typeof error === "object") {
    if ("code" in error && error.code === 11000) {
      return res.status(409).json({ error: "Conflict", message: "A deck with this ID or name already exists" });
    }
    if ("name" in error && (error.name === "MongoNetworkError" || error.name === "MongoTimeoutError" || error.name === "MongoServerSelectionError")) {
      return res.status(503).json({ error: "Service unavailable", message: "Database connection failed. Please try again later." });
    }
  }
  return res.status(500).json({ error: "Internal server error", message: "An unexpected error occurred while processing the deck request" });
};
