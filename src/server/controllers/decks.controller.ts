import { ExpressApp } from "../interfaces/ExpressTypes";
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { Response } from 'express';
import { createNewDeck,
  duplicateDeckById,
  getDeckById,
  getDecksForPlayer,
  getFilterOptionsForPlayerDecks,
  updateDeckById,
  copyPublishedDeck,
  deleteDeckById
} from "../services/api/DecksService";

export default function decksController(app: ExpressApp) {

  app.get("/api/decks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {

    const { legion } = req.query;
    const decks = await getDecksForPlayer(req.user, legion as string | string[] | undefined);

    return res.send(decks);
  }
  );


  app.get("/api/decks/filterOptions", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const legion = await getFilterOptionsForPlayerDecks(req.user);
    return res.send({ legion });
  }
  );

  app.get("/api/decks/:deckId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {

    const deckId = req.params.deckId.toString();
    if (!deckId || deckId === "undefined") return res.status(400).send("Deck ID is required");

    const deck = await getDeckById(req.user, deckId);

    if (!deck) {
      return res.status(404).send("Deck not found");
    }
    return res.send(deck);
  }
  );

  app.patch("/api/decks/:deckId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const deckId = req.params.deckId;
    if (!deckId) return res.status(400).send("Deck ID is required");

    const existingDeck = await getDeckById(req.user, deckId);
    if (!existingDeck) {
      return res.status(404).send("Deck not found or you don't have permission to edit this deck");
    }

    const updatedDeck = await updateDeckById(req.user, deckId, req.body);
    if (!updatedDeck) {
      return res.status(404).send("Deck not found or no changes made");
    }

    return res.send(updatedDeck);
  }
  );

  app.post("/api/decks/:deckId/duplicate", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {

      const duplicateDeck = await duplicateDeckById(req.user, req.params.deckId);

      if (!duplicateDeck) {
        return res.status(500).json({
          error: "Internal server error",
          message: "Failed to create deck in database"
        });
      }

      // Return success response with deck ID
      return res.status(201).json({
        success: true,
        message: "Deck created successfully",
        deck: {
          _id: duplicateDeck._id,
          name: duplicateDeck.name,
          subtitle: duplicateDeck.subtitle,
          legion: duplicateDeck.legion,
          userId: duplicateDeck.userId,
          created_at: duplicateDeck.created_at
        }
      });

    } catch (error: unknown) {
      console.error("Error creating deck:", error);

      // Handle specific MongoDB errors
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return res.status(409).json({
          error: "Conflict",
          message: "A deck with this ID or name already exists"
        });
      }

      // Handle connection errors
      if (error && typeof error === 'object' && 'name' in error &&
        (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError')) {
        return res.status(503).json({
          error: "Service unavailable",
          message: "Database connection failed. Please try again later."
        });
      }

      // Generic server error
      return res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred while creating the deck"
      });
    }
  });

  app.post("/api/decks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const createdDeck = await createNewDeck(req.user, req.body);
      if (!createdDeck) {
        return res.status(500).json({
          error: "Internal server error",
          message: "Failed to create deck in database"
        });
      }

      return res.status(201).json({
        success: true,
        message: "Deck created successfully",
        deck: {
          _id: createdDeck._id,
          name: createdDeck.name,
          subtitle: createdDeck.subtitle,
          legion: createdDeck.legion,
          userId: createdDeck.userId,
          created_at: createdDeck.created_at
        }
      });

    } catch (error: unknown) {
      console.error("Error creating deck:", error);

      // Handle specific MongoDB errors
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return res.status(409).json({
          error: "Conflict",
          message: "A deck with this ID or name already exists"
        });
      }

      // Handle connection errors
      if (error && typeof error === 'object' && 'name' in error &&
        (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError')) {
        return res.status(503).json({
          error: "Service unavailable",
          message: "Database connection failed. Please try again later."
        });
      }

      // Generic server error
      return res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred while creating the deck"
      });
    }
  });

  app.post("/api/decks/:publishedDeckId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const copiedDeck = await copyPublishedDeck(req.user, req.params.publishedDeckId);
      if (!copiedDeck) {
        return res.status(500).json({
          error: "Internal server error",
          message: "Failed to create deck in database"
        });
      }

      return res.status(201).json({
        success: true,
        message: "Deck created successfully",
        deck: {
          _id: copiedDeck._id,
          name: copiedDeck.name,
          subtitle: copiedDeck.subtitle,
          legion: copiedDeck.legion,
          userId: copiedDeck.userId,
          created_at: copiedDeck.created_at
        }
      });

    } catch (error: unknown) {
      console.error("Error creating deck:", error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return res.status(409).json({
          error: "Conflict",
          message: "A deck with this ID or name already exists"
        });
      }

      if (error && typeof error === 'object' && 'name' in error &&
        (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError')) {
        return res.status(503).json({
          error: "Service unavailable",
          message: "Database connection failed. Please try again later."
        });
      }

      return res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred while creating the deck"
      });
    }
  });

  app.delete("/api/decks/:deckId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const deckId = req.params.deckId;
    await deleteDeckById(req.user, deckId);
    return res.send({ success: true });
  });
}