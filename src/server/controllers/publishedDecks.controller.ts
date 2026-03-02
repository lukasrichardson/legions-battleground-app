import { ExpressApp } from "../interfaces/ExpressTypes";
import { AuthenticatedRequest, optionalAuth, requireAuth } from "../middleware/auth";
import { getDatabase } from "../utils/database.util";
import { Response } from 'express';
import { ObjectId } from 'mongodb';

import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import PublishedDeck from "@/shared/interfaces/PublishedDeck";

export default function publishedDecksController(app: ExpressApp) {
  app.get("/api/published_decks", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {    
    const db = getDatabase();
    const {legion} = req.query;
    const query = {};
    if (legion && typeof legion === 'string' && legion.trim() !== '') {
      query['legion'] = legion;
    } else if (legion && Array.isArray(legion)) {
      query['legion'] = { $in: legion };
    }
    const decks = await db.collection("published_decks").find(query).toArray();
    return res.send(decks);
  }
  );

  app.get("/api/published_decks/filterOptions", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const legion = await db.collection("published_decks").distinct("legion");
    return res.send({legion});
  }
  );

  app.get("/api/published_decks/:deckId", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const deckId = req.params.deckId.toString();
    if (!deckId || deckId === "undefined") return res.status(400).send("Deck ID is required");
    
    const query = { _id: new ObjectId(deckId) };
    const deck = await db.collection("published_decks").findOne(query);
    
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
        
        const db = getDatabase();
        
        // Check if deck with same deckId
        const existingDeck: DeckResponse = await db.collection<DeckResponse>("decks").findOne({ 
          _id: new ObjectId(deckId),
        });
        if (!existingDeck) {
          return res.status(400).json({ 
            error: "Bad request", 
            message: `cant find deck` 
          });
        }
        const existingPublishedDeck: PublishedDeck = await db.collection<PublishedDeck>("published_decks").findOne({ 
          name: existingDeck.name,
        });
        if (existingPublishedDeck) return res.status(409).json({ 
          error: "Conflict", 
          message: "A deck with this name already exists" 
        });
  
        // Create the new deck object with userId
        const newPublishedDeck: PublishedDeck = {
          ...existingDeck,
          name: existingDeck.name,
          published_date: new Date(),
          author: req.user!.name || "Unknown Author",
        };
        delete newPublishedDeck._id;
  
        // Insert the deck into MongoDB
        const result = await db.collection("published_decks").insertOne(newPublishedDeck);
        
        if (!result.insertedId) {
          return res.status(500).json({ 
            error: "Internal server error", 
            message: "Failed to create deck in database" 
          });
        }
        const publishedDeck = await db.collection("published_decks").findOne({ _id: result.insertedId });
  
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