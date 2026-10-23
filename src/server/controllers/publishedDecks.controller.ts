import { publishDeck } from "../services/api/DeckPublicationService";
import { ExpressApp } from "../interfaces/ExpressTypes";
import { AuthenticatedRequest, optionalAuth, requireAuth } from "../middleware/auth";
import { Response } from "express";
import { getPublishedDeckById, getPublishedDeckFilterOptions, getPublishedDeckListSummaries, getPublishedDecks } from "../services/api/PublishedDecksService";
import { parsePublishedDeckSummaryPagination } from "../services/api/DeckListSummaryService";

import { deckErrorHandler } from "./deckResponses";
import { DeckServiceError } from "../services/api/DeckServiceError";

export default function publishedDecksController(app: ExpressApp) {
  app.get("/api/published_decks", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const { legion, sort, limit } = req.query;
    const requestedLimit = typeof limit === "string" ? Number.parseInt(limit, 10) : undefined;
    if (req.query.view === "summary") {
      const pagination = parsePublishedDeckSummaryPagination(req.query.page, req.query.limit);
      return res.send(await getPublishedDeckListSummaries(legion as string | string[] | undefined, pagination));
    }
    const decks = await getPublishedDecks(legion as string | string[] | undefined, {
      sortRecent: sort === "recent",
      // Keep the public endpoint bounded even if a caller supplies an invalid or very large value.
      limit: Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : undefined,
    });
    return res.send(decks);
  });

  app.get("/api/published_decks/filterOptions", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const filterOptions = await getPublishedDeckFilterOptions();
    return res.send({ filterOptions });
  });

  app.get("/api/published_decks/:deckId", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const deckId = req.params.deckId.toString();
    if (!deckId || deckId === "undefined") throw new DeckServiceError("invalid_input", "Deck ID is required");

    const deck = await getPublishedDeckById(deckId);
    if (!deck) {
      throw new DeckServiceError("not_found", "Deck not found");
    }
    return res.send(deck);
  });

  app.post("/api/published_decks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const deckId = req.body?._id;
    if (typeof deckId !== "string" || !deckId.trim()) {
      throw new DeckServiceError("invalid_input", "deckId is required");
    }
    const publishedDeck = await publishDeck(req.user!, deckId);
    return res.status(201).json({
      success: true,
      message: "Deck created successfully",
      deck: publishedDeck,
    });
  });

  app.use("/api/published_decks", deckErrorHandler);
}
