import { ExpressApp } from "../interfaces/ExpressTypes";
import { AuthenticatedRequest, optionalAuth, requireAuth } from "../middleware/auth";
import { Response } from 'express';
import { getPublishedDeckById, getPublishedDeckFilterOptions, getPublishedDecks, publishDeck } from "../services/api/PublishedDecksService";

export default function publishedDecksController(app: ExpressApp) {

  app.get("/api/published_decks", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {    
    const {legion} = req.query;
    const decks = await getPublishedDecks(legion);
    return res.send(decks);
  }
  );

  app.get("/api/published_decks/filterOptions", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const filterOptions = await getPublishedDeckFilterOptions();
    return res.send({filterOptions});
  }
  );

  app.get("/api/published_decks/:deckId", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const deckId = req.params.deckId.toString();
    if (!deckId || deckId === "undefined") return res.status(400).send("Deck ID is required");
    
    const deck = await getPublishedDeckById(deckId);
    if (!deck) {
      return res.status(404).send("Deck not found");
    }
    return res.send(deck);
  }
  );

  app.post("/api/published_decks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const deckId: string = req.body._id;
        if (!deckId || typeof deckId !== 'string' || deckId.trim() === '') return res.status(400).json({ 
          error: "Bad request", 
          message: "deckId is required" 
        });
  
        // Insert the deck into MongoDB
        const publishedDeck = await publishDeck(req.user, deckId);
        
        if (!publishedDeck) {
          return res.status(500).json({ 
            error: "Internal server error", 
            message: "Failed to create deck in database" 
          });
        }
  
        // Return success response with deck ID
        return res.status(201).json({
          success: true,
          message: "Deck created successfully",
          deck: publishedDeck
        });
  
      } catch (error: unknown) {
        console.error("Error publishing deck:", error);
        
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
          message: "An unexpected error occurred while publishing the deck" 
        });
      }
    });
}