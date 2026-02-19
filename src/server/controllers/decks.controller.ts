import { ExpressApp } from "../interfaces/ExpressTypes";
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import {Response} from 'express';
import { getDatabase } from '../utils/database.util';
import { ObjectId } from 'mongodb';
import { DeckResponse } from "@/shared/interfaces/DeckResponse";

export default function decksController(app: ExpressApp) {
  app.get("/api/decks", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    
    // Filter decks by userId if user is authenticated
    const query = req.user?.id ? { userId: req.user.id } : {};
    const decks = await db.collection("decks").find(query).toArray();
    
    return res.send(decks);
  }
  );
  
  app.get("/api/decks/:deckId", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const deckId = req.params.deckId.toString();
    if (!deckId || deckId === "undefined") return res.status(400).send("Deck ID is required");
    
    let deck;
    if (deckId.length > 6) {
      const query = req.user?.id 
        ? { _id: new ObjectId(deckId), userId: req.user.id }
        : { _id: new ObjectId(deckId) };
      deck = await db.collection("decks").findOne(query);
    } else {
      const query = req.user?.id 
        ? { id: deckId, userId: req.user.id }
        : { id: deckId };
      deck = await db.collection("decks").findOne(query);
    }
    
    if (!deck) {
      return res.status(404).send("Deck not found");
    }
    return res.send(deck);
  }
  );

  app.patch("/api/decks/:deckId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const deckId = req.params.deckId;
    if (!deckId) return res.status(400).send("Deck ID is required");
    
    // Check if deck exists and belongs to user
    const existingDeck = await db.collection("decks").findOne({ 
      _id: new ObjectId(deckId),
      userId: req.user!.id 
    });
    
    if (!existingDeck) {
      return res.status(404).send("Deck not found or you don't have permission to edit this deck");
    }
    
    const updatedDeck = {
      ...req.body,
      updated_at: new Date(),
    };
    delete updatedDeck._id;
    
    const result = await db.collection("decks").updateOne({ 
      _id: new ObjectId(deckId),
      userId: req.user!.id 
    }, {
      $set: {...updatedDeck}
    });
    
    if (result.modifiedCount === 0) {
      return res.status(404).send("Deck not found or no changes made");
    }
    return res.send({...updatedDeck, _id: deckId});
  }
  );

  app.post("/api/decks/:deckId/duplicate", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {

      const db = getDatabase();
      
      // Check if deck with same deckId
      const existingDeck: DeckResponse = await db.collection<DeckResponse>("decks").findOne({ 
        _id: new ObjectId(req.params.deckId),
      });
      if (!existingDeck) {
        return res.status(409).json({ 
          error: "Conflict", 
          message: `cant find deck with deck with id "${req.params.deckId}"` 
        });
      }

      // Create the new deck object with userId
      const newDeck: DeckResponse = {
        ...existingDeck,
        name: existingDeck.name + " Copy",
        created_at: new Date(),
        updated_at: new Date(),
      };
      delete newDeck._id;

      // Insert the deck into MongoDB
      const result = await db.collection("decks").insertOne(newDeck);
      
      if (!result.insertedId) {
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
          _id: result.insertedId,
          name: newDeck.name,
          subtitle: newDeck.subtitle,
          legion: newDeck.legion,
          userId: newDeck.userId,
          created_at: newDeck.created_at
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
      // Input validation
      if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim() === '') {
        return res.status(400).json({ 
          error: "Validation failed", 
          message: "Deck name is required and must be a non-empty string" 
        });
      }

      if (!req.body.legion || typeof req.body.legion !== 'string' || req.body.legion.trim() === '') {
        return res.status(400).json({ 
          error: "Validation failed", 
          message: "Legion is required and must be a non-empty string" 
        });
      }

      const db = getDatabase();
      
      // Check if deck with same name already exists for this user
      const existingDeck = await db.collection("decks").findOne({ 
        name: req.body.name.trim(),
        userId: req.user!.id 
      });
      if (existingDeck) {
        return res.status(409).json({ 
          error: "Conflict", 
          message: `You already have a deck with name "${req.body.name}"` 
        });
      }

      // Create the new deck object with userId
      const newDeck = {
        name: req.body.name.trim(),
        subtitle: "",
        legion: req.body.legion.trim(),
        userId: req.user!.id,
        cards_in_deck: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Insert the deck into MongoDB
      const result = await db.collection("decks").insertOne(newDeck);
      
      if (!result.insertedId) {
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
          _id: result.insertedId,
          name: newDeck.name,
          subtitle: newDeck.subtitle,
          legion: newDeck.legion,
          userId: newDeck.userId,
          created_at: newDeck.created_at
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

  app.delete("/api/decks/:deckId", requireAuth,  async (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const deckId = req.params.deckId;
    if (!deckId) return res.status(400).send("Deck ID is required");
    const result = await db.collection("decks").deleteOne({ 
      _id: new ObjectId(deckId),
      userId: req.user.id
    });
    if (result.deletedCount === 0) {
      return res.status(404).send("Deck not found or you don't have permission to delete this deck");
    }
    return res.send({ success: true });
  });
}